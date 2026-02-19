import { db } from './firebaseConfig';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    limit,
    addDoc,
    updateDoc,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import {
    IngressEvent,
    auditSessionToIngress,
    LegacyAuditSession,
    AuditPayload
} from './ingressAdapter';
import { ChatSummary, AuditResult, CaseData } from '../types';

const sanitize = (obj: any) => {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        console.error("Sanitize error (circular ref?):", e);
        return {};
    }
};

// ============================================================================
// CASE RESOLUTION LOGIC (SCHEMA.md Section 3)
// ============================================================================

const CASE_MERGE_WINDOW_DAYS = 30;

/**
 * Resolves a case based on SCHEMA.md rules:
 * - Same lead_id + Same intent + Same site_id + Window < 30 days => Same Case
 * - Otherwise => New Case
 */
async function resolveCase(
    lead_id: string,
    intent: string,
    site_id: string
): Promise<{ case_id: string; isNew: boolean }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CASE_MERGE_WINDOW_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    // Query for existing case within merge window
    const casesRef = collection(db, "cases");
    const q = query(
        casesRef,
        where("lead_id", "==", lead_id),
        where("intent", "==", intent),
        where("site_id", "==", site_id),
        where("created_at", ">=", cutoffISO),
        orderBy("created_at", "desc"),
        limit(1)
    );

    try {
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Case found within window -> reuse
            const existingCase = snapshot.docs[0];
            console.log(`[resolveCase] Reusing existing case: ${existingCase.id}`);
            return { case_id: existingCase.id, isNew: false };
        }
    } catch (e: any) {
        // Index might not exist yet - fallback to simple query
        console.warn("[resolveCase] Compound query failed, trying simple query:", e.message);

        const simpleQ = query(
            casesRef,
            where("lead_id", "==", lead_id),
            limit(5)
        );
        const simpleSnapshot = await getDocs(simpleQ);

        for (const doc of simpleSnapshot.docs) {
            const data = doc.data();
            if (
                data.intent === intent &&
                data.site_id === site_id &&
                data.created_at >= cutoffISO
            ) {
                console.log(`[resolveCase] Reusing existing case (fallback): ${doc.id}`);
                return { case_id: doc.id, isNew: false };
            }
        }
    }

    // No matching case -> create new
    const newCaseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[resolveCase] Creating new case: ${newCaseId}`);
    return { case_id: newCaseId, isNew: true };
}

// ============================================================================
// EVENT INGESTION (SCHEMA.md Section 4)
// ============================================================================

/**
 * Ingests an event into the new schema:
 * 1. Resolves or creates the case
 * 2. Writes the event to cases/{case_id}/events/{event_id}
 * 3. Updates the case projection (status, last_event_at, etc.)
 */
export async function ingestEvent<T>(event: IngressEvent<T>): Promise<{ case_id: string; event_id: string }> {
    const lead_id = event.identity.email || 'unknown';
    const intent = (event.payload as any)?.visa_type || 'GENERAL';
    const site_id = event.site_id;

    // 1. Resolve Case
    const { case_id, isNew } = await resolveCase(lead_id, intent, site_id);

    // 2. Write Event (Idempotent by event_id)
    const eventRef = doc(db, "cases", case_id, "events", event.event_id);
    await setDoc(eventRef, sanitize(event), { merge: true });
    console.log(`[ingestEvent] Event written: cases/${case_id}/events/${event.event_id}`);

    // 3. Update Case Projection
    const caseRef = doc(db, "cases", case_id);
    const now = new Date().toISOString();

    // Determine new status based on event type
    const statusMap: Record<string, string> = {
        'AUDIT_COMPLETED': 'AUDIT_DONE',
        'CALL_REQUESTED': 'CALL_PENDING',
        'CHAT_SUMMARIZED': 'SUMMARY_READY',
        'APPOINTMENT_BOOKED': 'CALL_SCHEDULED'
    };

    const caseUpdate: Partial<CaseData> = {
        lead_id,
        intent,
        site_id,
        status: statusMap[event.type] || 'ACTIVE',
        last_event_at: event.occurred_at || now,
        confidence_score: (event.payload as any)?.confidence_score || 0,
    };

    if (isNew) {
        // Create new case document
        caseUpdate.case_id = case_id;
        caseUpdate.created_at = now;
        caseUpdate.owner_uid = null;
        caseUpdate.next_action_at = null;
        await setDoc(caseRef, sanitize(caseUpdate));
        console.log(`[ingestEvent] New case created: ${case_id}`);
    } else {
        // Update existing case
        await updateDoc(caseRef, sanitize(caseUpdate));
        console.log(`[ingestEvent] Case updated: ${case_id}`);
    }

    return { case_id, event_id: event.event_id };
}

// ============================================================================
// LEGACY: SAVE SESSION (Dual-Write)
// ============================================================================

export const saveSessionToFirestore = async (email: string, sessionData: any) => {
    if (!email) return;
    try {
        const safeEmail = email.toLowerCase();
        const now = new Date().toISOString();

        // 1. LEAD (Master Entité - CRM) - Keyed by Email - STABLE IDENTIFIER
        const leadData = {
            email: sessionData.userEmail || email,
            source: 'AUDIT_IA_AGENT',
            status: 'NEW_AUDIT',
            updated_at: now
        };

        // 2. AUDIT SESSION (Legacy) - AUTO-GENERATED ID
        const auditData: LegacyAuditSession = {
            email: safeEmail,
            lead_id: safeEmail,
            visa_type: sessionData.visaType || null,
            audit_score: sessionData.auditResult?.confidence_score || 0,
            audit_status: sessionData.auditResult?.audit_status || 'PENDING',
            ai_data: {
                audit_result: sessionData.auditResult || null,
                summary: sessionData.chatSummary || null,
            },
            session_id: sessionData.sessionId || null,
            updated_at: now
        };

        // Extended audit data for legacy collection (includes chat_history)
        const legacyAuditData = {
            ...auditData,
            chat_history: sessionData.messages || [],
        };

        // WRITE LEAD (Idempotent update by Email)
        const leadPromise = setDoc(doc(db, "leads", safeEmail), sanitize(leadData), { merge: true });

        // WRITE AUDIT SESSION (Legacy - Smart Update or Create)
        const auditPromise = (async () => {
            const q = query(
                collection(db, "audit_sessions"),
                where("email", "==", safeEmail),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const docRef = snapshot.docs[0].ref;
                await updateDoc(docRef, sanitize(legacyAuditData));
                console.log("[Legacy] Updated existing session:", docRef.id);
                return docRef.id;
            } else {
                const docRef = await addDoc(collection(db, "audit_sessions"), sanitize(legacyAuditData));
                console.log("[Legacy] Created new session:", docRef.id);
                return docRef.id;
            }
        })();

        // Wait for legacy writes
        const [, legacyDocId] = await Promise.all([leadPromise, auditPromise]);

        // ================================================================
        // 3. DUAL-WRITE: Ingest to new schema (cases/events)
        // ================================================================
        try {
            // Ensure we have a session_id for idempotency
            const sessionIdForIngress = sessionData.sessionId || legacyDocId || `sess_${Date.now()}`;

            // Only ingest if we have meaningful audit data
            if (sessionData.auditResult || sessionData.chatSummary) {
                const ingressEvent = await auditSessionToIngress(
                    { ...auditData, session_id: sessionIdForIngress },
                    {
                        site_id: 'siamvisapro',
                        source_id: sessionIdForIngress,
                        occurred_at: now
                    }
                );

                const { case_id, event_id } = await ingestEvent(ingressEvent);
                console.log(`[Dual-Write] Event ingested: case=${case_id}, event=${event_id}`);

                // Save audit + summary to the case document so HistoryView can display them
                const caseRef = doc(db, "cases", case_id);
                const enrichment: Record<string, any> = {};
                if (sessionData.auditResult) enrichment.audit = sanitize(sessionData.auditResult);
                if (sessionData.chatSummary) enrichment.summary = sanitize(sessionData.chatSummary);
                if (Object.keys(enrichment).length > 0) {
                    await updateDoc(caseRef, enrichment);
                    console.log(`[Dual-Write] Case enriched with audit/summary: ${case_id}`);
                }
            }
        } catch (ingressError: any) {
            // Don't fail the whole save if ingress fails (graceful degradation)
            console.error("[Dual-Write] Ingestion failed (non-blocking):", ingressError.message);
        }

        console.log("Lead & Audit synced for:", safeEmail);
    } catch (e: any) {
        console.error("Error saving to DB:", e);
        throw e; // Rethrow to allow caller (App.tsx) to handle login prompt or error display
    }
};

// ============================================================================
// LEGACY: GET SESSION
// ============================================================================

export const getSessionFromFirestore = async (email: string) => {
    if (!email) return null;
    try {
        const safeEmail = email.toLowerCase();

        // QUERY by Email (New Architecture)
        const q = query(
            collection(db, "audit_sessions"),
            where("email", "==", safeEmail),
            limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return snapshot.docs[0].data();
        }

        // FALLBACK: Compatibility with Old Architecture (Doc ID = Email)
        const oldDocRef = doc(db, "audit_sessions", safeEmail);
        const oldSnap = await getDoc(oldDocRef);
        if (oldSnap.exists()) {
            console.log("Recovered Legacy Session (ID=Email)");
            return oldSnap.data();
        }

        return null;
    } catch (e) {
        console.error("Error reading session from Firestore:", e);
        return null;
    }
};

// ============================================================================
// NEW: GET CASE BY LEAD (for future CRM views)
// ============================================================================

export const getCasesByLead = async (email: string): Promise<CaseData[]> => {
    if (!email) return [];
    try {
        const safeEmail = email.toLowerCase().trim();
        const casesRef = collection(db, "cases");

        // Strategy: Try the optimized query (requires index), fallback to simple query if it fails
        let caseResults: CaseData[] = [];
        try {
            const q = query(
                casesRef,
                where("lead_id", "==", safeEmail),
                orderBy("last_event_at", "desc"),
                limit(20)
            );
            const snapshot = await getDocs(q);
            caseResults = snapshot.docs.map(d => ({ case_id: d.id, ...d.data() } as CaseData));
        } catch (indexError: any) {
            console.warn("[getCasesByLead] Compound query failed, falling back to simple query:", indexError.message);
            const simpleQ = query(casesRef, where("lead_id", "==", safeEmail), limit(50));
            const snapshot = await getDocs(simpleQ);
            caseResults = snapshot.docs.map(d => ({ case_id: d.id, ...d.data() } as CaseData));
        }

        // 2. Fetch from LEGACY audit_sessions (for backward compatibility)
        const legacyRef = collection(db, "audit_sessions");
        const legacyQ = query(legacyRef, where("email", "==", safeEmail), limit(10));
        const legacySnapshot = await getDocs(legacyQ);

        const legacyResults: CaseData[] = legacySnapshot.docs.map(d => {
            const data = d.data();
            return {
                case_id: d.id,
                lead_id: data.email,
                intent: data.visa_type || 'Visa',
                status: data.audit_status || 'LEGACY',
                confidence_score: data.audit_score || 0,
                last_event_at: data.updated_at || new Date().toISOString(),
                created_at: data.updated_at || new Date().toISOString(),
                owner_uid: null,
                site_id: 'siamvisapro',
                next_action_at: null,
                summary: data.ai_data?.summary,
                audit: data.ai_data?.audit_result
            };
        });

        // 3. MERGE & SORT
        // SMART DEDUPLICATION: We prioritize 'cases' (New System). 
        // If a legacy session looks like a duplicate (similar time + same type), hide it.
        const cleanLegacy = legacyResults.filter(legacy => {
            const legacyTime = new Date(legacy.last_event_at || 0).getTime();

            // Check if there is a "twin" in the new case results
            const hasNewTwin = caseResults.some(newCase => {
                const newTime = new Date(newCase.last_event_at || 0).getTime();
                const timeDiff = Math.abs(newTime - legacyTime);
                const isSameIntent = newCase.intent === legacy.intent;

                // Match if same intent and created/updated within 10 minutes (dual-write delay)
                return isSameIntent && timeDiff < 600000;
            });

            return !hasNewTwin;
        });

        const merged = [...caseResults, ...cleanLegacy];

        // Remove duplicates by session_id/case_id if they exist in both (unlikely but safe)
        const unique = Array.from(new Map(merged.map(item => [item.case_id, item])).values());

        return unique.sort((a, b) => {
            const dateA = new Date(a.last_event_at || 0).getTime();
            const dateB = new Date(b.last_event_at || 0).getTime();
            return dateB - dateA;
        }).slice(0, 20);

    } catch (e) {
        console.error("Error fetching cases:", e);
        return [];
    }
};

export const getCaseEvents = async (case_id: string): Promise<IngressEvent[]> => {
    if (!case_id) return [];
    try {
        const eventsRef = collection(db, "cases", case_id, "events");
        const q = query(eventsRef, orderBy("occurred_at", "desc"), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as IngressEvent);
    } catch (e) {
        console.error("Error fetching events:", e);
        return [];
    }
};



export const sendAuditEmail = async (
    to: string,
    summary: ChatSummary,
    audit: AuditResult | null
) => {
    try {
        console.log(`Sending audit email to ${to}...`);
        const mailRef = collection(db, "mail");
        const score = summary.visa_score || audit?.confidence_score || 0;
        const visa = summary.visa_type || audit?.visa_type || 'Visa';
        const auditDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
            <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">Siam Visa Pro</h1>
              <p style="color: #fbbf24; margin: 8px 0 0; font-weight: bold;">Rapport d'Audit Officiel</p>
            </div>

            <div style="padding: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <div>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">Client</p>
                  <p style="margin: 4px 0 0; font-weight: bold; color: #0f172a;">${to}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; font-size: 13px; color: #64748b;">Date de l'audit</p>
                  <p style="margin: 4px 0 0; font-weight: bold; color: #0f172a;">${auditDate}</p>
                </div>
              </div>

              <h2 style="color: #0f172a; margin-top: 0;">Résultat de votre analyse</h2>

              <div style="display: flex; align-items: center; gap: 16px; background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="width: 64px; height: 64px; min-width: 64px; flex-shrink: 0; border-radius: 50%; background: ${score >= 70 ? '#effdf5' : score >= 50 ? '#fffbeb' : '#fef2f2'}; color: ${score >= 70 ? '#15803d' : score >= 50 ? '#b45309' : '#b91c1c'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 2px solid currentColor;">
                  ${score}/100
                </div>
                <div>
                  <p style="margin: 0; font-weight: bold; font-size: 16px;">Visa cible : ${visa}</p>
                  <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Score de confiance global</p>
                </div>
              </div>
    
              <h3>Synthèse Exécutive</h3>
              <p style="line-height: 1.6;">${summary.executive_summary || 'Aucune synthèse disponible.'}</p>
    
              <div style="margin-top: 24px;">
                <h3 style="color: #15803d;">Forces du dossier</h3>
                <ul>
                  ${(summary.strengths || []).map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
    
              <div style="margin-top: 16px;">
                <h3 style="color: #b91c1c;">Points de vigilance</h3>
                <ul>
                  ${(summary.weaknesses || []).map(w => `<li>${w}</li>`).join('')}
                </ul>
              </div>
    
              <h3>Plan d'Action Recommandé</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                ${(summary.action_plan || []).map(step => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0;"><strong>${step.step}</strong></td>
                    <td style="padding: 12px; color: #475569;">${step.description}</td>
                    <td style="padding: 12px 0; text-align: right; font-size: 12px; color: #64748b;">${step.timing}</td>
                  </tr>
                `).join('')}
              </table>
    
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://siamvisapro.com" style="background-color: #fbbf24; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accéder à mon dossier sécurisé</a>
              </div>
            </div>
            
            <div style="text-align: center; padding: 24px; font-size: 12px; color: #94a3b8;">
              <p>© 2024 Siam Visa Pro. Ceci est un document généré par IA à titre informatif.</p>
            </div>
          </div>
        `;

        const textContent = `
Siam Visa Pro - Rapport d'Audit Officiel
----------------------------------------
Client: ${to}
Date: ${auditDate}
Visa cible: ${visa}
Score: ${score}/100

Synthèse:
${summary.executive_summary || ''}

Pour plus de détails, accédez à votre dossier sur https://siamvisapro.com
        `.trim();

        const mailPayload = {
            to: [to, 'info@siamvisapro.com', 'Sophie.bernard168@gmail.com', 'pulsessiontest@gmail.com'],
            message: {
                subject: `Audit Visa Siam Pro - ${visa} (${score}/100)`,
                text: textContent,
                html: htmlContent,
            },
            timestamp: Timestamp.now()
        };

        console.log("[sendAuditEmail] SENDING TO ALL:", mailPayload.to);
        const docRef = await addDoc(mailRef, mailPayload);
        console.log(`Audit email document created: ${docRef.id}`);
    } catch (e) {
        console.error("Error sending audit email:", e);
        throw e; // Rethrow to allow caller to handle UI feedback
    }
};
