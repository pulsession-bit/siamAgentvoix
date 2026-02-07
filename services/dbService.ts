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

interface CaseData {
    case_id: string;
    lead_id: string;
    intent: string;
    status: string;
    owner_uid: string | null;
    site_id: string;
    confidence_score: number;
    last_event_at: string;
    next_action_at: string | null;
    created_at: string;
}

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
                const ingressEvent = auditSessionToIngress(
                    { ...auditData, session_id: sessionIdForIngress },
                    {
                        site_id: 'siamvisapro',
                        source_id: sessionIdForIngress,
                        occurred_at: now
                    }
                );

                const { case_id, event_id } = await ingestEvent(ingressEvent);
                console.log(`[Dual-Write] Event ingested: case=${case_id}, event=${event_id}`);
            }
        } catch (ingressError: any) {
            // Don't fail the whole save if ingress fails (graceful degradation)
            console.error("[Dual-Write] Ingestion failed (non-blocking):", ingressError.message);
        }

        console.log("Lead & Audit synced for:", safeEmail);
    } catch (e: any) {
        console.error("Error saving to DB:", e);
        if (e.code !== 'permission-denied') {
            console.warn("Save failed:", e.message);
        }
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
        const safeEmail = email.toLowerCase();
        const q = query(
            collection(db, "cases"),
            where("lead_id", "==", safeEmail),
            orderBy("last_event_at", "desc"),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ case_id: d.id, ...d.data() } as CaseData));
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
