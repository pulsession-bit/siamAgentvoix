
import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { AuditResult } from '../types';

interface AuditScoreProps {
  result: AuditResult;
}

const AuditScore: React.FC<AuditScoreProps> = ({ result }) => {
  const score = result.confidence_score || 0;

  // Use brand colors for chart: Green for high score, Amber for mid, Red for low
  const fillColor = score > 80 ? '#22c55e' : score > 50 ? '#FFAB00' : '#ef4444';

  const data = [
    {
      name: 'Confidence',
      value: score,
      fill: fillColor,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full mb-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Chart Section */}
        <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0 mx-auto md:mx-0">
          <ResponsiveContainer width="100%" height="100%">
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
            <span className="text-2xl md:text-3xl font-bold text-brand-navy">{score}%</span>
            <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Confiance</span>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-4">
            {result.audit_status === 'VALID' && <CheckCircle className="text-green-500 w-6 h-6" />}
            {result.audit_status === 'INVALID' && <XCircle className="text-red-500 w-6 h-6" />}
            {result.audit_status === 'PENDING' && <AlertCircle className="text-brand-amber w-6 h-6" />}

            <h3 className="text-xl font-bold text-brand-navy">
              {result.audit_status === 'VALID' ? 'Dossier Conforme' :
                result.audit_status === 'INVALID' ? 'Dossier Incomplet' : 'Analyse en cours'}
            </h3>
          </div>

          <div className="space-y-4">
            {result.issues.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Corrections requises :</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {result.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.missing_docs.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">Documents manquants :</h4>
                <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                  {result.missing_docs.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.audit_status === 'VALID' && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Tous les feux sont au vert. Vous pouvez procéder au paiement sécurisé pour finaliser votre demande.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditScore;
