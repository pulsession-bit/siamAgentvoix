import React from 'react';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { AuditResult, AppStep } from '../types';

interface PaymentStepProps {
    auditResult: AuditResult | null;
    setStep: (step: AppStep) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ auditResult, setStep }) => {
    return (
        <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-bold text-brand-navy mb-2">Dossier Validé !</h2>
            <div className="mb-8">
                <span className="inline-block px-4 py-1.5 bg-green-500 text-white rounded-full text-sm font-bold shadow-sm">
                    Score de confiance : {auditResult?.confidence_score}%
                </span>
            </div>
            <p className="text-slate-600 mb-8 max-w-sm leading-relaxed">
                Félicitations ! Votre dossier est jugé conforme par notre IA. Nos experts sont prêts à procéder au dépôt officiel.
            </p>
            <div className="w-full max-w-sm bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 font-medium">Service de dépôt Siam Visa</span>
                    <span className="text-brand-navy font-bold text-lg">1,000.00 €</span>
                </div>
                <button className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2">
                    <CreditCard size={20} />
                    Procéder au paiement
                </button>
            </div>
            <button onClick={() => setStep(AppStep.AUDIT)} className="text-slate-400 hover:text-brand-navy text-sm flex items-center gap-1 transition-colors">
                Réviser mes documents
            </button>
        </div>
    );
};

export default PaymentStep;
