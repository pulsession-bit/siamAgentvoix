export type Language = 'fr' | 'en';

export const translations = {
    fr: {
        // General
        loading_app: "Chargement de l'expert...",
        loading_error: "Erreur d'initialisation",
        analysis_error: "Une erreur technique est survenue lors de l'analyse. Veuillez réessayer. (Réinitialisation session)",

        // Live Transcript
        transcript_user: "Moi",
        transcript_agent: "Agent",

        // Sidebar
        reset_audit: "Réinitialiser l'audit",
        reset_confirm: "Voulez-vous vraiment effacer tout l'historique et recommencer ?",
        logout: "Se déconnecter",
        login_btn: "Connexion Google",

        // Welcome
        welcome_msg: "Bonjour et bienvenue sur **Siam Visa Pro**.\n\nJe suis votre assistant expert en visas pour la Thaïlande. Mon rôle est de :\n1. Vous aider à choisir le bon visa.\n2. Vérifier votre dossier (Audit).\n3. Maximiser vos chances d'approbation.\n\nPour commencer, dites-moi :\n- Quelle est votre **nationalité** ?\n- Quel est le **but de votre séjour** (tourisme, travail, retraite...) ?\n- Combien de temps comptez-vous rester ?",

        // Chat
        auditor_analyzing: "L'auditeur analyse...",
        agent_name: "Expert Visa",
        user_name: "Vous",

        // Voice Upsell
        upsell_title: "Passez à la vitesse supérieure",
        upsell_desc: "Notre expert IA vocal peut qualifier votre dossier <strong>3x plus vite</strong> qu'à l'écrit. Voulez-vous essayer l'expérience vocale ?",
        upsell_accept: "Oui, démarrer l'appel (Recommandé)",
        upsell_decline: "Non, je préfère écrire",
        upsell_start_msg: "📞 Lancement de l'audit vocal...",
        upsell_decline_msg: "Je souhaite postuler pour un visa {visaType}.",

        // Call Modal
        call_active: "Appel en cours...",
        call_ended: "Appel terminé",
        mic_error: "Microphone inaccessible",
        end_call_btn: "Raccrocher",
        call_secure_channel: "Canal Sécurisé",
        call_ready: "Prêt à discuter ?",
        call_default_topic: "Nous allons clarifier votre dossier ensemble.",
        call_subject: "Sujet de l'appel",
        call_start_btn: "Lancer l'appel",
        call_connecting: "Établissement de la connexion...",
        call_waiting_speech: "En attente de parole...",
        call_error_title: "Échec de la connexion",
        call_error_desc: "Impossible d'établir la liaison avec l'agent vocal. Vérifiez votre micro ou réessayez plus tard.",
        call_close_btn: "Fermer",

        // Summary
        summary_title: "Synthèse de l'Audit",
        generating_summary: "Génération de votre synthèse officielle...",
    },
    en: {
        // General
        loading_app: "Loading expert...",
        loading_error: "Initialization Error",
        analysis_error: "A technical error occurred during analysis. Please try again. (Session Reset)",

        // Live Transcript
        transcript_user: "Me",
        transcript_agent: "Agent",

        // Sidebar
        reset_audit: "Reset Audit",
        reset_confirm: "Do you really want to clear history and restart?",
        logout: "Logout",
        login_btn: "Google Login",

        // Welcome
        welcome_msg: "Hello and welcome to **Siam Visa Pro**.\n\nI am your expert visa assistant for Thailand. My role is to:\n1. Help you choose the right visa.\n2. Verify your application (Audit).\n3. Maximize your chances of approval.\n\nTo start, tell me:\n- What is your **nationality**?\n- What is the **purpose of your stay** (tourism, work, retirement...)?\n- How long do you plan to stay?",

        // Chat
        auditor_analyzing: "Auditor is analyzing...",
        agent_name: "Visa Expert",
        user_name: "You",

        // Voice Upsell
        upsell_title: "Speed up the process",
        upsell_desc: "Our Voice AI expert can qualify your application <strong>3x faster</strong> than typing. Do you want to try the voice experience?",
        upsell_accept: "Yes, start call (Recommended)",
        upsell_decline: "No, I prefer typing",
        upsell_start_msg: "📞 Starting Voice Audit...",
        upsell_decline_msg: "I wish to apply for a {visaType} visa.",

        // Call Modal
        call_active: "Call in progress...",
        call_ended: "Call ended",
        mic_error: "Microphone inaccessible",
        end_call_btn: "Hang up",
        call_secure_channel: "Secure Channel",
        call_ready: "Ready to talk?",
        call_default_topic: "We will clarify your file together.",
        call_subject: "Call Subject",
        call_start_btn: "Start Call",
        call_connecting: "Connecting...",
        call_waiting_speech: "Waiting for speech...",
        call_error_title: "Connection Failed",
        call_error_desc: "Unable to connect to the voice agent. Check your microphone or try again later.",
        call_close_btn: "Close",

        // Summary
        summary_title: "Audit Summary",
        generating_summary: "Generating your official summary...",
    }
};
