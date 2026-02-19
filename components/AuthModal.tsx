import React, { useState } from 'react';
import { X, Mail, Lock, User, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks';
import { translations } from '../locales/translations';

interface AuthModalProps {
    onClose: () => void;
    lang: 'fr' | 'en' | 'de' | 'ru';
    onSuccess?: () => void;
}

type AuthMode = 'login' | 'signup';

const AuthModal: React.FC<AuthModalProps> = ({ onClose, lang, onSuccess }) => {
    const { loginWithEmail, signupWithEmail, login: loginWithGoogle } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
            } else {
                await signupWithEmail(email, password, name);
            }
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error(err);
            let msg = "Une erreur est survenue.";
            if (err.code === 'auth/invalid-email') msg = "Email invalide.";
            if (err.code === 'auth/user-not-found') msg = "Utilisateur introuvable.";
            if (err.code === 'auth/wrong-password') msg = "Mot de passe incorrect.";
            if (err.code === 'auth/email-already-in-use') msg = "Cet email est déjà utilisé.";
            if (err.code === 'auth/weak-password') msg = "Le mot de passe doit contenir au moins 6 caractères.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError("Erreur avec Google : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-brand-navy p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img src="https://img.antiquiscore.com/global/logo_v2.png" alt="Siam Visa Pro" className="h-12 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">
                        {mode === 'login' ? 'Connexion Sécurisée' : 'Créer un Compte'}
                    </h2>
                    <p className="text-slate-300 text-sm mt-2">
                        Sauvegardez vos audits et suivez vos démarches.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'login' ? 'text-brand-navy border-b-2 border-brand-amber bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Se connecter
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'signup' ? 'text-brand-navy border-b-2 border-brand-amber bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        S'inscrire
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogle}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            Continuer avec Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-400">ou avec email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nom complet</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Votre nom"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none transition-all"
                                            required={mode === 'signup'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="exemple@email.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mot de passe</label>
                                    {mode === 'login' && (
                                        <button type="button" className="text-xs text-brand-amber hover:underline">Oublié ?</button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none transition-all"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-amber text-brand-navy font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-brand-amber/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
