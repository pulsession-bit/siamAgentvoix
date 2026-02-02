import React from 'react';
import { ChatSummary } from '../types';
import { CheckCircle2, AlertTriangle, FileText, Calendar, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'; // Simple chart for score

interface SummaryProps {
    summary: ChatSummary;
    onClose?: () => void;
}

const SummaryView: React.FC<SummaryProps> = ({ summary, onClose }) => {
    const scoreData = [
        { name: 'Score', value: summary.visa_score },
        { name: 'Remaining', value: 100 - summary.visa_score },
    ];

    const scoreColor = summary.visa_score > 75 ? '#22c55e' : summary.visa_score > 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto my-8 border border-slate-200 animate-in fade-in slide-in-from-bottom-5">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-brand-navy">Synthèse de votre Audit</h2>
                    <p className="text-slate-500 mt-1">Analyse détaillée du profil et recommandations</p>
                </div>
                <div className="mt-4 md:mt-0 px-4 py-2 bg-brand-light rounded-lg">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Visa Ciblé</span>
                    <div className="text-lg font-bold text-brand-blue">{summary.visa_type}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Score & Summary */}
                <div className="md:col-span-1 space-y-6">
                    {/* Score Card */}
                    <div className="bg-brand-navy p-6 rounded-2xl text-center text-white relative overflow-hidden">
                        <h3 className="text-sm font-medium uppercase tracking-widest opacity-80 mb-4">Visa Score</h3>
                        <div className="h-32 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={scoreData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={55}
                                        startAngle={180}
                                        endAngle={0}
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        <Cell key="score" fill={scoreColor} />
                                        <Cell key="rest" fill="#334155" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
                                <span className="text-4xl font-bold">{summary.visa_score}</span>
                                <span className="text-xs opacity-60">/ 100</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs opacity-70 px-2 text-center">
                            {summary.visa_score > 75 ? "Dossier Solide" : summary.visa_score > 50 ? "Prudence Requise" : "Risque Élevé"}
                        </div>
                    </div>

                    {/* Narrative Summary */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <h3 className="font-bold text-brand-navy mb-2 text-sm flex items-center gap-2">
                            <FileText size={16} /> Synthèse
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify">
                            {summary.executive_summary}
                        </p>
                    </div>
                </div>

                {/* Middle/Right Column: Detail */}
                <div className="md:col-span-2 space-y-8">

                    {/* Strengths / Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2 text-sm uppercase">
                                <TrendingUp size={18} /> Points Forts
                            </h3>
                            <ul className="space-y-2">
                                {summary.strengths.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2 text-sm uppercase">
                                <AlertTriangle size={18} /> Points d'Attention
                            </h3>
                            <ul className="space-y-2">
                                {summary.weaknesses.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Timeline / Action Plan */}
                    <div>
                        <h3 className="font-bold text-brand-navy mb-4 flex items-center gap-2 border-l-4 border-brand-amber pl-3">
                            <Calendar size={20} className="text-brand-amber" />
                            Plan d'Action Recommandé
                        </h3>
                        <div className="space-y-4">
                            {summary.action_plan.map((step, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-brand-light text-brand-dark font-bold flex items-center justify-center text-xs group-hover:bg-brand-amber group-hover:text-white transition-colors">
                                            {i + 1}
                                        </div>
                                        {i < summary.action_plan.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1"></div>}
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 text-sm">{step.step}</h4>
                                            <span className="text-xs bg-brand-light text-slate-500 px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2">
                                                {step.timing}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Docs Required */}
                    {summary.required_documents.length > 0 && (
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-xs uppercase mb-3 text-center">Documents Clés à Préparer</h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {summary.required_documents.map((doc, i) => (
                                    <span key={i} className="px-3 py-1 bg-white text-blue-700 text-xs font-medium rounded-full shadow-sm border border-blue-100">
                                        {doc}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {onClose && (
                <div className="mt-8 text-center pt-6 border-t border-slate-100">
                    <button onClick={onClose} className="text-slate-400 hover:text-brand-navy text-sm font-medium transition-colors">
                        Masquer la synthèse
                    </button>
                </div>
            )}
        </div>
    );
};

export default SummaryView;
