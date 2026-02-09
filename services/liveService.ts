


import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';

interface TranscriptItem {
  role: 'user' | 'agent';
  text: string;
}

export type TranscriptUpdate = {
  role: 'user' | 'agent';
  text: string;
  isFinal: boolean;
};

export class LiveAgent {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sessionPromise: Promise<any> | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private isConnected: boolean = false;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Transcription State
  private transcriptionHistory: TranscriptItem[] = [];
  private currentInputTranscription: string = '';
  private currentOutputTranscription: string = '';

  // Callback for realtime updates
  private onTranscriptUpdate: ((update: TranscriptUpdate) => void) | null = null;

  constructor() {
    const apiKey = process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    console.log("LiveAgent Constructor - API Key Check:", apiKey ? "Present" : "Missing");

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment variables");
      throw new Error("API Key missing");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(
    onStatusChange: (status: string) => void,
    onTranscriptUpdate?: (update: TranscriptUpdate) => void
  ) {
    if (this.isConnected) {
      console.log("[LiveAgent] Already connected, skipping");
      return;
    }

    console.log("[LiveAgent] Starting connect flow...");
    onStatusChange('connecting');
    this.onTranscriptUpdate = onTranscriptUpdate || null;

    // Reset State
    this.transcriptionHistory = [];
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';

    // 1. Setup Audio Contexts
    console.log("[LiveAgent] Step 1: Setting up audio contexts...");
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.nextStartTime = this.outputAudioContext.currentTime;
    console.log("[LiveAgent] Audio contexts created. Input state:", this.inputAudioContext.state, "Output state:", this.outputAudioContext.state);

    // Setup Analyzer for Agent Voice Visualization
    this.analyser = this.outputAudioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.5;
    this.analyser.connect(this.outputAudioContext.destination);

    // 2. Get User Media
    console.log("[LiveAgent] Step 2: Requesting microphone access...");
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[LiveAgent] Mic access granted. Tracks:", this.mediaStream.getTracks().map(t => `${t.kind}:${t.readyState}`));
    } catch (e) {
      console.error("[LiveAgent] Mic access denied:", e);
      onStatusChange('error_mic');
      return;
    }

    // 3. Connect to Gemini Live
    const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
    console.log("[LiveAgent] Step 3: Connecting to Gemini Live API with model:", model);
    try {
      this.sessionPromise = this.ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: SYSTEM_PROMPT + "\n\nCONTEXTE: Ceci est un APPEL VOCAL en direct. Sois concis, direct et empathique. Pas de listes à puces. Parle comme un humain au téléphone.",
        },
        callbacks: {
          onopen: () => {
            console.log("[LiveAgent] >>> SESSION OPENED - WebSocket connected");
            onStatusChange('connected');
            this.isConnected = true;
            this.startAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log("[LiveAgent] Message received:", JSON.stringify(message).substring(0, 200));
            this.handleServerMessage(message);
          },
          onclose: (e: any) => {
            console.log("[LiveAgent] >>> SESSION CLOSED", e ? JSON.stringify(e) : "(no details)");
            onStatusChange('disconnected');
            this.disconnect();
          },
          onerror: (e: any) => {
            console.error("[LiveAgent] >>> SESSION ERROR:", e);
            console.error("[LiveAgent] Error details:", JSON.stringify(e, Object.getOwnPropertyNames(e || {})));
            onStatusChange('error');
            this.disconnect();
          }
        }
      });
      console.log("[LiveAgent] live.connect() called, waiting for onopen...");
    } catch (err: any) {
      console.error("[LiveAgent] Failed to connect:", err);
      console.error("[LiveAgent] Error message:", err?.message);
      console.error("[LiveAgent] Error stack:", err?.stack);
      onStatusChange('error');
    }
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.mediaStream || !this.sessionPromise) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    // Use ScriptProcessor for raw PCM access
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);

      // CRITICAL: Always use the session promise to send inputs to avoid race conditions
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;

    // 1. Handle Transcription (Optimized for Low Latency)
    if (serverContent?.outputTranscription) {
      const chunk = serverContent.outputTranscription.text;
      this.currentOutputTranscription += chunk;
      // Stream update immediately
      this.onTranscriptUpdate?.({
        role: 'agent',
        text: this.currentOutputTranscription,
        isFinal: false
      });
    }

    if (serverContent?.inputTranscription) {
      const chunk = serverContent.inputTranscription.text;
      this.currentInputTranscription += chunk;
      // Stream update immediately
      this.onTranscriptUpdate?.({
        role: 'user',
        text: this.currentInputTranscription,
        isFinal: false
      });
    }

    if (serverContent?.turnComplete) {
      // Finalize User Turn
      if (this.currentInputTranscription.trim()) {
        this.transcriptionHistory.push({ role: 'user', text: this.currentInputTranscription.trim() });
        this.onTranscriptUpdate?.({ role: 'user', text: this.currentInputTranscription.trim(), isFinal: true });
        this.currentInputTranscription = '';
      }
      // Finalize Agent Turn
      if (this.currentOutputTranscription.trim()) {
        this.transcriptionHistory.push({ role: 'agent', text: this.currentOutputTranscription.trim() });
        this.onTranscriptUpdate?.({ role: 'agent', text: this.currentOutputTranscription.trim(), isFinal: true });
        this.currentOutputTranscription = '';
      }
    }

    if (!this.outputAudioContext) return;

    // 2. Handle Interruption
    if (serverContent?.interrupted) {
      this.stopAllAudio();
      this.nextStartTime = this.outputAudioContext.currentTime; // Reset timing

      // Clear current agent transcription as interrupted
      if (this.currentOutputTranscription) {
        this.transcriptionHistory.push({ role: 'agent', text: this.currentOutputTranscription.trim() + "..." });
        this.currentOutputTranscription = '';
      }
      return;
    }

    // 3. Handle Audio Data (Property .data from parts[0].inlineData)
    const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      try {
        // Ensure seamless playback by scheduling each chunk to start at nextStartTime
        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

        const audioBuffer = await this.decodeAudioData(
          this.decode(base64Audio),
          this.outputAudioContext,
          24000,
          1
        );

        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;

        // Connect to Analyzer for visual feedback
        if (this.analyser) {
          source.connect(this.analyser);
        } else {
          source.connect(this.outputAudioContext.destination);
        }

        source.onended = () => this.sources.delete(source);

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;

        this.sources.add(source);
      } catch (e) {
        console.error("Error decoding audio", e);
      }
    }
  }

  // Method to get current output volume for visualization
  getOutputVolume(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    // Return average volume (0-255)
    return sum / dataArray.length;
  }

  getFormattedTranscript(): string | null {
    // Flush pending transcripts
    if (this.currentInputTranscription.trim()) {
      this.transcriptionHistory.push({ role: 'user', text: this.currentInputTranscription.trim() });
      this.currentInputTranscription = '';
    }
    if (this.currentOutputTranscription.trim()) {
      this.transcriptionHistory.push({ role: 'agent', text: this.currentOutputTranscription.trim() });
      this.currentOutputTranscription = '';
    }

    if (this.transcriptionHistory.length === 0) return null;

    return this.transcriptionHistory
      .map(item => `[${item.role === 'user' ? 'Moi' : 'Agent'}] : ${item.text}`)
      .join('\n\n');
  }

  disconnect() {
    this.isConnected = false;
    this.onTranscriptUpdate = null;

    // Stop Audio Input
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }

    // Stop Audio Output
    this.stopAllAudio();
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    this.sessionPromise = null;
  }

  private stopAllAudio() {
    this.sources.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    this.sources.clear();
  }

  // Implement createBlob according to Gemini Live coding guidelines
  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  // Custom encode method as mandated by guidelines (do not use external libraries)
  private encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Custom decode method as mandated by guidelines (do not use external libraries)
  private decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // decodeAudioData for raw PCM streams as per guidelines
  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}