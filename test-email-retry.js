
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

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

const sendTest = async () => {
    try {
        console.log("Sending a NEW test email to info@siamvisapro.com...");
        const mailRef = collection(db, "mail");
        const docRef = await addDoc(mailRef, {
            to: ["info@siamvisapro.com"],
            message: {
                subject: "Test Configuration SMTP (2)",
                text: "Ceci est un nouveau test pour vérifier si la configuration SMTP a été corrigée.",
                html: "<h1 style='color: #16a34a;'>Test Configuration corrigée</h1><p>Si vous recevez ce message, votre configuration SMTP est maintenant correcte !</p>",
            },
            timestamp: Timestamp.now()
        });
        console.log(`✅ Email document created with ID: ${docRef.id}`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Error creating email document:", e);
        process.exit(1);
    }
};

sendTest();
