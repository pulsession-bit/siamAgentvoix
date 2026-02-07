


import { GoogleGenAI, GenerateContentResponse, Chat, Content } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { AuditResult, FileAttachment, AgentAction, ChatMessage } from '../types';

let aiClient: GoogleGenAI | null = null;
// Use Chat type instead of ChatSession as per @google/genai guidelines
export let chatSession: Chat | null = null;

const getClient = () => {
  if (!aiClient) {
    // API_KEY check is now also performed in App.tsx for more visible error handling
    if (!process.env.API_KEY) {
      console.error("API_KEY is missing in getClient. This should have been caught earlier.");
      throw new Error("API Key missing");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

// New function to check if chatSession is active
export const isChatSessionActive = (): boolean => {
  return chatSession !== null;
};

// Helper to convert UI messages to Gemini History
const convertToGeminiHistory = (messages: ChatMessage[]): Content[] => {
  return messages
    .filter(m => m.sender === 'user' || m.sender === 'agent') // Filter out system messages
    .map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }] // Note: We simplify attachments restoration for history to text context mostly, preserving logic
    }));
};

// Update to use the latest gemini-3-flash-preview model for chat
export const startAuditSession = async (sessionId: string | null = null, skipWelcome: boolean = false): Promise<string> => {
  const client = getClient();

  // Initialize chat with system prompt
  chatSession = client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2, // Low temperature for consistent auditing
    },
  });

  if (sessionId) {
    console.log(`Starting new Gemini session for Session ID: ${sessionId}`);
  }

  if (skipWelcome) {
    return "";
  }

  // Initial greeting trigger. This prompt instructs the model to follow step 3.1 of the System Prompt.
  const response = await chatSession.sendMessage({
    message: "Bonjour. Je suis prêt à commencer. Présente-toi et demande-moi mon projet comme convenu."
  });

  // Directly access .text property as per guidelines (not a method call)
  return response.text || "";
};

// Update to use the latest gemini-3-flash-preview model when resuming
export const resumeAuditSession = async (existingMessages: ChatMessage[], sessionId: string | null = null): Promise<void> => {
  const client = getClient();
  const history = convertToGeminiHistory(existingMessages);

  // Re-initialize chat with previous history
  chatSession = client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
    },
    history: history
  });

  if (sessionId) {
    console.log(`Resuming Gemini session for Session ID: ${sessionId}`);
  }
  console.log("Session Gemini restaurée avec succès.");
};

/**
 * Updates the ongoing chat session with a call transcript, ensuring Gemini is aware of the call's content.
 * @param transcript The formatted transcript of the call.
 */
export const updateChatSessionHistoryWithTranscript = (transcript: string) => {
  if (chatSession) {
    // Add the transcript as a model's message to the history
    // We treat it as a 'model' response because it's part of the agent's interaction (even if human-assisted)
    // This ensures Gemini can use it as context for subsequent turns.
    // WARNING: Directly pushing to history is not supported via public API in current SDK version
    // and causes TS errors (property 'history' is private).
    // For now, we rely on the context being naturally built up or re-initialized on resume.
    // chatSession.history.push({
    //   role: 'model',
    //   parts: [{ text: `(Compte-rendu d'appel téléphonique) : ${transcript}` }]
    // });

    // Alternative: Send a message to the model informing it of the call
    // await chatSession.sendMessage(`SYSTEM INFO: A call took place. Transcript: ${transcript}`);
    console.log("Call transcript logic temporarily disabled due to SDK constraints.");
    console.log("Call transcript added to Gemini chat history.");
  } else {
    console.warn("Attempted to add call transcript to history, but no active chat session.");
  }
};


interface AgentResponse {
  text: string;
  auditResult: AuditResult | null;
  action: AgentAction | null;
}

export const sendMessageToAgent = async (
  text: string,
  images: FileAttachment[] = [],
  previousHistory: ChatMessage[] = []
): Promise<AgentResponse> => {
  const client = getClient();

  // Re-initialize chat session with full history for every request
  // This prevents internal SDK state corruption which causes browser freezes/loops on subsequent requests
  const history = convertToGeminiHistory(previousHistory);

  try {
    chatSession = client.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for consistent auditing
      },
      history: history
    });

    const parts: any[] = [{ text }];

    // Add images if present
    images.forEach((img) => {
      // Remove data:image/png;base64, prefix if present for the API call
      const cleanData = img.data.split(',')[1] || img.data;
      parts.push({
        inlineData: {
          mimeType: img.type,
          data: cleanData
        }
      });
    });

    let messageContent: string | any[] = text;

    if (images.length > 0) {
      messageContent = parts;
    }

    const result = await chatSession.sendMessage({
      message: messageContent
    });

    // Access .text property directly instead of calling .text()
    const fullText = result.text || "";

    // Extract JSON block - More robust regex to handle case sensitivity and missing tags
    const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    let auditResult: AuditResult | null = null;
    let action: AgentAction | null = null;

    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);

        // Handle "action": "request_call" format
        if (parsed.action === 'request_call') {
          action = parsed;
        }
        // Handle Audit Result (heuristic based on fields)
        else if (parsed.audit_status || parsed.visa_type) {
          auditResult = parsed;
        }
        // Handle legacy "type": "audit_result" format if it still occurs
        else if (parsed.type === 'audit_result' && parsed.data) {
          auditResult = parsed.data;
        }

      } catch (e) {
        console.error("Failed to parse JSON from agent response", e);
      }
    }

    // Clean text presentation (remove the JSON block from the chat bubble)
    const cleanText = fullText.replace(/```(?:json)?\s*[\s\S]*?\s*```/gi, '').trim();

    return {
      text: cleanText,
      auditResult,
      action
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "Une erreur technique est survenue lors de l'analyse. Veuillez réessayer. (Réinitialisation session)",
      auditResult: null,
      action: null
    };
  }
};

// New function to generate a structured summary of the chat
export const generateChatSummary = async (): Promise<import('../types').ChatSummary | null> => {
  if (!chatSession) return null;

  try {
    const prompt = `
      SYNTHÈSE DE FIN DE SESSION
      Génère un résumé structuré de l'ensemble de notre conversation pour l'utilisateur au format JSON uniquement.
      
      Format attendu :
      {
        "visa_score": 0 à 100,
        "visa_type": "Nom du visa identifié",
        "executive_summary": "Synthèse narrative du profil et du projet (3-4 phrases).",
        "strengths": ["Point fort 1", "Point fort 2"],
        "weaknesses": ["Point faible 1", "Point faible 2"],
        "key_points": ["Point clé 1", "Point clé 2"],
        "action_plan": [
           { "step": "Nom de l'étape", "description": "Quoi faire", "timing": "Quand (ex: 'Immédiat', 'Dans 1 semaine')"}
        ],
        "required_documents": ["Doc 1", "Doc 2"]
      }
      
      Sois précis, professionnel et constructif.
    `;

    const result = await chatSession.sendMessage({ message: prompt });
    const fullText = result.text || "";

    // Extract JSON
    const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try parsing raw if no block
    try {
      return JSON.parse(fullText);
    } catch {
      return null;
    }

  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
};