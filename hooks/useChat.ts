import { useState, useCallback } from 'react';
import { ChatMessage, FileAttachment, AuditResult, ActionResponse } from '../types';
import { sendMessageToAgent, generateChatSummary, updateChatSessionHistoryWithTranscript } from '../services/geminiService';
import type { ChatSummary } from '../types';

interface UseChatReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isTyping: boolean;
  addMessage: (text: string, sender: 'user' | 'agent' | 'system', attachments?: FileAttachment[]) => void;
  sendMessage: (text: string, files: FileAttachment[]) => Promise<{
    auditResult?: AuditResult;
    action?: ActionResponse;
  } | null>;
  appendTranscript: (transcript: string) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const addMessage = useCallback((
    text: string,
    sender: 'user' | 'agent' | 'system',
    attachments?: FileAttachment[]
  ) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: Date.now(),
      attachments,
    }]);
  }, []);

  const sendMessage = useCallback(async (
    text: string,
    files: FileAttachment[]
  ) => {
    addMessage(text, 'user', files);
    setIsTyping(true);

    try {
      const response = await sendMessageToAgent(text, files);
      addMessage(response.text, 'agent');

      return {
        auditResult: response.auditResult,
        action: response.action,
      };
    } catch (error) {
      addMessage('Désolé, une erreur de connexion est survenue.', 'system');
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
  generateSummary: () => Promise<ChatSummary | null>;
}

export function useSummary(): UseSummaryReturn {
  const [chatSummary, setChatSummary] = useState<ChatSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const generateSummary = useCallback(async (): Promise<ChatSummary | null> => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateChatSummary();
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
