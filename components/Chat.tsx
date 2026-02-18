import React, { useEffect, useRef } from 'react';
import { ChatMessage, Sender } from '../types';
import { Bot, User, Loader2, Phone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { translations, Language } from '../locales/translations';

interface ChatProps {
  messages: ChatMessage[];
  isTyping: boolean;
  lang: Language;
}

const Chat: React.FC<ChatProps> = ({ messages, isTyping, lang }) => {
  const t = translations[lang];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4 min-h-0"> {/* Removed scrollbar-hide for better UX */}
      {messages.map((msg) => {
        // Call Summary Card — distinct design for system messages
        if (msg.sender === 'system') {
          const transcriptBody = msg.text
            .replace(/📄\s*\*\*RÉSUMÉ DE L'APPEL\*\*\s*/i, '')
            .trim();

          return (
            <div key={msg.id} className="w-[95%] mx-auto">
              <div className="bg-gradient-to-br from-slate-50 to-white border border-brand-amber/30 rounded-2xl shadow-md overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-brand-navy/5 border-b border-brand-amber/20">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-amber flex-shrink-0">
                    <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Agent" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Phone size={14} className="text-brand-navy" />
                    <span className="text-sm font-bold text-brand-navy uppercase tracking-wide">
                      {lang === 'en' ? 'Call Summary' : "Résumé de l'appel"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Card Body — scrollable transcript */}
                <div className="px-4 py-3 max-h-[300px] overflow-y-auto">
                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    {transcriptBody.split('\n\n').filter(Boolean).map((line, i) => {
                      const isAgent = line.startsWith('[Agent]');
                      const isUser = line.startsWith('[Moi]') || line.startsWith('[Me]');
                      return (
                        <div key={i} className={`flex gap-2 ${isUser ? 'justify-end' : ''}`}>
                          <div className={`
                            max-w-[85%] px-3 py-2 rounded-xl
                            ${isAgent ? 'bg-brand-navy/5 text-slate-700 rounded-tl-none' : ''}
                            ${isUser ? 'bg-brand-navy text-white rounded-tr-none' : ''}
                            ${!isAgent && !isUser ? 'bg-slate-100 text-slate-500 italic' : ''}
                          `}>
                            {line}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-2 border-t border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest">Powered by Gemini Live</span>
                </div>
              </div>
            </div>
          );
        }

        // Regular chat bubbles (user / agent)
        return (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Avatar */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden
            ${msg.sender === 'agent'
              ? 'bg-white border-2 border-brand-amber'
              : 'bg-brand-navy text-white'}
          `}>
            {msg.sender === 'agent' ? (
              <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Natt Agent" className="w-full h-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </div>

          {/* Bubble Container */}
          <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              px-5 py-4 text-sm leading-relaxed shadow-sm rounded-2xl
              ${msg.sender === 'agent'
                ? 'bg-brand-navy text-white rounded-tl-none'
                : 'bg-white border border-slate-200 text-slate-800 rounded-tr-none'}
            `}>
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <span className={`font-bold ${msg.sender === 'agent' ? 'text-brand-amber bg-white/10' : 'text-brand-navy bg-brand-amber/10'} px-1 rounded`} {...props} />,
                    ul: ({ node, ...props }) => <ul className={`list-disc list-inside space-y-1 my-2 ${msg.sender === 'agent' ? 'marker:text-brand-amber' : 'marker:text-slate-400'}`} {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2" {...props} />,
                    li: ({ node, ...props }) => <li className="ml-1" {...props} />,
                    h1: ({ node, ...props }) => <h3 className={`text-lg font-bold ${msg.sender === 'agent' ? 'text-white' : 'text-brand-navy'} mb-2 mt-4 border-b ${msg.sender === 'agent' ? 'border-white/20' : 'border-brand-amber/20'} pb-1`} {...props} />,
                    h2: ({ node, ...props }) => <h3 className={`text-md font-bold ${msg.sender === 'agent' ? 'text-white' : 'text-brand-navy'} mb-2 mt-3`} {...props} />,
                    h3: ({ node, ...props }) => <h4 className={`text-sm font-bold ${msg.sender === 'agent' ? 'text-brand-amber' : 'text-brand-blue'} mb-1 mt-2 uppercase tracking-wide`} {...props} />,
                    blockquote: ({ node, ...props }) => {
                      const { cite, ...rest } = props as any;
                      return (
                        <div className={`${msg.sender === 'agent' ? 'bg-white/10 border-brand-amber text-slate-200' : 'bg-blue-50 border-brand-blue text-slate-600'} border-l-4 p-3 my-2 rounded-r-lg text-xs italic`} {...rest} />
                      );
                    },
                    a: ({ node, ...props }) => <a className="underline text-brand-blue hover:text-brand-navy" target="_blank" rel="noopener noreferrer" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>

              {/* Attachments Preview */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.attachments.map((file, idx) => (
                    <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/20 w-24 h-24 bg-black/20">
                      <img
                        src={file.data}
                        alt={file.name}
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata Row: Speaker & Timestamp */}
            <div className="flex items-center gap-2 mt-1 px-1 opacity-70 hover:opacity-100 transition-opacity">
              <div className={`text-[10px] ${msg.sender === 'agent' ? 'text-slate-400' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
        );
      })}

      {isTyping && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-brand-amber flex items-center justify-center shadow-sm overflow-hidden">
            <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Natt Agent" className="w-full h-full object-cover" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">{t.auditor_analyzing}</span>
            <Loader2 className="w-3 h-3 animate-spin text-brand-blue" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default Chat;
