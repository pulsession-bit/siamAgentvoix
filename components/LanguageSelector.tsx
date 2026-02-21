import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Language } from '../locales/translations';

interface LanguageSelectorProps {
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    isDark?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    currentLanguage,
    onLanguageChange,
    isDark = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' }
    ];

    const currentLangObj = languages.find(l => l.code === currentLanguage);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                    ${isDark
                        ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 hover:border-slate-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}
                    shadow-sm active:scale-95`}
            >
                <span className="text-sm font-bold uppercase">{currentLanguage}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-xl border overflow-hidden z-[100] animate-in fade-in zoom-in-95
                    ${isDark
                        ? 'bg-brand-navy border-slate-700'
                        : 'bg-white border-slate-100'}`}
                >
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    onLanguageChange(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                                    ${currentLanguage === lang.code
                                        ? (isDark ? 'bg-brand-amber/10 text-brand-amber font-bold' : 'bg-brand-amber/5 text-brand-amber font-bold')
                                        : (isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </div>
                                {currentLanguage === lang.code && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-amber" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
