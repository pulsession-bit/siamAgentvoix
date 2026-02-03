
import React, { useRef, useState, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { FileAttachment } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string, files: FileAttachment[]) => void;
  disabled: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check support on mount
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setIsSpeechSupported(true);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Accès au microphone refusé. Veuillez vérifier les permissions de votre navigateur.");
        } else if (event.error === 'no-speech') {
          // No speech detected, just stop silently
        } else {
          // Other errors
          console.warn("Speech Error:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text, []);
    setText('');
  };

  return (
    <div className="bg-brand-navy border-t border-brand-dark p-4 pb-8 md:pb-4 sticky bottom-0 z-20">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">

        {/* Microphone Button */}
        {isSpeechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`
               p-3 rounded-xl transition-all duration-300
               ${isListening
                ? 'bg-red-500 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-brand-navy animate-pulse'
                : 'text-brand-light hover:text-white hover:bg-brand-dark'}
             `}
            title={isListening ? "Arrêter d'écouter" : "Dicter un message"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isListening ? "Écoute en cours..." : "Décrivez votre situation..."}
          className={`
            flex-1 
            bg-white 
            text-base text-brand-navy placeholder-slate-500 font-medium
            border-0 rounded-xl px-4 py-3 
            focus:ring-2 focus:ring-brand-amber focus:outline-none 
            transition-all 
            ${isListening ? 'ring-2 ring-red-500' : ''}
          `}
          disabled={disabled}
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="bg-brand-amber text-brand-navy p-3 rounded-xl hover:bg-brand-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg font-bold"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default InputArea;
