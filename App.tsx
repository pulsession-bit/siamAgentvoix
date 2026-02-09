import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ShieldCheck, FileText, CreditCard, Phone, Menu, X, Trash2, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"
import Chat from './components/Chat';
import InputArea from './components/InputArea';
import QualificationStep from './components/QualificationStep';
import AuditScore from './components/AuditScore';

// Lazy Load Heavy Modals
const CallModal = lazy(() => import('./components/CallModal'));
const SummaryView = lazy(() => import('./components/SummaryView'));
const VoiceUpsellModal = lazy(() => import('./components/VoiceUpsellModal'));

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

  const handleGenerateSummary = async () => {
    try {
      const summary = await generateSummary();
      setIsMobileMenuOpen(false);

      if (summary && effectiveEmail) {
        sendAuditEmail(effectiveEmail, summary, auditResult).then(() => {
          addMessage("📧 Une copie officielle de votre audit a été envoyée par email.", 'system');
        }).catch(err => console.error("Email send failed", err));
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCallClose = async (transcript?: string) => {
    setCallPayload(null);
    if (transcript) {
      appendTranscript(transcript);
      await handleGenerateSummary();
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

  // Sidebar Component
  const renderSidebar = () => (
    <aside className={`
      fixed inset-0 z-[60] md:static md:inset-auto w-full md:w-80 bg-brand-navy flex flex-col h-full transition-transform duration-300
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-amber rounded-lg flex items-center justify-center text-brand-navy shadow-lg shadow-brand-amber/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="font-bold text-white text-lg block leading-none">Siam Visa Pro</span>
              <span className="text-[10px] text-brand-amber font-bold uppercase tracking-widest mt-1 block">Audit AI Agent</span>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setLanguage('fr')} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${language === 'fr' ? 'bg-brand-amber text-brand-navy border-brand-amber' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}>FR</button>
                <button onClick={() => setLanguage('en')} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${language === 'en' ? 'bg-brand-amber text-brand-navy border-brand-amber' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}>EN</button>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        {/* Expert CTA */}
        <div className="mb-6">
          <button
            onClick={handleManualCallRequest}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-brand-amber to-brand-yellow rounded-xl p-[2px] shadow-lg hover:shadow-brand-amber/20 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="bg-brand-navy rounded-[10px] p-3 flex items-center gap-3 h-full">
              <div className="w-10 h-10 rounded-full border border-brand-amber/50 overflow-hidden bg-white flex-shrink-0">
                <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Expert" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="text-[9px] text-brand-amber font-bold uppercase tracking-wider mb-0.5">Assistance Live</div>
                <div className="text-white font-bold text-sm truncate">Parler à un expert</div>
              </div>

              <div className="bg-brand-amber text-brand-navy p-2 rounded-full animate-pulse shadow-sm">
                <Phone size={16} />
              </div>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-6 flex-1">
          <StepItem active={step === AppStep.QUALIFICATION} completed={step !== AppStep.QUALIFICATION} label="Qualification" desc="Sélection du type de visa" icon={<FileText size={18} />} />
          <StepItem active={step === AppStep.AUDIT} completed={step === AppStep.PAYMENT} label="Audit IA" desc="Vérification documentaire" icon={<ShieldCheck size={18} />} />
          <StepItem active={step === AppStep.PAYMENT} completed={false} label="Validation" desc="Paiement & Dépôt" icon={<CreditCard size={18} />} />
        </nav>

        {/* Footer */}
        <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary || messages.length < 5}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors border
              ${isGeneratingSummary ? 'bg-slate-800 text-slate-500 border-transparent cursor-wait' : 'bg-transparent text-brand-amber border-brand-amber/30 hover:bg-brand-amber/10'}
              ${messages.length < 5 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isGeneratingSummary ? <Loader2 size={14} className="animate-spin" /> : <FileText size={16} />}
            {isGeneratingSummary ? 'Génération...' : "Synthèse de l'Audit"}
          </button>

          {!userEmail ? (
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-brand-navy py-3 rounded-xl font-bold text-xs shadow-md hover:bg-slate-100 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" alt="G" className="w-3 h-3" />
              Sauvegarder mon dossier
            </button>
          ) : (
            <div className="w-full space-y-2">
              <div className="text-[10px] text-slate-500 text-center truncate px-2">{userEmail}</div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold text-xs hover:bg-red-900/20 hover:text-red-400 transition-colors"
              >
                <LogOut size={14} />
                Se déconnecter
              </button>
            </div>
          )}


          <button
            onClick={clearSession}
            className="w-full py-3 text-slate-500 text-xs flex items-center justify-center gap-2 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} /> Réinitialiser l'audit
          </button>

        </div>

        <div className="mt-4 text-center">
          <span className="text-[9px] text-slate-600 uppercase tracking-tighter">System Status: <span className="text-green-500">Online</span></span>
        </div>
      </div>
    </aside>
  );

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
            <p className="text-slate-400 text-sm animate-pulse tracking-widest uppercase">Initialisation de l'audit...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-brand-light overflow-hidden">
      {renderSidebar()}

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
                {step === AppStep.QUALIFICATION ? 'Qualification' : step === AppStep.AUDIT ? 'Audit IA' : 'Validation'}
              </span>
              <div className="flex gap-0.5">
                <div className={`w-1 h-1 rounded-full ${step === AppStep.QUALIFICATION ? 'bg-brand-amber' : 'bg-green-500'}`} />
                <div className={`w-1 h-1 rounded-full ${step === AppStep.AUDIT ? 'bg-brand-amber' : step === AppStep.PAYMENT ? 'bg-green-500' : 'bg-slate-700'}`} />
                <div className={`w-1 h-1 rounded-full ${step === AppStep.PAYMENT ? 'bg-brand-amber' : 'bg-slate-700'}`} />
              </div>
            </div>
          </div>
          <button
            onClick={handleManualCallRequest}
            className="w-10 h-10 rounded-full border-2 border-brand-amber overflow-hidden bg-white shadow-lg relative group"
          >
            <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Expert" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10 group-active:bg-brand-amber/30 transition-colors" />
            <div className="absolute bottom-0 right-0 bg-brand-amber text-brand-navy p-0.5 rounded-full border border-white">
              <Phone size={10} />
            </div>
          </button>
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

          {/* Payment Overlay */}
          {step === AppStep.PAYMENT && (
            <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck size={48} />
              </div>
              <h2 className="text-3xl font-bold text-brand-navy mb-2">Dossier Validé !</h2>
              <div className="mb-8">
                <span className="inline-block px-4 py-1.5 bg-green-500 text-white rounded-full text-sm font-bold shadow-sm">
                  Score de confiance : {auditResult?.confidence_score}%
                </span>
              </div>
              <p className="text-slate-600 mb-8 max-w-sm leading-relaxed">
                Félicitations ! Votre dossier est jugé conforme par notre IA. Nos experts sont prêts à procéder au dépôt officiel.
              </p>
              <div className="w-full max-w-sm bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Service de dépôt Siam Visa</span>
                  <span className="text-brand-navy font-bold text-lg">1,000.00 €</span>
                </div>
                <button className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2">
                  <CreditCard size={20} />
                  Procéder au paiement
                </button>
              </div>
              <button onClick={() => setStep(AppStep.AUDIT)} className="text-slate-400 hover:text-brand-navy text-sm flex items-center gap-1 transition-colors">
                Réviser mes documents
              </button>
            </div>
          )}

          {/* Chat View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {auditResult && step === AppStep.AUDIT && (
              <div className="p-4 bg-white border-b border-slate-200 flex-none overflow-y-auto max-h-[35%] shadow-sm">
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

// Step Item Component
const StepItem = ({ active, completed, label, desc, icon }: {
  active: boolean;
  completed: boolean;
  label: string;
  desc: string;
  icon: React.ReactNode;
}) => (
  <div className={`flex items-start gap-4 transition-all duration-300 ${active || completed ? 'opacity-100' : 'opacity-30'}`}>
    <div className={`
      w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors
      ${completed
        ? 'bg-green-500 border-green-500 text-white'
        : active
          ? 'border-brand-amber text-brand-amber bg-brand-navy'
          : 'border-slate-700 text-slate-700'}
    `}>
      {completed ? <ShieldCheck size={18} /> : icon}
    </div>
    <div className="flex flex-col">
      <h3 className={`text-sm font-bold leading-tight ${active ? 'text-brand-amber' : 'text-slate-300'}`}>{label}</h3>
      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{desc}</p>
      {active && <div className="h-0.5 w-8 bg-brand-amber mt-2 rounded-full animate-pulse" />}
    </div>
  </div>
);

export default App;
