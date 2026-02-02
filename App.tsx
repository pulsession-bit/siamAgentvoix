
import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CreditCard, Phone, Menu, X, Trash2, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import Chat from './components/Chat';
import InputArea from './components/InputArea';
import VisaSelect from './components/VisaSelect';
import AuditScore from './components/AuditScore';
import CallModal from './components/CallModal';
import { ChatMessage, AppStep, VisaType, FileAttachment, AuditResult, CallPayload } from './types';
import { startAuditSession, sendMessageToAgent, resumeAuditSession, isChatSessionActive, updateChatSessionHistoryWithTranscript, generateChatSummary } from './services/geminiService';
import SummaryView from './components/SummaryView'; // Import Summary Component

const STORAGE_KEY = 'siam_visa_pro_session_v1';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.QUALIFICATION);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [visaType, setVisaType] = useState<VisaType>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [chatSummary, setChatSummary] = useState<import('./types').ChatSummary | null>(null); // State for Summary
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callPayload, setCallPayload] = useState<CallPayload | null>(null);

  const initializationRef = React.useRef(false); // Ref to prevent double init

  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    let mounted = true;
    const initApp = async () => {
      try {
        if (!process.env.API_KEY) {
          if (mounted) setInitializationError("Erreur: Clé API manquante dans l'environnement.");
          return;
        }

        let sessionRestored = false;
        let currentSessionId = Date.now().toString();

        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.messages && parsed.messages.length > 0) {
              currentSessionId = parsed.sessionId || currentSessionId;
              if (mounted) {
                setMessages(parsed.messages);
                setStep(parsed.step || AppStep.QUALIFICATION);
                setVisaType(parsed.visaType || null);
                setAuditResult(parsed.auditResult || null);
                setSessionId(currentSessionId);
              }
              await resumeAuditSession(parsed.messages, currentSessionId);
              sessionRestored = true;
            }
          } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        if (!sessionRestored || !isChatSessionActive()) {
          if (mounted) setSessionId(currentSessionId);

          // Instant Welcome Mode
          const instantWelcome = "Bonjour et bienvenue sur **Siam Visa Pro**.\n\nJe suis votre assistant expert en visas pour la Thaïlande. Mon rôle est de :\n1. Vous aider à choisir le bon visa.\n2. Vérifier votre dossier (Audit).\n3. Maximiser vos chances d'approbation.\n\nPour commencer, dites-moi :\n- Quelle est votre **nationalité** ?\n- Quel est le **but de votre séjour** (tourisme, travail, retraite...) ?\n- Combien de temps comptez-vous rester ?";

          if (mounted && messages.length === 0) addMessage(instantWelcome, 'agent');

          // Initialize Gemini in background without waiting for welcome generation
          startAuditSession(currentSessionId, true).catch(err => {
            console.error("Background session init failed", err);
            if (mounted) addMessage(`Erreur connexion IA: ${err.message}`, 'system');
          });
        }
        if (mounted) setIsSessionLoaded(true);
      } catch (err: any) {
        if (mounted) setInitializationError(err.message);
      } finally {
        if (mounted) setIsLoadingApp(false);
      }
    };
    initApp();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isSessionLoaded || !sessionId) return;
    const sessionData = { sessionId, messages, step, visaType, auditResult, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  }, [sessionId, messages, step, visaType, auditResult, isSessionLoaded]);

  const clearSession = () => {
    if (confirm("Voulez-vous réinitialiser votre audit et recommencer ?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateChatSummary();
      if (summary) setChatSummary(summary);
      setIsMobileMenuOpen(false);
    } catch (e) {
      console.error(e);
      alert("Impossible de générer la synthèse pour le moment.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const addMessage = (text: string, sender: 'user' | 'agent' | 'system', attachments?: FileAttachment[]) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, timestamp: Date.now(), attachments }]);
  };

  const handleVisaSelect = (type: VisaType) => {
    setVisaType(type);
    setStep(AppStep.AUDIT);
    handleUserMessage(`Je souhaite postuler pour un visa ${type}.`, []);
  };

  const handleUserMessage = async (text: string, files: FileAttachment[]) => {
    addMessage(text, 'user', files);
    setIsTyping(true);
    try {
      const response = await sendMessageToAgent(text, files);
      addMessage(response.text, 'agent');
      if (response.auditResult) {
        setAuditResult(response.auditResult);
        if (response.auditResult.ready_for_payment) {
          setStep(AppStep.PAYMENT);
        }
      }
      if (response.action?.action === 'request_call') setCallPayload(response.action.payload);
    } catch (error) {
      addMessage("Désolé, une erreur de connexion est survenue.", 'system');
    } finally {
      setIsTyping(false);
    }
  };

  const handleManualCallRequest = () => {
    setCallPayload({
      reason: 'user_request',
      visaType: visaType || 'Non Défini',
      userStage: step,
      notes: 'Demande manuelle de l\'utilisateur.'
    });
    setIsMobileMenuOpen(false);
  };

  const renderSidebar = () => (
    <aside className={`
      fixed inset-0 z-50 md:static md:inset-auto w-full md:w-80 bg-brand-navy flex flex-col h-full transition-transform duration-300
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6 flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-amber rounded-lg flex items-center justify-center text-brand-navy shadow-lg shadow-brand-amber/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="font-bold text-white text-lg block leading-none">Siam Visa Pro</span>
              <span className="text-[10px] text-brand-amber font-bold uppercase tracking-widest mt-1 block">Audit AI Agent</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Steps */}
        <nav className="space-y-6 flex-1">
          <StepItem
            active={step === AppStep.QUALIFICATION}
            completed={step !== AppStep.QUALIFICATION}
            label="Qualification"
            desc="Sélection du type de visa"
            icon={<FileText size={18} />}
          />
          <StepItem
            active={step === AppStep.AUDIT}
            completed={step === AppStep.PAYMENT}
            label="Audit IA"
            desc="Vérification documentaire"
            icon={<ShieldCheck size={18} />}
          />
          <StepItem
            active={step === AppStep.PAYMENT}
            completed={false}
            label="Validation"
            desc="Paiement & Dépôt"
            icon={<CreditCard size={18} />}
          />
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
          {/* NEW: Synthèse Button */}
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

          <button
            onClick={handleManualCallRequest}
            className="w-full flex items-center justify-center gap-2 bg-brand-amber text-brand-navy py-4 rounded-xl font-bold text-sm shadow-lg hover:bg-brand-yellow transition-colors"
          >
            <Phone size={18} /> Parler à un expert
          </button>
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

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-brand-light overflow-hidden">
      {isLoadingApp ? (
        <div className="flex flex-col items-center justify-center h-full w-full bg-brand-navy text-white">
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
      ) : (
        <>
          {renderSidebar()}

          <div className="flex-1 flex flex-col h-full relative min-w-0">
            {/* Header / Nav Bar Mobile (Visible on Mobile only) */}
            <header className="flex-none bg-brand-navy p-4 flex items-center justify-between md:hidden border-b border-slate-800 z-30 shadow-md">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 -ml-2">
                <Menu size={24} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-brand-amber font-black uppercase tracking-[0.2em] mb-0.5">Siam Visa Pro</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-xs">
                    {step === AppStep.QUALIFICATION ? "Qualification" : step === AppStep.AUDIT ? "Audit IA" : "Validation"}
                  </span>
                  <div className="flex gap-0.5">
                    <div className={`w-1 h-1 rounded-full ${step === AppStep.QUALIFICATION ? 'bg-brand-amber' : 'bg-green-500'}`}></div>
                    <div className={`w-1 h-1 rounded-full ${step === AppStep.AUDIT ? 'bg-brand-amber' : step === AppStep.PAYMENT ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                    <div className={`w-1 h-1 rounded-full ${step === AppStep.PAYMENT ? 'bg-brand-amber' : 'bg-slate-700'}`}></div>
                  </div>
                </div>
              </div>
              <button onClick={handleManualCallRequest} className="p-2.5 bg-brand-amber text-brand-navy rounded-full shadow-lg active:scale-95 transition-transform">
                <Phone size={18} />
              </button>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden relative">
              {/* Step Overlays */}
              {step === AppStep.QUALIFICATION && messages.length < 3 && (
                <div className="absolute inset-0 z-50 bg-brand-light flex flex-col items-center justify-center p-6 overflow-y-auto">
                  <div className="max-w-xl w-full text-center mb-8">
                    <h2 className="text-3xl font-bold text-brand-navy mb-2">Bienvenue sur votre Audit Visa</h2>
                    <p className="text-slate-500">Sélectionnez votre type de visa pour commencer l'analyse de conformité.</p>
                  </div>
                  <VisaSelect onSelect={handleVisaSelect} selected={visaType} />
                </div>
              )}

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
                      <AuditScore result={auditResult} />
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden relative">
                  <Chat messages={messages} isTyping={isTyping} />
                </div>

                <div className="flex-none">
                  <InputArea onSendMessage={handleUserMessage} disabled={step === AppStep.PAYMENT} />
                </div>
              </div>
            </main>

            {/* Modal de Synthèse (Overlay) */}
            {chatSummary && (
              <div className="absolute inset-0 z-40 bg-brand-light/95 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
                <div className="max-w-5xl mx-auto">
                  <SummaryView summary={chatSummary} onClose={() => setChatSummary(null)} />
                </div>
              </div>
            )}

            {/* Modal de Call */}
            {callPayload && (
              <CallModal
                payload={callPayload}
                onClose={(transcript) => {
                  setCallPayload(null);
                  if (transcript) {
                    addMessage(`📄 **RÉSUMÉ DE L'APPEL**\n\n${transcript}`, 'system');
                    updateChatSessionHistoryWithTranscript(transcript);
                  }
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

const StepItem = ({ active, completed, label, desc, icon }: any) => (
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
