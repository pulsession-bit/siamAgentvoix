import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, Check } from 'lucide-react';
import { translations, Language } from '../locales/translations';
import { VisaType } from '../types';
import VisaSelect from './VisaSelect';
import { useAuth } from '../hooks';


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
    const { login: loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const [email, setEmail] = useState(capturedEmail || '');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAuthenticated = !!userEmail;

    const handleGoogle = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Erreur Google');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (authMode === 'login') {
                await loginWithEmail(email, password);
            } else {
                await signupWithEmail(email, password, name);
            }
            setCapturedEmail(email);
        } catch (err: any) {
            let msg = lang === 'fr' ? 'Une erreur est survenue.' : 'An error occurred.';
            if (err.code === 'auth/invalid-email') msg = lang === 'fr' ? 'Email invalide.' : 'Invalid email.';
            if (err.code === 'auth/user-not-found') msg = lang === 'fr' ? 'Utilisateur introuvable.' : 'User not found.';
            if (err.code === 'auth/wrong-password') msg = lang === 'fr' ? 'Mot de passe incorrect.' : 'Wrong password.';
            if (err.code === 'auth/email-already-in-use') msg = lang === 'fr' ? 'Cet email est déjà utilisé. Essayez de vous connecter.' : 'Email already in use. Try logging in.';
            if (err.code === 'auth/weak-password') msg = lang === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters.';
            if (err.code === 'auth/invalid-credential') msg = lang === 'fr' ? 'Email ou mot de passe incorrect.' : 'Invalid email or password.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-brand-navy flex flex-col items-center justify-start md:justify-center p-6 pt-24 md:pt-6 overflow-y-auto">
            <div className="text-center mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-sm tracking-tight leading-tight">
                    {t.audit_title}
                </h1>
                <p className="text-lg text-white/80 font-medium">
                    {t.audit_subtitle}
                </p>
            </div>

            {!isAuthenticated && (
                <div className="w-full max-w-md mx-auto mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 space-y-5">

                        <p className="text-sm text-white/70 font-medium text-center">
                            {lang === 'fr' ? 'Créez votre compte pour sauvegarder votre audit' : 'Create your account to save your audit'}
                        </p>

                        {/* Google Button */}
                        <button
                            onClick={handleGoogle}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            {lang === 'fr' ? 'Continuer avec Google' : 'Continue with Google'}
                        </button>

                        {/* Separator */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/20"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-brand-navy px-3 text-white/40">
                                    {lang === 'fr' ? 'ou avec email' : 'or with email'}
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex rounded-lg overflow-hidden border border-white/10">
                            <button
                                onClick={() => setAuthMode('signup')}
                                className={`flex-1 py-2 text-xs font-bold transition-colors ${authMode === 'signup' ? 'bg-brand-amber text-brand-navy' : 'text-white/50 hover:text-white/80'}`}
                            >
                                {lang === 'fr' ? "S'inscrire" : 'Sign up'}
                            </button>
                            <button
                                onClick={() => setAuthMode('login')}
                                className={`flex-1 py-2 text-xs font-bold transition-colors ${authMode === 'login' ? 'bg-brand-amber text-brand-navy' : 'text-white/50 hover:text-white/80'}`}
                            >
                                {lang === 'fr' ? 'Se connecter' : 'Log in'}
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-3">
                            {authMode === 'signup' && (
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={lang === 'fr' ? 'Votre nom' : 'Your name'}
                                        className="w-full bg-white text-brand-navy placeholder-slate-400 font-medium rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-amber focus:outline-none transition-all text-sm"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    placeholder={t.email_placeholder}
                                    className="w-full bg-white text-brand-navy placeholder-slate-400 font-medium rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-amber focus:outline-none transition-all text-sm"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={lang === 'fr' ? 'Mot de passe (6 car. min)' : 'Password (6 chars min)'}
                                    className="w-full bg-white text-brand-navy placeholder-slate-400 font-medium rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-amber focus:outline-none transition-all text-sm"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs text-center">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-amber text-brand-navy font-bold py-3 rounded-xl hover:bg-brand-yellow transition-colors shadow-lg shadow-brand-amber/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                {authMode === 'login'
                                    ? (lang === 'fr' ? 'Se connecter' : 'Log in')
                                    : (lang === 'fr' ? "Créer mon compte" : 'Create my account')
                                }
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isAuthenticated && (
                <div className="w-full max-w-md mx-auto mb-6 animate-in fade-in duration-300">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-center gap-2">
                        <Check size={16} className="text-green-400" />
                        <span className="text-green-300 text-sm font-medium">{userEmail}</span>
                    </div>
                </div>
            )}

            {/* Visa Selection — only enabled when authenticated */}
            <VisaSelect
                selected={visaType}
                onSelect={onVisaSelect}
                disabled={!isAuthenticated}
                lang={lang}
            />
        </div>
    );
};

export default QualificationStep;
