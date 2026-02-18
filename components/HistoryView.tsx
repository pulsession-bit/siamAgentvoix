import React, { useEffect, useState } from 'react';
import { History, Calendar, Shield, ArrowRight, ArrowLeft, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getCasesByLead } from '../services/dbService';
import { CaseData } from '../types';
import { translations, Language } from '../locales/translations';
import AuditScore from './AuditScore';
import SummaryView from './SummaryView';

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
        // Map our internal lang codes to standard locales
        const localeMap: Record<string, string> = {
            'fr': 'fr-FR',
            'en': 'en-US',
            'de': 'de-DE',
            'ru': 'ru-RU'
        };
        return new Date(isoString).toLocaleDateString(localeMap[lang] || 'en-US', {
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
        <div className={`bg-white rounded-2xl shadow-xl w-full mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-200 transition-all ${selectedCase ? 'max-w-5xl' : 'max-w-2xl'}`}>
            {/* Header */}
            <div className="bg-brand-navy p-6 flex justify-between items-center text-white sticky top-0 z-10">
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
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold">
                            {selectedCase ? getLocalizedVisaType(selectedCase.intent) : t.history_title}
                        </h2>
                        {selectedCase && (
                            <span className="text-xs font-normal text-slate-300">
                                {formatDate(selectedCase.last_event_at)}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* List or Detail */}
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50">
                {selectedCase ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* 1. Technical Audit Result */}
                        {selectedCase.audit ? (
                            <AuditScore result={selectedCase.audit} lang={lang} />
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 italic">
                                {t.history_no_technical_data}
                            </div>
                        )}

                        {/* 2. Detailed Summary & Action Plan */}
                        {selectedCase.summary ? (
                            <div className="-mx-4 md:mx-0">
                                <SummaryView summary={selectedCase.summary} lang={lang} />
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 italic">
                                {t.history_no_summary}
                            </div>
                        )}

                        <div className="flex justify-center pt-6">
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-full hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                {t.history_back_to_list}
                            </button>
                        </div>
                    </div>
                ) : !email ? (
                    <div className="text-center py-12">
                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                            <Shield size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium mb-2">
                            {t.email_required}
                        </p>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            {t.email_required_desc}
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="animate-spin text-brand-amber" size={32} />
                        <p className="text-slate-500 text-sm">{t.history_loading}</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
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
                                className="w-full text-left group bg-white hover:bg-white border border-slate-200 hover:border-brand-amber/50 rounded-xl p-4 transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
                            >
                                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${c.confidence_score > 80 ? 'bg-green-100 text-green-600' : 'bg-brand-amber/10 text-brand-amber'} transition-colors`}>
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-lg text-brand-navy">{getLocalizedVisaType(c.intent)}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${c.status.includes('DONE') || c.status.includes('VALID') ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {getLocalizedStatus(c.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                <Calendar size={12} />
                                                <span>{formatDate(c.last_event_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 pl-14 sm:pl-0">
                                        <div className="text-right">
                                            <div className="text-xl font-black text-brand-navy">
                                                {c.confidence_score}<span className="text-sm text-slate-300 font-normal">/100</span>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                {t.val_visa_score}
                                            </div>
                                        </div>
                                        <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-amber transition-colors mt-0.5" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-white p-4 border-t border-slate-100 text-center">
                <button
                    onClick={selectedCase ? () => setSelectedCase(null) : onClose}
                    className="text-slate-400 hover:text-brand-navy text-sm font-medium transition-colors"
                >
                    {t.btn_close}
                </button>
            </div>
        </div>
    );
};

export default HistoryView;
