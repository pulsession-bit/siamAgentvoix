
import React, { useEffect, useState } from 'react';
import { History, Calendar, Shield, ArrowRight, Loader2, X } from 'lucide-react';
import { getCasesByLead } from '../services/dbService';
import { CaseData } from '../types';
import { translations, Language } from '../locales/translations';

interface HistoryViewProps {
    email: string;
    lang: Language;
    onClose: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ email, lang, onClose }) => {
    const [cases, setCases] = useState<CaseData[]>([]);
    const [loading, setLoading] = useState(true);
    const t = translations[lang];

    useEffect(() => {
        const fetchHistory = async () => {
            if (!email) {
                setLoading(false);
                return;
            }
            try {
                const results = await getCasesByLead(email);
                setCases(results);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [email]);

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-200">
            {/* Header */}
            <div className="bg-brand-navy p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <History size={24} className="text-brand-amber" />
                    <h2 className="text-xl font-bold">{t.history_title}</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                {!email ? (
                    <div className="text-center py-12">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium mb-2">
                            {lang === 'fr' ? 'Email requis' : 'Email required'}
                        </p>
                        <p className="text-slate-400 text-sm">
                            {lang === 'fr'
                                ? 'Veuillez saisir votre email dans le formulaire de qualification pour voir votre historique.'
                                : 'Please enter your email in the qualification form to see your history.'}
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="animate-spin text-brand-amber" size={32} />
                        <p className="text-slate-500 text-sm">{lang === 'fr' ? 'Chargement de votre historique...' : 'Loading your history...'}</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">{t.history_empty}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cases.map((c) => (
                            <div
                                key={c.case_id}
                                className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-brand-amber/30 rounded-xl p-4 transition-all duration-300 hover:shadow-md cursor-default"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${c.confidence_score > 80 ? 'bg-green-100 text-green-600' : 'bg-brand-amber/10 text-brand-amber'}`}>
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-brand-navy">{c.intent}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.status.includes('DONE') ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Calendar size={12} />
                                                <span>{formatDate(c.last_event_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg font-black text-brand-navy">
                                            {c.confidence_score}/100
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            Visa Score
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                <button
                    onClick={onClose}
                    className="text-brand-navy font-bold text-sm hover:text-brand-blue transition-colors flex items-center gap-2 mx-auto"
                >
                    {t.history_back} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default HistoryView;
