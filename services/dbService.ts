import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, addDoc, updateDoc } from 'firebase/firestore';

const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj));

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

        // 2. AUDIT SESSION (Technical) - AUTO-GENERATED ID
        // Uses 'email' field for querying, NOT as doc ID.
        const auditData = {
            email: safeEmail,
            lead_id: safeEmail,
            visa_type: sessionData.visaType || null,
            audit_score: sessionData.auditResult?.confidence_score || 0,
            audit_status: sessionData.auditResult?.audit_status || 'PENDING',

            ai_data: {
                audit_result: sessionData.auditResult || null,
                summary: sessionData.chatSummary || null,
            },

            chat_history: sessionData.messages || [],
            session_id: sessionData.sessionId || null,
            updated_at: now
        };

        // WRITE LEAD (Idempotent update by Email)
        const leadPromise = setDoc(doc(db, "leads", safeEmail), sanitize(leadData), { merge: true });

        // WRITE AUDIT SESSION (Smart Update or Create)
        const auditPromise = (async () => {
            // Look for an existing session for this email
            // Limit 1, because we only care about the latest active one for now in this simple flow.
            const q = query(
                collection(db, "audit_sessions"),
                where("email", "==", safeEmail),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // UPDATE existing session
                const docRef = snapshot.docs[0].ref;
                await updateDoc(docRef, sanitize(auditData));
                console.log("Updated existing session:", docRef.id);
            } else {
                // CREATE new session (Auto-ID)
                const docRef = await addDoc(collection(db, "audit_sessions"), sanitize(auditData));
                console.log("Created new session:", docRef.id);
            }
        })();

        await Promise.all([leadPromise, auditPromise]);

        console.log("Lead & Audit synced for:", safeEmail);
    } catch (e: any) {
        console.error("Error saving to DB:", e);
        if (e.code !== 'permission-denied') {
            // alert("Erreur Sauvegarde Cloud: " + e.message); // Suppressed for better UX on permission error
            console.warn("Save failed:", e.message);
        }
    }
};

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
        // If query failed (no field 'email'), check if doc 'email' exists?
        // Actually, 'where email == safeEmail' is robust IF the field exists.
        // Let's manually check the "Old Way" just in case migration is partial.
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
}
