import React from 'react';
import { Phone, MessageSquare, X } from 'lucide-react';

interface VoiceUpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    onDecline: () => void;
}

const VoiceUpsellModal: React.FC<VoiceUpsellModalProps> = ({ isOpen, onClose, onAccept, onDecline }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-amber/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="relative z-10 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-brand-amber/30 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden border-4 border-white">
                            <img src="https://img.antiquiscore.com/global/Natt.webp" alt="Natt Agent" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-brand-navy mb-2">Passez à la vitesse supérieure</h3>
                    <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                        Notre expert IA vocal peut qualifier votre dossier <strong>3x plus vite</strong> qu'à l'écrit. Voulez-vous essayer l'expérience vocale ?
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onAccept}
                            className="w-full py-4 bg-brand-amber text-brand-navy font-bold rounded-xl shadow-lg hover:bg-brand-yellow transition-all flex items-center justify-center gap-3 transform active:scale-95"
                        >
                            <Phone size={20} />
                            Oui, démarrer l'appel (Recommandé)
                        </button>

                        <button
                            onClick={onDecline}
                            className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-3"
                        >
                            <MessageSquare size={18} />
                            Non, je préfère écrire
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceUpsellModal;
