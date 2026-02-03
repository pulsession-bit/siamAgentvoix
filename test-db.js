
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Config from your .env.local
const firebaseConfig = {
    apiKey: "AIzaSyBI6xZBISM4miz9tE-yYrbOKV4RabiE648",
    authDomain: "call-center-lead-dc450.firebaseapp.com",
    projectId: "call-center-lead-dc450",
    storageBucket: "call-center-lead-dc450.firebasestorage.app",
    messagingSenderId: "622593516264",
    appId: "1:622593516264:web:0785c626d45529f3595f5d",
    measurementId: "G-SPPNR4KM76"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testPush = async () => {
    const email = `test-agent-bot-${Date.now()}@test.com`;
    const safeId = email.toLowerCase();
    const now = new Date().toISOString();

    console.log(`🚀 Starting Test Push for: ${email}`);

    // 1. LEAD
    const leadData = {
        email: email,
        source: 'TEST_SCRIPT',
        status: 'TEST',
        updated_at: now
    };

    // 2. AUDIT
    const auditData = {
        lead_id: safeId,
        visa_type: 'TEST_VISA',
        audit_score: 99,
        audit_status: 'TEST_OK',
        created_by: 'Antigravity Agent',
        ai_data: {
            audit_result: { confidence_score: 99, audit_status: 'VALID' },
            summary: { overall_status: 'EXCELLENT' }
        },
        chat_history: [
            { sender: 'user', text: 'Ceci est un test DB' },
            { sender: 'agent', text: 'Test reçu 5/5' }
        ],
        updated_at: now
    };

    try {
        console.log("Writing to 'leads'...");
        await setDoc(doc(db, "leads", safeId), leadData);
        console.log("✅ Lead Write Success!");

        console.log("Writing to 'audit_sessions'...");
        await setDoc(doc(db, "audit_sessions", safeId), auditData);
        console.log("✅ Audit Write Success!");

        console.log("🎉 TEST COMPLETE. Check Firebase Console now.");
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR:", e);
        process.exit(1);
    }
};

testPush();
