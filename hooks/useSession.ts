import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, AppStep, VisaType, AuditResult, ChatSummary } from '../types';
import { startAuditSession, resumeAuditSession, isChatSessionActive } from '../services/geminiService';
import { saveSessionToFirestore } from '../services/dbService';

const STORAGE_KEY = 'siam_visa_pro_session_v1';

interface SessionData {
  sessionId: string;
  messages: ChatMessage[];
  step: AppStep;
  visaType: VisaType;
  auditResult: AuditResult | null;
  chatSummary: ChatSummary | null;
  userEmail: string | null;
  timestamp: number;
}

interface UseSessionProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  step: AppStep;
  setStep: React.Dispatch<React.SetStateAction<AppStep>>;
  visaType: VisaType;
  setVisaType: React.Dispatch<React.SetStateAction<VisaType>>;
  auditResult: AuditResult | null;
  setAuditResult: React.Dispatch<React.SetStateAction<AuditResult | null>>;
  chatSummary: ChatSummary | null;
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  addMessage: (text: string, sender: 'user' | 'agent' | 'system') => void;
}

interface UseSessionReturn {
  sessionId: string | null;
  isSessionLoaded: boolean;
  isLoadingApp: boolean;
  initializationError: string | null;
  clearSession: () => void;
}

const INSTANT_WELCOME = `Bonjour et bienvenue sur **Siam Visa Pro**.

Je suis votre assistant expert en visas pour la Thaïlande. Mon rôle est de :
1. Vous aider à choisir le bon visa.
2. Vérifier votre dossier (Audit).
3. Maximiser vos chances d'approbation.

Pour commencer, dites-moi :
- Quelle est votre **nationalité** ?
- Quel est le **but de votre séjour** (tourisme, travail, retraite...) ?
- Combien de temps comptez-vous rester ?`;

export function useSession({
  messages,
  setMessages,
  step,
  setStep,
  visaType,
  setVisaType,
  auditResult,
  setAuditResult,
  chatSummary,
  userEmail,
  setUserEmail,
  addMessage,
}: UseSessionProps): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const initializationRef = useRef(false);

  // Initialize session on mount
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

        // Try to restore from localStorage
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsed: SessionData = JSON.parse(savedData);
            if (parsed.messages && parsed.messages.length > 0) {
              currentSessionId = parsed.sessionId || currentSessionId;
              if (mounted) {
                setMessages(parsed.messages);
                setStep(parsed.step || AppStep.QUALIFICATION);
                setVisaType(parsed.visaType || null);
                setAuditResult(parsed.auditResult || null);
                setUserEmail(parsed.userEmail || null);
                setSessionId(currentSessionId);
              }
              await resumeAuditSession(parsed.messages, currentSessionId);
              sessionRestored = true;
            }
          } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        // Start new session if not restored
        if (!sessionRestored || !isChatSessionActive()) {
          if (mounted) setSessionId(currentSessionId);

          // Show instant welcome message
          if (mounted && messages.length === 0) {
            addMessage(INSTANT_WELCOME, 'agent');
          }

          // Initialize Gemini in background
          startAuditSession(currentSessionId, true).catch(err => {
            console.error('Background session init failed', err);
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

  // Persist session on changes
  useEffect(() => {
    if (!isSessionLoaded || !sessionId) return;

    const sessionData: SessionData = {
      sessionId,
      messages,
      step,
      visaType,
      auditResult,
      chatSummary,
      userEmail,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

    // Cloud persistence
    if (userEmail) {
      saveSessionToFirestore(userEmail, sessionData);
    }
  }, [sessionId, messages, step, visaType, auditResult, chatSummary, userEmail, isSessionLoaded]);

  const clearSession = useCallback(() => {
    if (confirm('Voulez-vous réinitialiser votre audit et recommencer ?')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }, []);

  return {
    sessionId,
    isSessionLoaded,
    isLoadingApp,
    initializationError,
    clearSession,
  };
}
