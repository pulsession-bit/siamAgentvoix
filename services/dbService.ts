import { db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj));

export const saveSessionToFirestore = async (email: string, sessionData: any) => {
    if (!email) return;
    try {
        const safeId = email.toLowerCase(); // Common Key
        const now = new Date().toISOString();

        // 1. LEAD (Master Entité - CRM)
        const leadData = {
            email: sessionData.userEmail || email,
            source: 'AUDIT_IA_AGENT',
            status: 'NEW_AUDIT',
            updated_at: now
            // We use merge: true, so we don't wipe existing lead info
        };

        // 2. AUDIT (Entité Technique - Expert)
        const auditData = {
            lead_id: safeId, // Foreign Key -> leads/{email}
            visa_type: sessionData.visaType || null,
            audit_score: sessionData.auditResult?.confidence_score || 0,
            audit_status: sessionData.auditResult?.audit_status || 'PENDING',

            // Technical details
            ai_data: {
                audit_result: sessionData.auditResult || null,
                summary: sessionData.chatSummary || null,
            },

            // History / Evidence
            chat_history: sessionData.messages || [],
            session_id: sessionData.sessionId || null,

            updated_at: now
        };

        // Parallel Writes
        await Promise.all([
            setDoc(doc(db, "leads", safeId), sanitize(leadData), { merge: true }),
            setDoc(doc(db, "audit_sessions", safeId), sanitize(auditData), { merge: true })
        ]);

        console.log("Lead & Audit synced for:", safeId);
    } catch (e: any) {
        console.error("Error saving to DB:", e);
        if (e.code !== 'permission-denied') {
            alert("Erreur Sauvegarde Cloud: " + e.message);
        }
    }
};

export const getSessionFromFirestore = async (email: string) => {
    if (!email) return null;
    try {
        const safeId = email.toLowerCase();
        const docRef = doc(db, "audit_sessions", safeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (e) {
        console.error("Error reading session from Firestore:", e);
        return null;
    }
}
