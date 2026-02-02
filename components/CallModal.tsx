

import React, { useEffect, useRef, useState } from 'react';
import { Phone, X, Mic, MicOff, Signal } from 'lucide-react';
import { CallPayload } from '../types';
import { LiveAgent, TranscriptUpdate } from '../services/liveService';

interface CallModalProps {
  payload: CallPayload;
  onClose: (transcript?: string | null) => void;
  chatContext?: string;
}

const CallModal: React.FC<CallModalProps> = ({ payload, onClose, chatContext = "" }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerWidth, setVisualizerWidth] = useState(5); // Start small
  const [liveTranscript, setLiveTranscript] = useState<TranscriptUpdate | null>(null);

  const liveAgentRef = useRef<LiveAgent | null>(null);

  // Auto-connect on mount if "urgent" or manual request
  const autoStart = payload.reason === 'user_request' || payload.reason === 'urgent_departure';

  useEffect(() => {
    if (autoStart && status === 'idle') {
      startCall();
    }

    return () => {
      // Cleanup on unmount
      if (liveAgentRef.current) {
        liveAgentRef.current.disconnect();
      }
    };
  }, []);

  // Use Real Agent Volume for Visualizer
  useEffect(() => {
    let interval: any;
    if (status === 'connected') {
      interval = setInterval(() => {
        if (liveAgentRef.current) {
          const volume = liveAgentRef.current.getOutputVolume();
          // Normalize volume (usually 0-50 for speech) to percentage (10-100)
          // If volume is very low (< 5), consider it silence (width 5%)
          const normalized = volume < 5 ? 5 : Math.min(100, (volume / 40) * 100);
          setVisualizerWidth(normalized);
        }
      }, 50); // Faster update rate for smoother animation
    } else {
      setVisualizerWidth(5);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startCall = async () => {
    if (liveAgentRef.current) return;

    liveAgentRef.current = new LiveAgent();
    await liveAgentRef.current.connect(
      (newStatus) => {
        // Map service status to UI status
        if (newStatus === 'connected') setStatus('connected');
        else if (newStatus === 'connecting') setStatus('connecting');
        else if (newStatus === 'error' || newStatus === 'error_mic') setStatus('error');
        // Fix: Don't close modal on disconnect, just reset to idle so user sees it ended
        else if (newStatus === 'disconnected') setStatus('idle');
      },
      // Real-time Transcript Callback
      (update) => {
        setLiveTranscript(update);
      },
      chatContext // Pass the chat context here
    );
  };

  const endCall = () => {
    let transcript = null;
    if (liveAgentRef.current) {
      transcript = liveAgentRef.current.getFormattedTranscript();
      liveAgentRef.current.disconnect();
      liveAgentRef.current = null;
    }
    onClose(transcript);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100 flex flex-col h-[500px] relative">

        {/* GLOBAL BACKGROUND: Secretary Image + Overlay covering the whole modal */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop"
            alt="Secrétaire Siam Visa"
            className="w-full h-full object-cover grayscale-[20%]"
          />
          {/* Gradient overlay for readability across the whole card */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white"></div>
        </div>

        {/* Header - Transparent background, Dark Text, Inline Title */}
        <div className="p-6 flex justify-between items-start relative z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
              Siam Visa
              <span className="text-brand-navy/40 font-light mx-1">|</span>
              <span className="font-medium text-lg">Canal Sécurisé</span>
              {status === 'connected' && (
                <span className="flex items-center gap-1 ml-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold">Live</span>
                </span>
              )}
            </h2>
            <p className="text-brand-navy/60 text-xs font-medium uppercase tracking-wider mt-1">
              Live Agent Connection
            </p>
          </div>
          <button onClick={endCall} className="text-brand-navy/60 hover:text-brand-navy transition-colors bg-white/20 rounded-full p-1 hover:bg-white/40">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col p-6 items-center justify-center text-center relative z-10">

          {/* Background decoration (blobs) - kept subtle behind image */}
          <div className="absolute inset-0 opacity-5 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-navy rounded-full blur-3xl" />
          </div>

          {status === 'idle' && (
            <div className="space-y-6 w-full z-10 relative">
              <div className="w-20 h-20 bg-brand-light/90 backdrop-blur-sm text-brand-navy rounded-full flex items-center justify-center mx-auto mb-4 border border-white/50 shadow-sm">
                <Phone size={40} />
              </div>
              <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl">
                <h3 className="text-lg font-bold text-brand-navy">Prêt à discuter ?</h3>
                <p className="text-slate-800 text-sm mt-2 font-medium">
                  {payload.notes || "Nous allons clarifier votre dossier ensemble."}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-left border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Sujet de l'appel</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-white border rounded text-xs text-slate-700 font-medium shadow-sm">{payload.visaType}</span>
                  <span className="px-2 py-1 bg-white border rounded text-xs text-slate-700 font-medium shadow-sm">{payload.reason}</span>
                </div>
              </div>

              <button
                onClick={startCall}
                className="w-full bg-brand-amber hover:bg-brand-yellow text-brand-navy font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Phone size={24} />
                <span>Lancer l'appel</span>
              </button>
            </div>
          )}

          {status === 'connecting' && (
            <div className="space-y-6 z-10 animate-in fade-in relative">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 border-4 border-brand-light/50 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-navy rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-brand-navy">
                  <Signal size={32} className="animate-pulse" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-white/50">
                <p className="text-slate-800 font-bold">Établissement de la connexion...</p>
                <p className="text-xs text-slate-500 mt-1">Gemini Live API Initializing</p>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="space-y-8 w-full z-10 animate-in zoom-in-95 duration-500 relative flex flex-col items-center">
              {/* "Door Handle" Visualizer (Agent Voice Only) */}
              <div className="h-24 flex flex-col items-center justify-center w-full max-w-[150px] mx-auto">

                {/* No static line above. Just the dynamic handle. */}
                <div className="flex items-center justify-center w-full h-2">
                  <div
                    className="h-1 bg-brand-navy rounded-full transition-all duration-75 ease-out shadow-sm"
                    style={{
                      width: `${visualizerWidth}%`,
                      opacity: 0.6 + (visualizerWidth / 200)
                    }}
                  ></div>
                </div>

              </div>

              {/* Live Transcript Display (Low Latency) */}
              <div className="w-full min-h-[80px] flex items-center justify-center">
                {liveTranscript && liveTranscript.text ? (
                  <div className={`
                      max-w-[90%] p-3 rounded-xl backdrop-blur-md shadow-sm border border-white/50 text-sm font-medium transition-all duration-300
                      ${liveTranscript.role === 'agent'
                      ? 'bg-white/90 text-brand-navy'
                      : 'bg-brand-navy/90 text-white'}
                   `}>
                    <span className="opacity-50 text-[10px] uppercase block mb-1">
                      {liveTranscript.role === 'agent' ? 'Expert' : 'Vous'}
                    </span>
                    {liveTranscript.text}
                    {!liveTranscript.isFinal && <span className="animate-pulse">|</span>}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm italic opacity-70 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
                    En attente de parole...
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 mt-auto">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full transition-all shadow-md ${isMuted ? 'bg-slate-200 text-slate-600' : 'bg-white text-brand-navy hover:bg-slate-50 border border-slate-200'}`}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                  onClick={endCall}
                  className="p-5 bg-slate-700 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-slate-700/30 transition-all transform hover:scale-105 border-4 border-white"
                >
                  <Phone size={28} className="rotate-[135deg]" />
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 z-10 relative">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <X size={40} />
              </div>
              <div className="bg-white/90 p-4 rounded-xl shadow-sm border border-red-100">
                <h3 className="text-lg font-bold text-slate-800">Échec de la connexion</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Impossible d'établir la liaison avec l'agent vocal. Vérifiez votre micro ou réessayez plus tard.
                </p>
              </div>
              <button
                onClick={() => onClose(null)}
                className="mt-4 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors shadow-sm"
              >
                Fermer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-transparent p-3 text-center border-t border-slate-200/50 relative z-10">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Powered by Google Gemini Live 2.5
          </p>
        </div>

      </div>
    </div>
  );
};

export default CallModal;
