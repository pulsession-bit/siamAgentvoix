

import React, { useEffect, useRef } from 'react';
import { ChatMessage, Sender } from '../types';
import { Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4 min-h-0"> {/* Removed scrollbar-hide for better UX */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Avatar */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
            ${msg.sender === 'agent'
              ? 'bg-brand-amber text-brand-navy' // Agent: Amber bg, Navy icon
              : 'bg-brand-navy text-white'}      // User: Navy bg, White icon
          `}>
            {msg.sender === 'agent' ? <Bot size={18} /> : <User size={18} />}
          </div>

          {/* Bubble Container */}
          <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              px-5 py-4 text-sm leading-relaxed shadow-sm rounded-2xl
              ${msg.sender === 'agent'
                ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                : 'bg-brand-navy text-white rounded-tr-none'}
            `}>
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <span className={`font-bold ${msg.sender === 'agent' ? 'text-brand-navy bg-brand-amber/10' : 'text-brand-amber bg-white/10'} px-1 rounded`} {...props} />,
                    ul: ({ node, ...props }) => <ul className={`list-disc list-inside space-y-1 my-2 ${msg.sender === 'agent' ? 'marker:text-brand-amber' : 'marker:text-white/50'}`} {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2" {...props} />,
                    li: ({ node, ...props }) => <li className="ml-1" {...props} />,
                    h1: ({ node, ...props }) => <h3 className={`text-lg font-bold ${msg.sender === 'agent' ? 'text-brand-navy' : 'text-white'} mb-2 mt-4 border-b ${msg.sender === 'agent' ? 'border-brand-amber/20' : 'border-white/20'} pb-1`} {...props} />,
                    h2: ({ node, ...props }) => <h3 className={`text-md font-bold ${msg.sender === 'agent' ? 'text-brand-navy' : 'text-white'} mb-2 mt-3`} {...props} />,
                    h3: ({ node, ...props }) => <h4 className={`text-sm font-bold ${msg.sender === 'agent' ? 'text-brand-blue' : 'text-brand-amber'} mb-1 mt-2 uppercase tracking-wide`} {...props} />,
                    blockquote: ({ node, ...props }) => {
                      const { cite, ...rest } = props as any;
                      return (
                        <div className={`${msg.sender === 'agent' ? 'bg-blue-50 border-brand-blue text-slate-600' : 'bg-white/10 border-brand-amber text-slate-200'} border-l-4 p-3 my-2 rounded-r-lg text-xs italic`} {...rest} />
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
      ))}

      {isTyping && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-amber text-brand-navy flex items-center justify-center shadow-sm">
            <Bot size={18} />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">L'auditeur analyse...</span>
            <Loader2 className="w-3 h-3 animate-spin text-brand-blue" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default Chat;
