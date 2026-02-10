import React, { useEffect, useState } from 'react';
import { History, Calendar, Shield, ArrowRight, ArrowLeft, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
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

    const getLocalizedVisaType = (intent: string) => {
        const i = intent.toLowerCase();
        if (i.includes('retire')) return t.visa_retire_label;
        if (i.includes('dtv')) return t.visa_dtv_label;
        if (i.includes('expat')) return t.visa_expat_label;
        if (i.includes('touris')) return t.visa_tourist_label;
        if (i.includes('busines')) return t.visa_business_label;
        return intent;
    };

    const getLocalizedStatus = (status: string) => {
        const s = status.toUpperCase();
        if (s.includes('VALID') || s.includes('DONE')) return t.audit_status_valid;
        if (s.includes('INVALID')) return t.audit_status_invalid;
        if (s.includes('PENDING')) return t.audit_status_pending;
        return status;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-200">
            {/* Header */}
            <div className="bg-brand-navy p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    {selectedCase ? (
                        <button
                            onClick={() => setSelectedCase(null)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-brand-amber" />
                        </button>
                    ) : (
                        <History size={24} className="text-brand-amber" />
                    )}
                    <h2 className="text-xl font-bold">
                        {selectedCase ? getLocalizedVisaType(selectedCase.intent) : t.history_title}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* List or Detail */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                {selectedCase ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Score Header */}
                        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                            <div className="text-4xl font-black text-brand-navy mb-1">
                                {selectedCase.confidence_score}/100
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                {t.val_visa_score}
                            </div>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${selectedCase.confidence_score > 80 ? 'bg-green-500 text-white' : 'bg-brand-amber text-brand-navy'
                                }`}>
                                {selectedCase.confidence_score > 80 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {getLocalizedStatus(selectedCase.status)}
                            </div>
                        </div>

                        {/* Summary */}
                        {selectedCase.summary && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-brand-navy flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-brand-amber rounded-full" />
                                    {t.val_synthesis}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap italic bg-blue-50/30 p-4 rounded-xl border border-blue-50">
                                    "{selectedCase.summary.executive_summary}"
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                        <h4 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> {t.val_strengths}
                                        </h4>
                                        <ul className="space-y-2">
                                            {selectedCase.summary.strengths.map((s, i) => (
                                                <li key={i} className="text-xs text-slate-600 flex gap-2">
                                                    <span className="text-green-500">•</span> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                        <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-2">
                                            <AlertCircle size={14} /> {t.val_weaknesses}
                                        </h4>
                                        <ul className="space-y-2">
                                            {selectedCase.summary.weaknesses.map((w, i) => (
                                                <li key={i} className="text-xs text-slate-600 flex gap-2">
                                                    <span className="text-amber-500">•</span> {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Missing Docs */}
                        {selectedCase.audit?.missing_docs && selectedCase.audit.missing_docs.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-xs font-bold text-brand-navy uppercase mb-3 px-1">
                                    {t.audit_missing_docs}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCase.audit.missing_docs.map((doc, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-medium rounded-lg">
                                            {doc}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedCase(null)}
                            className="w-full py-3 text-slate-500 font-medium text-sm hover:text-brand-navy transition-colors"
                        >
                            {lang === 'fr' ? 'Retour à la liste' : 'Back to list'}
                        </button>
                    </div>
                ) : !email ? (
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
                            <button
                                key={c.case_id}
                                onClick={() => setSelectedCase(c)}
                                className="w-full text-left group bg-slate-50 hover:bg-white border border-slate-100 hover:border-brand-amber/30 rounded-xl p-4 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${c.confidence_score > 80 ? 'bg-green-100 text-green-600' : 'bg-brand-amber/10 text-brand-amber'}`}>
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-brand-navy">{getLocalizedVisaType(c.intent)}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.status.includes('DONE') || c.status.includes('VALID') ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {getLocalizedStatus(c.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Calendar size={12} />
                                                <span>{formatDate(c.last_event_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-lg font-black text-brand-navy">
                                                {c.confidence_score}/100
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {t.val_visa_score}
                                            </div>
                                        </div>
                                        <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-amber transition-colors" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                <button
                    onClick={selectedCase ? () => setSelectedCase(null) : onClose}
                    className="text-brand-navy font-bold text-sm hover:text-brand-blue transition-colors flex items-center gap-2 mx-auto"
                >
                    {selectedCase ? (lang === 'fr' ? 'Retour à la liste' : 'Back to list') : t.history_back} {selectedCase ? <ArrowLeft size={16} className="-order-1" /> : <ArrowRight size={16} />}
                </button>
            </div>
        </div>
    );
};

export default HistoryView;
