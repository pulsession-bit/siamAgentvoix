import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, AppStep, VisaType, AuditResult, ChatSummary } from '../types';
import { startAuditSession, resumeAuditSession, isChatSessionActive, setCurrentUserEmail } from '../services/geminiService';
import { saveSessionToFirestore } from '../services/dbService';
import { AUDIT_SESSION_KEY } from '../contexts/AuthContext';
import { Language } from '../locales/translations';

// Use v2 key to align with AuthContext
const STORAGE_KEY = AUDIT_SESSION_KEY;

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
  userEmail: string | null; // Read-only, managed by AuthContext
  language: Language;
  addMessage: (text: string, sender: 'user' | 'agent' | 'system') => void;
}

interface UseSessionReturn {
  sessionId: string | null;
  isSessionLoaded: boolean;
  isLoadingApp: boolean;
  initializationError: string | null;
  clearSession: () => void;
}

function getWelcomeMessage(lang: Language = 'fr'): string {
  if (lang === 'en') {
    return `Hello! I'm your **Siam Visa Pro** assistant, specialized in Thailand visas.

What is your project in Thailand? (tourism, work, retirement, studies...)`;
  }

  return `Bonjour ! Je suis votre assistant **Siam Visa Pro**, spécialisé en visas pour la Thaïlande.

Quel est votre projet en Thaïlande ? (tourisme, travail, retraite, études...)`;
}

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
  userEmail, // Now read-only from AuthContext
  language,
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
          if (mounted) setInitializationError(language === 'en' ? "Error: API key missing from environment." : "Erreur: Clé API manquante dans l'environnement.");
          return;
        }

        // Sync email to geminiService early for session restore
        setCurrentUserEmail(userEmail);

        let sessionRestored = false;
        let currentSessionId = Date.now().toString();

        // Try to restore audit session from localStorage
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
                // Note: userEmail is now managed by AuthContext, not restored here
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
            addMessage(getWelcomeMessage(language), 'agent');
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

    // Cloud persistence (debounced to prevent UI freeze and excessive writes)
    if (userEmail) {
      const timer = setTimeout(() => {
        saveSessionToFirestore(userEmail, sessionData);
      }, 2000); // Wait 2s of inactivity

      return () => clearTimeout(timer);
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
