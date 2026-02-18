import React from 'react';
import { ShieldCheck, Phone, X, History, FileText, Loader2, LogOut, Trash2, CreditCard } from 'lucide-react';
import { AppStep, ChatMessage } from '../types';
import { translations, Language } from '../locales/translations';

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    handleManualCallRequest: () => void;
    step: AppStep;
    setIsHistoryOpen: (isOpen: boolean) => void;
    handleGenerateSummary: () => void;
    isGeneratingSummary: boolean;
    messages: ChatMessage[];
    userEmail: string | null;
    handleGoogleLogin: () => void;
    handleLogout: () => void;
    clearSession: () => void;
    setCapturedEmail: (email: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    language,
    setLanguage,
    handleManualCallRequest,
    step,
    setIsHistoryOpen,
    handleGenerateSummary,
    isGeneratingSummary,
    messages,
    userEmail,
    handleGoogleLogin,
    handleLogout,
    clearSession,
    setCapturedEmail
}) => {
    const t = translations[language];

    return (
        <aside className={`
      fixed inset-0 z-[60] md:static md:inset-auto w-full md:w-80 bg-brand-navy flex flex-col h-full transition-transform duration-300
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
            <div className="p-6 flex flex-col h-full overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-amber rounded-lg flex items-center justify-center text-brand-navy shadow-lg shadow-brand-amber/20">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <a href="https://www.siamvisapro.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-white text-lg block leading-none hover:text-brand-amber transition-colors">Siam Visa Pro</a>
                            <a href="https://www.siamvisapro.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-amber font-bold uppercase tracking-widest mt-1 block hover:text-brand-yellow transition-colors">Audit AI Agent</a>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setLanguage('fr')} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${language === 'fr' ? 'bg-brand-amber text-brand-navy border-brand-amber' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}>FR</button>
                                <button onClick={() => setLanguage('en')} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${language === 'en' ? 'bg-brand-amber text-brand-navy border-brand-amber' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}>EN</button>
                                <button onClick={() => setLanguage('de')} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${language === 'de' ? 'bg-brand-amber text-brand-navy border-brand-amber' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}>DE</button>
                                <button onClick={() => setLanguage('ru')} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${language === 'ru' ? 'bg-brand-amber text-brand-navy border-brand-amber' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}>RU</button>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2">
                        <X size={24} />
                    </button>
                </div>

                {/* Expert CTA */}
                <div className="mb-6">
                    <button
                        onClick={() => {
                            if (!userEmail) {
                                const email = prompt(language === 'fr'
                                    ? "Pour contactez un expert, veuillez d'abord renseigner votre email :"
                                    : "To contact an expert, please enter your email first:");

                                if (email && email.includes('@')) {
                                    setCapturedEmail(email);
                                    handleManualCallRequest();
                                }
                            } else {
                                handleManualCallRequest();
                            }
                        }}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-brand-amber to-brand-yellow rounded-xl p-[2px] shadow-lg hover:shadow-brand-amber/20 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        <div className="bg-brand-navy rounded-[10px] p-3 flex items-center gap-3 h-full">
                            <div className="w-10 h-10 rounded-full border border-brand-amber/50 overflow-hidden bg-white flex-shrink-0">
                                <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Expert" className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 text-left min-w-0">
                                <div className="text-[9px] text-brand-amber font-bold uppercase tracking-wider mb-0.5">{t.cta_live_support}</div>
                                <div className="text-white font-bold text-sm truncate">{t.cta_expert}</div>
                            </div>

                            <div className="bg-brand-amber text-brand-navy p-2 rounded-full animate-pulse shadow-sm">
                                <Phone size={16} />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="space-y-6 flex-1">
                    <StepItem active={step === AppStep.QUALIFICATION} completed={step !== AppStep.QUALIFICATION} label={t.nav_qualification} desc={t.nav_qualification_desc} icon={<FileText size={18} />} />
                    <StepItem active={step === AppStep.AUDIT} completed={step === AppStep.PAYMENT} label={t.nav_audit} desc={t.nav_audit_desc} icon={<ShieldCheck size={18} />} />
                    <StepItem active={step === AppStep.PAYMENT} completed={false} label={t.nav_payment} desc={t.nav_payment_desc} icon={<CreditCard size={18} />} />

                    {/* History Link */}
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="w-full flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-slate-700 text-slate-500 group-hover:border-brand-amber group-hover:text-brand-amber transition-colors flex-shrink-0">
                            <History size={18} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-slate-300 group-hover:text-brand-amber transition-colors">{t.history_title}</h3>
                            <p className="text-[10px] text-slate-500">{language === 'fr' ? 'Consulter vos dossiers' : 'Check your files'}</p>
                        </div>
                    </button>
                </nav>

                {/* Footer */}
                <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary || messages.length < 2}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors border
              ${isGeneratingSummary ? 'bg-slate-800 text-slate-500 border-transparent cursor-wait' : 'bg-transparent text-brand-amber border-brand-amber/30 hover:bg-brand-amber/10'}
              ${messages.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        {isGeneratingSummary ? <Loader2 size={14} className="animate-spin" /> : <FileText size={16} />}
                        {isGeneratingSummary ? t.generating_summary : t.summary_title}
                    </button>

                    {!userEmail ? (
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-2 bg-white text-brand-navy py-3 rounded-xl font-bold text-xs shadow-md hover:bg-slate-100 transition-colors"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="G" className="w-3 h-3" />
                            {t.save_file}
                        </button>
                    ) : (
                        <div className="w-full space-y-2">
                            <div className="text-[10px] text-slate-500 text-center truncate px-2">{userEmail}</div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold text-xs hover:bg-red-900/20 hover:text-red-400 transition-colors"
                            >
                                <LogOut size={14} />
                                {t.logout}
                            </button>
                        </div>
                    )}


                    <button
                        onClick={clearSession}
                        className="w-full py-3 text-slate-500 text-xs flex items-center justify-center gap-2 hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={14} /> {t.reset_audit}
                    </button>

                </div>

                <div className="mt-4 text-center">
                    <span className="text-[9px] text-slate-600 uppercase tracking-tighter">System Status: <span className="text-green-500">Online</span></span>
                </div>
            </div>
        </aside>
    );
};

// Step Item Component
const StepItem = ({ active, completed, label, desc, icon }: {
    active: boolean;
    completed: boolean;
    label: string;
    desc: string;
    icon: React.ReactNode;
}) => (
    <div className={`flex items-start gap-4 transition-all duration-300 ${active || completed ? 'opacity-100' : 'opacity-30'}`}>
        <div className={`
      w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors
      ${completed
                ? 'bg-green-500 border-green-500 text-white'
                : active
                    ? 'border-brand-amber text-brand-amber bg-brand-navy'
                    : 'border-slate-700 text-slate-700'}
    `}>
            {completed ? <ShieldCheck size={18} /> : icon}
        </div>
        <div className="flex flex-col">
            <h3 className={`text-sm font-bold leading-tight ${active ? 'text-brand-amber' : 'text-slate-300'}`}>{label}</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{desc}</p>
            {active && <div className="h-0.5 w-8 bg-brand-amber mt-2 rounded-full animate-pulse" />}
        </div>
    </div>
);

export default Sidebar;
