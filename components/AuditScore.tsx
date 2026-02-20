
import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { AuditResult } from '../types';

import { translations, Language } from '../locales/translations';

interface AuditScoreProps {
  result: AuditResult;
  lang: Language;
}

const AuditScore: React.FC<AuditScoreProps> = ({ result, lang }) => {
  const t = translations[lang];
  const score = result.confidence_score || 0;

  // Use brand colors for chart: Green for high score, Amber for mid, Red for low
  const fillColor = score > 85 ? '#22c55e' : score > 60 ? '#FFAB00' : '#ef4444';

  const data = [
    {
      name: 'Confidence',
      value: score,
      fill: fillColor,
    },
  ];

  const getVerdict = () => {
    if (score > 85) return t.audit_verdict_eligible;
    if (score > 60) return t.audit_verdict_conditional;
    return t.audit_verdict_risky;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full mb-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Chart Section */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 mx-auto md:mx-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              barSize={10}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={30}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl md:text-3xl font-bold text-brand-navy">{score}/100</span>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex-1 w-full text-left">
          <h3 className="text-lg md:text-xl font-bold text-brand-navy mb-1 leading-tight">
            {t.audit_terminated.replace('{score}', score.toString())}
          </h3>
          <p className="text-brand-navy/80 font-medium mb-4">
            {t.audit_verdict} <span className="font-bold underline" style={{ color: fillColor }}>{getVerdict()}</span>
          </p>

          <div className="space-y-2 mb-4">
            {score > 85 && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-green-500">✅</span>
                <span>{t.audit_points_ok}</span>
              </div>
            )}

            {/* Calculate remaining bullet slots (max 3 total) */}
            {[
              ...result.issues.map(i => ({ type: 'issue', text: i })),
              ...result.missing_docs.map(i => ({ type: 'doc', text: i }))
            ].slice(0, score > 85 ? 2 : 3).map((item, idx) => (
              <div key={`bullet-${idx}`} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="shrink-0">{item.type === 'issue' ? '⚠️' : '📄'}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-6">
            <p className="text-sm font-medium text-brand-navy/70 italic">
              « {t.audit_next_step} »
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="https://wa.me/66824149840"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand-navy text-white rounded-xl font-bold hover:bg-brand-navy/90 transition-all shadow-md active:scale-[0.98] text-lg"
            >
              <Calendar size={20} />
              {t.audit_cta_call}
            </a>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-[11px] text-amber-900 leading-relaxed">
                {t.audit_push_rdv}
              </p>
            </div>

            <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-bold">
              {t.audit_upload_reminder}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditScore;
