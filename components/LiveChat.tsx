import React from 'react';
import { Bot, X, Maximize2, Minimize2 } from 'lucide-react';
import { translations, Language } from '../locales/translations';

interface LiveChatProps {
  url: string;
  lang: Language;
  onClose?: () => void;
  title?: string;
}

const LiveChat: React.FC<LiveChatProps> = ({ 
  url, 
  lang, 
  onClose,
  title = "Siam Visa Pro - Agent Live" 
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const t = translations[lang];

  return (
    <div className={`flex flex-col bg-brand-light shadow-2xl overflow-hidden transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[200] rounded-none' 
        : 'w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 my-8'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-brand-navy shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-brand-amber text-brand-amber">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold tracking-wide uppercase">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-400 font-medium">Assistant Vocal Actif</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            title={isFullscreen ? "Réduire" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-brand-amber hover:text-white hover:bg-brand-amber/20 p-2 rounded-lg transition-colors"
              title="Fermer"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* iFrame Container */}
      <div className="relative w-full bg-black flex-1 min-h-[500px] flex items-center justify-center">
        {url ? (
          <iframe 
            src={url} 
            allow="microphone" 
            title="LiveAvatar Embed"
            className="w-full h-full border-none"
            style={{ 
              aspectRatio: isFullscreen ? 'auto' : '16/9',
              minHeight: isFullscreen ? '100%' : '500px'
            }}
          />
        ) : (
          <div className="text-center p-8">
            <div className="w-16 h-16 border-4 border-brand-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 font-medium">Connexion à l'agent vocal en cours...</p>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 shrink-0 flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium flex gap-2 items-center">
          <span className="w-1.5 h-1.5 bg-brand-amber rounded-full"></span>
          Autorisez l'accès à votre microphone pour parler avec l'expert.
        </p>
        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
          Propulsé par LiveAvatar
        </span>
      </div>
    </div>
  );
};

export default LiveChat;
