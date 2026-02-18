import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { Phone, Menu, Loader2, AlertCircle, History } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"
import Chat from './components/Chat';
import InputArea from './components/InputArea';
import QualificationStep from './components/QualificationStep';
import PaymentStep from './components/PaymentStep';
import Sidebar from './components/Sidebar';
import AuditScore from './components/AuditScore';

// Lazy Load Heavy Modals
const CallModal = lazy(() => import('./components/CallModal'));
const SummaryView = lazy(() => import('./components/SummaryView'));
const VoiceUpsellModal = lazy(() => import('./components/VoiceUpsellModal'));
const HistoryView = lazy(() => import('./components/HistoryView'));

import { AppStep, FileAttachment } from './types';
import { translations, Language } from './locales/translations';
import { useAuth, useChat, useSummary, useAudit, useSession } from './hooks';
import { saveSessionToFirestore, sendAuditEmail } from './services/dbService';
import { setCurrentUserEmail, setCurrentLanguage } from './services/geminiService';
import { AUDIT_SESSION_KEY } from './contexts/AuthContext';

function App() {
  // Language
  const [language, setLanguage] = useState<Language>('fr');
  const t = translations[language];

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Email capture state (restored from localStorage for persistence)
  const [capturedEmail, setCapturedEmail] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.userEmail || '';
      }
    } catch { }
    return '';
  });

  // Custom Hooks
  const { userEmail, login, logout } = useAuth();
  const { messages, setMessages, isTyping, addMessage, sendMessage, appendTranscript } = useChat();
  const { chatSummary, setChatSummary, isGeneratingSummary, generateSummary } = useSummary();
  const {
    step, setStep,
    visaType, setVisaType,
    auditResult, setAuditResult,
    callPayload, setCallPayload,
    handleVisaSelect: baseHandleVisaSelect,
    requestCall,
    updateAuditFromResponse,
  } = useAudit();

  // Google OAuth email takes priority over manually captured email
  const effectiveEmail = userEmail || (capturedEmail.trim() || null);

  // Keep geminiService in sync with current email
  useEffect(() => {
    setCurrentUserEmail(effectiveEmail);
  }, [effectiveEmail]);

  // Keep geminiService in sync with current language
  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const {
    sessionId,
    isSessionLoaded,
    isLoadingApp,
    initializationError,
    clearSession,
  } = useSession({
    messages, setMessages,
    step, setStep,
    visaType, setVisaType,
    auditResult, setAuditResult,
    chatSummary,
    userEmail: effectiveEmail,
    language,
    addMessage,
  });

  // Handlers
  const handleVisaSelect = (type: typeof visaType) => {
    baseHandleVisaSelect(type);
    setIsUpsellOpen(true);
  };

  const handleUpsellAccept = () => {
    setIsUpsellOpen(false);
    addMessage('📞 Lancement de l\'audit vocal...', 'system');
    requestCall();
  };

  const handleUpsellDecline = () => {
    setIsUpsellOpen(false);
    const msg = t.upsell_decline_msg.replace('{visaType}', visaType || 'Tourist');
    handleUserMessage(msg, []);
  };

  const handleGoogleLogin = async () => {
    try {
      const email = await login();
      if (email) {
        alert(`Connexion réussie : ${email}`);
        saveSessionToFirestore(email, {
          sessionId, messages, step, visaType, auditResult, chatSummary, userEmail: email, timestamp: Date.now()
        });
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // Clears Firebase + localStorage automatically
      window.location.reload();
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const handleUserMessage = async (text: string, files: FileAttachment[]) => {
    const response = await sendMessage(text, files);
    if (response?.auditResult) {
      updateAuditFromResponse(response.auditResult);
    }
    if (response?.action?.action === 'request_call') {
      setCallPayload(response.action.payload);
    }
  };

  const handleManualCallRequest = () => {
    requestCall();
    setIsMobileMenuOpen(false);
  };

  const lastEmailSentRef = useRef<string | null>(null);
  const isEmailSendingRef = useRef(false);

  const handleGenerateSummary = async () => {
    if (isEmailSendingRef.current) return;

    try {
      isEmailSendingRef.current = true;
      const summary = await generateSummary();
      setIsMobileMenuOpen(false);

      if (!summary) {
        alert("L'IA n'a pas pu générer de synthèse. Veuillez ajouter quelques messages à la conversation.");
        return;
      }

      if (!effectiveEmail) {
        alert("Veuillez renseigner votre email pour recevoir le rapport.");
        return;
      }

      await sendAuditEmail(effectiveEmail, summary, auditResult);
      addMessage("📧 Une copie officielle de votre audit a été envoyée par email.", 'system');

    } catch (error: any) {
      console.error("Summary/Email error:", error);
      if (error.message?.includes("Permission denied") || error.code === 'permission-denied') {
        alert("Erreur de permission : Impossible d'envoyer l'email. Veuillez vous connecter.");
      } else {
        alert("Une erreur est survenue lors de l'envoi de l'email : " + (error.message || "Erreur inconnue"));
      }
    } finally {
      isEmailSendingRef.current = false;
    }
  };

  const handleCallClose = async (transcript?: string) => {
    setCallPayload(null);
    if (transcript) {
      appendTranscript(transcript);
      // Add a small delay to ensure chat history is updated before summary
      setTimeout(() => {
        handleGenerateSummary();
      }, 500);
    }
  };

  // Build chat context for call modal
  const buildChatContext = () => {
    const auditContext = auditResult ? `[RÉSULTAT TECHNIQUE AUDIT] :
- Type Visa : ${auditResult.visa_type}
- Score Confiance : ${auditResult.confidence_score}/100
- Statut : ${auditResult.audit_status}
- Documents Manquants : ${auditResult.missing_docs?.join(', ') || 'Aucun'}
- Problèmes Identifiés : ${auditResult.issues?.join(', ') || 'Aucun'}
` : '';

    const messagesContext = messages.map(m =>
      `[${m.sender === 'user' ? 'CLIENT' : 'TOI (AI)'}]: ${m.text}`
    ).join('\n');

    return `${auditContext}[HISTORIQUE DES MESSAGES] :\n${messagesContext}`;
  };



  // Loading State
  if (isLoadingApp) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-brand-navy text-white">
        {initializationError ? (
          <div className="p-6 text-center max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-sm font-medium">{initializationError}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-brand-amber underline text-xs">Réessayer</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-brand-amber" />
            <p className="text-slate-400 text-sm animate-pulse tracking-widest uppercase">{t.loading_app}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-brand-light overflow-hidden">
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        language={language}
        setLanguage={setLanguage}
        handleManualCallRequest={handleManualCallRequest}
        step={step}
        setIsHistoryOpen={setIsHistoryOpen}
        handleGenerateSummary={handleGenerateSummary}
        isGeneratingSummary={isGeneratingSummary}
        messages={messages}
        userEmail={effectiveEmail}
        handleGoogleLogin={handleGoogleLogin}
        handleLogout={handleLogout}
        clearSession={clearSession}
      />

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Mobile Header */}
        <header className="flex-none bg-brand-navy p-4 flex items-center justify-between md:hidden border-b border-slate-800 z-30 shadow-md">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 -ml-2">
            <Menu size={24} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-brand-amber font-black uppercase tracking-[0.2em] mb-0.5">Siam Visa Pro</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-xs">
                {step === AppStep.QUALIFICATION ? t.nav_qualification : step === AppStep.AUDIT ? t.nav_audit : t.nav_payment}
              </span>
              <div className="flex gap-0.5">
                <div className={`w-1 h-1 rounded-full ${step === AppStep.QUALIFICATION ? 'bg-brand-amber' : 'bg-green-500'}`} />
                <div className={`w-1 h-1 rounded-full ${step === AppStep.AUDIT ? 'bg-brand-amber' : step === AppStep.PAYMENT ? 'bg-green-500' : 'bg-slate-700'}`} />
                <div className={`w-1 h-1 rounded-full ${step === AppStep.PAYMENT ? 'bg-brand-amber' : 'bg-slate-700'}`} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-brand-amber border border-slate-700 shadow-lg active:scale-95 transition-transform"
              title={t.history_title}
            >
              <History size={20} />
            </button>
            <button
              onClick={handleManualCallRequest}
              className="w-10 h-10 rounded-full border-2 border-brand-amber overflow-hidden bg-white shadow-lg relative group active:scale-95 transition-transform"
            >
              <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Expert" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10 group-active:bg-brand-amber/30 transition-colors" />
              <div className="absolute bottom-0 right-0 bg-brand-amber text-brand-navy p-0.5 rounded-full border border-white">
                <Phone size={10} />
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Qualification Overlay */}
          {step === AppStep.QUALIFICATION && messages.length < 3 && (
            <QualificationStep
              lang={language}
              onVisaSelect={handleVisaSelect}
              visaType={visaType}
              capturedEmail={capturedEmail}
              setCapturedEmail={setCapturedEmail}
              userEmail={userEmail}
            />
          )}

          {/* Payment Overlay replaced by Human Auditor Confirmation */}
          {step === AppStep.PAYMENT && (
            <div className="absolute inset-0 z-50 bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-amber via-brand-blue to-brand-amber animate-pulse"></div>

                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-bounce">
                  <Phone size={40} />
                </div>

                <h2 className="text-2xl font-black text-brand-navy mb-2">
                  {language === 'fr' ? 'Audit Validé !' : 'Audit Validated!'}
                </h2>
                <p className="text-slate-500 mb-8 px-4">
                  {language === 'fr'
                    ? 'Votre dossier a été transmis à notre équipe d\'experts. Un auditeur humain va prendre le relais pour finaliser votre stratégie.'
                    : 'Your file has been sent to our expert team. A human auditor will take over to finalize your strategy.'}
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
                  <p className="text-sm text-brand-blue font-bold flex items-center justify-center gap-2">
                    <History className="w-4 h-4" />
                    {language === 'fr' ? 'Rendez-vous confirmé' : 'Appointment confirmed'}
                  </p>
                  <p className="text-xs text-brand-blue/70 mt-1">
                    {language === 'fr' ? 'Vous serez contacté sous 24h.' : 'You will be contacted within 24h.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="w-full py-4 bg-brand-amber text-brand-navy font-bold rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-amber/20"
                  >
                    <History size={20} />
                    {language === 'fr' ? 'Voir mon dossier complet' : 'View my full file'}
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 text-slate-400 text-sm hover:text-brand-navy underline"
                  >
                    {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {auditResult && step === AppStep.AUDIT && (
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex-none overflow-y-auto max-h-[35%] shadow-sm">
                <div className="max-w-3xl mx-auto">
                  <AuditScore result={auditResult} lang={language} />
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <Chat messages={messages} isTyping={isTyping} lang={language} />
            </div>

            <div className="flex-none">
              <InputArea onSendMessage={handleUserMessage} disabled={step === AppStep.PAYMENT} lang={language} />
            </div>
          </div>
        </main>

        <Suspense fallback={null}>
          {/* History Modal */}
          {isHistoryOpen && (
            <div className="absolute inset-0 z-[100] bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
              <HistoryView
                email={effectiveEmail || ''}
                lang={language}
                onClose={() => setIsHistoryOpen(false)}
              />
            </div>
          )}

          {/* Summary Modal */}
          {chatSummary && (
            <div className="absolute inset-0 z-40 bg-brand-light/95 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
              <div className="max-w-5xl mx-auto">
                <SummaryView summary={chatSummary} onClose={() => setChatSummary(null)} lang={language} />
              </div>
            </div>
          )}

          {/* Voice Upsell Modal */}
          <VoiceUpsellModal
            isOpen={isUpsellOpen}
            onClose={handleUpsellDecline}
            onAccept={handleUpsellAccept}
            onDecline={handleUpsellDecline}
            lang={language}
          />

          {/* Call Modal */}
          {callPayload && (
            <CallModal
              payload={callPayload}
              lang={language}
              chatContext={buildChatContext()}
              onClose={handleCallClose}
            />
          )}
        </Suspense>
      </div>
      <Analytics />
    </div>
  );
}

export default App;
