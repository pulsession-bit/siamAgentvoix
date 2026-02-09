import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { translations, Language } from '../locales/translations';
import { VisaType } from '../types';
import VisaSelect from './VisaSelect';


interface QualificationStepProps {
    lang: Language;
    onVisaSelect: (type: VisaType) => void;
    visaType: VisaType;
    capturedEmail: string;
    setCapturedEmail: (email: string) => void;
    userEmail: string | null;
}

const QualificationStep: React.FC<QualificationStepProps> = ({
    lang,
    onVisaSelect,
    visaType,
    capturedEmail,
    setCapturedEmail,
    userEmail
}) => {
    const t = translations[lang];
    const [emailError, setEmailError] = useState('');

    const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(capturedEmail)) {
            setEmailError(t.email_error);
            return;
        }
        setEmailError('');
    };

    return (
        <div className="absolute inset-0 z-50 bg-brand-navy flex flex-col items-center justify-start md:justify-center p-6 pt-32 md:pt-6 overflow-y-auto">
            <div className="text-center mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-sm tracking-tight leading-tight">
                    {t.audit_title}
                </h1>
                <p className="text-lg text-white/80 font-medium">
                    {t.audit_subtitle}
                </p>
            </div>

            {!userEmail && (
                <div className="w-full max-w-md mx-auto mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
                        <label className="text-sm text-white/70 font-medium text-center">
                            {t.email_label}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={capturedEmail}
                                    onChange={(e) => {
                                        setCapturedEmail(e.target.value);
                                        if (emailError) setEmailError('');
                                    }}
                                    placeholder={t.email_placeholder}
                                    className="w-full bg-white text-brand-navy placeholder-slate-400 font-medium border-0 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-amber focus:outline-none transition-all text-base"
                                    autoComplete="email"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!capturedEmail.trim()}
                                className="bg-brand-amber text-brand-navy px-5 py-3 rounded-xl font-bold text-sm hover:bg-brand-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                            >
                                OK
                            </button>
                        </div>
                        {emailError && (
                            <p className="text-red-400 text-xs text-center mt-1">{emailError}</p>
                        )}
                        {isValidEmail(capturedEmail) && !emailError && (
                            <p className="text-green-400 text-xs text-center mt-1">{t.email_confirmed}</p>
                        )}
                    </form>
                </div>
            )}

            {/* Email is required (either via Google Login or captured manually) to proceed with Visa Selection */}
            <VisaSelect
                selected={visaType}
                onSelect={onVisaSelect}
                // Enable if user is logged in OR has entered a valid email
                disabled={!userEmail && (!isValidEmail(capturedEmail) || !!emailError)}
                lang={lang}
            />
        </div>
    );
};

export default QualificationStep;
