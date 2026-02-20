import { useState, useCallback, useRef } from 'react';
import { ChatMessage, FileAttachment, AuditResult, AgentAction } from '../types';
import { sendMessageToAgent, generateChatSummary, updateChatSessionHistoryWithTranscript } from '../services/geminiService';
import type { ChatSummary } from '../types';
import { translations, Language } from '../locales/translations';

interface UseChatReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isTyping: boolean;
  addMessage: (text: string, sender: 'user' | 'agent' | 'system', attachments?: FileAttachment[]) => void;
  sendMessage: (text: string, files: FileAttachment[]) => Promise<{
    auditResult?: AuditResult;
    action?: AgentAction;
  } | null>;
  appendTranscript: (transcript: string) => void;
}

export function useChat(currentLanguage: Language = 'fr'): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const addMessage = useCallback((
    text: string,
    sender: 'user' | 'agent' | 'system',
    attachments?: FileAttachment[],
    suggestedReplies?: string[]
  ) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: Date.now(),
      attachments,
      suggestedReplies,
    }]);
  }, []);

  const sendMessage = useCallback(async (
    text: string,
    files: FileAttachment[]
  ) => {
    addMessage(text, 'user', files);
    setIsTyping(true);

    try {
      // Use ref to always get the latest messages, avoiding stale closure
      const currentMessages = messagesRef.current;
      const response = await sendMessageToAgent(text, files, currentMessages);
      addMessage(response.text, 'agent', undefined, response.suggestedReplies || undefined);

      return {
        auditResult: response.auditResult,
        action: response.action,
      };
    } catch (error: any) {
      addMessage(error?.message || translations[currentLanguage].analysis_error, 'system');
      return null;
    } finally {
      setIsTyping(false);
    }
  }, [addMessage]);

  const appendTranscript = useCallback((transcript: string) => {
    addMessage(`📄 **RÉSUMÉ DE L'APPEL**\n\n${transcript}`, 'system');
    updateChatSessionHistoryWithTranscript(transcript);
  }, [addMessage]);

  return {
    messages,
    setMessages,
    isTyping,
    addMessage,
    sendMessage,
    appendTranscript,
  };
}

interface UseSummaryReturn {
  chatSummary: ChatSummary | null;
  setChatSummary: React.Dispatch<React.SetStateAction<ChatSummary | null>>;
  isGeneratingSummary: boolean;
  generateSummary: (callTranscript?: string) => Promise<ChatSummary | null>;
}

export function useSummary(): UseSummaryReturn {
  const [chatSummary, setChatSummary] = useState<ChatSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const generateSummary = useCallback(async (callTranscript?: string): Promise<ChatSummary | null> => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateChatSummary(callTranscript);
      if (summary) {
        setChatSummary(summary);
        return summary;
      }
      return null;
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error('Impossible de générer la synthèse pour le moment.');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, []);

  return {
    chatSummary,
    setChatSummary,
    isGeneratingSummary,
    generateSummary,
  };
}
