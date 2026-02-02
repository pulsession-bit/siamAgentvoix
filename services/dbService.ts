import { db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const saveSessionToFirestore = async (email: string, sessionData: any) => {
    if (!email) return;
    try {
        // Sanitize email to be used as doc ID (or just use email if valid, typically we strip special chars or use a hash, but direct email is often OK for IDs if no '/' present)
        // Firestore IDs cannot contain forward slashes. Emails don't have them usually.
        const safeId = email.toLowerCase();

        // We store in 'audit_sessions' collection
        await setDoc(doc(db, "audit_sessions", safeId), {
            ...sessionData,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        console.log("Session saved to Firestore for", email);
    } catch (e) {
        console.error("Error saving session to Firestore:", e);
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
