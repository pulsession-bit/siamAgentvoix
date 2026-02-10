

export type VisaType = 'DTV' | 'Retirement' | 'Tourism' | 'Business' | 'Expatriation' | null;

export type Sender = 'user' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: string;
  data: string; // Base64
}

export interface AuditResult {
  visa_type?: string;
  audit_status: 'VALID' | 'INVALID' | 'PENDING';
  issues: string[];
  missing_docs: string[];
  ready_for_payment: boolean;
  confidence_score?: number; // 0-100
}

export interface CallPayload {
  reason: string;
  visaType: string;
  userStage: string;
  notes: string;
}

export interface AgentAction {
  action: 'request_call';
  payload: CallPayload;
}

export interface ChatSummary {
  visa_score: number;
  visa_type: string;
  executive_summary: string;
  key_points: string[];
  action_plan: {
    step: string;
    description: string;
    timing: string;
  }[];
  required_documents: string[];
  strengths: string[];
  weaknesses: string[];
}

export enum AppStep {
  QUALIFICATION = 'QUALIFICATION',
  AUDIT = 'AUDIT',
  RESULT = 'RESULT',
  PAYMENT = 'PAYMENT'
}

export interface CaseData {
  case_id: string;
  lead_id: string;
  intent: string;
  status: string;
  owner_uid: string | null;
  site_id: string;
  confidence_score: number;
  last_event_at: string;
  next_action_at: string | null;
  created_at: string;
}

// Fixed missing types for AudioPlayer.tsx
export interface GlobalTTSState {
  currentPlayingMessageId: string | null;
  currentLoadingMessageId: string | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  messageText: string;
}

export interface GlobalTTSControls {
  togglePlayPause: () => void;
  stop: () => void;
  seek: (progress: number) => void;
}


declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}