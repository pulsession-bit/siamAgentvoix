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
        save_file: "Sauvegarder mon dossier",

        // Navigation Steps
        nav_qualification: "Qualification",
        nav_qualification_desc: "Sélection du type de visa",
        nav_audit: "Audit IA",
        nav_audit_desc: "Vérification documentaire",
        nav_payment: "Validation",
        nav_payment_desc: "Paiement & Dépôt",

        // Sidebar CTA
        cta_live_support: "Assistance Live",
        cta_expert: "Parler à un expert",

        // Input Area
        input_placeholder: "Décrivez votre situation...",
        input_listening: "Écoute en cours...",
        mic_start: "Dicter un message",
        mic_stop: "Arrêter d'écouter",
        mic_denied: "Accès au microphone refusé. Veuillez vérifier les permissions de votre navigateur.",

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

        // Audit Section
        audit_title: "Audit Visa",
        audit_subtitle: "Sélectionnez votre type de visa pour commencer l'analyse de conformité.",
        email_label: "Votre email pour recevoir les résultats de l'audit",
        email_placeholder: "votre@email.com",
        email_error: "Veuillez entrer un email valide.",
        email_confirmed: "Email confirmé",

        // Visa Options
        visa_expat_label: "Relocation & Expatriation",
        visa_expat_desc: "Accompagnement VIP : Visa, Logement, École, Banque & Installation",
        visa_dtv_label: "DTV Visa",
        visa_dtv_desc: "Nomades digitaux, Muay Thai, Cuisine",
        visa_retire_label: "Retraite (O-A/O-X)",
        visa_retire_desc: "+50 ans, Longue durée",
        visa_tourist_label: "Tourisme (TR)",
        visa_tourist_desc: "Séjour < 60 jours",
        visa_business_label: "Business (Non-B)",
        visa_business_desc: "Travail et Création Entreprise",


        // Summary
        summary_title: "Synthèse de l'Audit",
        generating_summary: "Génération de votre synthèse officielle...",
        summary_subtitle: "Analyse détaillée du profil et recommandations",
        val_targeted_visa: "Visa Ciblé",
        val_visa_score: "Visa Score",
        val_status_solid: "Dossier Solide",
        val_status_risky: "Prudence Requise",
        val_status_high_risk: "Risque Élevé",
        val_synthesis: "Synthèse",
        val_strengths: "Points Forts",
        val_weaknesses: "Points d'Attention",
        val_action_plan: "Plan d'Action Recommandé",
        val_docs_required: "Documents Clés à Préparer",
        btn_hide_summary: "Masquer la synthèse",

        // Audit Score
        audit_score_confidence: "Confiance",
        audit_status_valid: "Dossier Conforme",
        audit_status_invalid: "Dossier Incomplet",
        audit_status_pending: "Analyse en cours",
        audit_corrections_required: "Corrections requises :",
        audit_missing_docs: "Documents manquants :",
        audit_success_msg: "Tous les feux sont au vert. Vous pouvez procéder au paiement sécurisé pour finaliser votre demande.",

        // History
        history_title: "Mes Audits",
        history_empty: "Aucun audit trouvé.",
        history_back: "Retour au chat",
        history_date: "Date",
        history_visa: "Visa",
        history_score: "Score",
        history_status: "Statut",
        history_view: "Voir détails",
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
        save_file: "Save my file",

        // Navigation Steps
        nav_qualification: "Qualification",
        nav_qualification_desc: "Visa Type Selection",
        nav_audit: "AI Audit",
        nav_audit_desc: "Document Verification",
        nav_payment: "Validation",
        nav_payment_desc: "Payment & Submission",

        // Sidebar CTA
        cta_live_support: "Live Support",
        cta_expert: "Talk to an expert",

        // Input Area
        input_placeholder: "Describe your situation...",
        input_listening: "Listening...",
        mic_start: "Dictate a message",
        mic_stop: "Stop listening",
        mic_denied: "Microphone access denied. Please check your browser permissions.",

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
        // Audit Section
        audit_title: "Visa Audit",
        audit_subtitle: "Select your visa type to start the compliance analysis.",
        email_label: "Your email to receive audit results",
        email_placeholder: "your@email.com",
        email_error: "Please enter a valid email.",
        email_confirmed: "Email confirmed",

        // Visa Options
        visa_expat_label: "Relocation & Expatriation",
        visa_expat_desc: "VIP Support: Visa, Housing, School, Bank & Setup",
        visa_dtv_label: "DTV Visa",
        visa_dtv_desc: "Digital Nomads, Muay Thai, Cooking",
        visa_retire_label: "Retirement (O-A/O-X)",
        visa_retire_desc: "+50 years, Long Stay",
        visa_tourist_label: "Tourism (TR)",
        visa_tourist_desc: "Stay < 60 days",
        visa_business_label: "Business (Non-B)",
        visa_business_desc: "Work and Business Creation",

        // Summary
        summary_title: "Audit Summary",
        generating_summary: "Generating your official summary...",
        summary_subtitle: "Detailed profile analysis and recommendations",
        val_targeted_visa: "Targeted Visa",
        val_visa_score: "Visa Score",
        val_status_solid: "Strong Application",
        val_status_risky: "Caution Required",
        val_status_high_risk: "High Risk",
        val_synthesis: "Summary",
        val_strengths: "Strengths",
        val_weaknesses: "Attention Points",
        val_action_plan: "Recommended Action Plan",
        val_docs_required: "Key Documents to Prepare",
        btn_hide_summary: "Hide Summary",

        // Audit Score
        audit_score_confidence: "Confidence",
        audit_status_valid: "Valid Application",
        audit_status_invalid: "Incomplete Application",
        audit_status_pending: "Analysis in Progress",
        audit_corrections_required: "Corrections required:",
        audit_missing_docs: "Missing documents:",
        audit_success_msg: "All lights are green. You can proceed to secure payment to finalize your application.",

        // History
        history_title: "My Audits",
        history_empty: "No audits found.",
        history_back: "Back to chat",
        history_date: "Date",
        history_visa: "Visa",
        history_score: "Score",
        history_status: "Status",
        history_view: "View details",
    }
};
