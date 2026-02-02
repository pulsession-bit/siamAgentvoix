
import React from 'react';
import { VisaType } from '../types';
import { Briefcase, Plane, Sun, Users } from 'lucide-react';

interface VisaSelectProps {
  onSelect: (type: VisaType) => void;
  selected: VisaType;
}

const VisaSelect: React.FC<VisaSelectProps> = ({ onSelect, selected }) => {
  const options: { type: VisaType; label: string; icon: React.ReactNode; desc: string }[] = [
    { 
      type: 'DTV', 
      label: 'DTV Visa', 
      icon: <Briefcase className="w-6 h-6" />, 
      desc: 'Nomades digitaux, Muay Thai, Cuisine' 
    },
    { 
      type: 'Retirement', 
      label: 'Retraite (O-A/O-X)', 
      icon: <Users className="w-6 h-6" />, 
      desc: '+50 ans, Longue durée' 
    },
    { 
      type: 'Tourism', 
      label: 'Tourisme (TR)', 
      icon: <Plane className="w-6 h-6" />, 
      desc: 'Séjour < 60 jours' 
    },
    { 
      type: 'Business', 
      label: 'Business (Non-B)', 
      icon: <Sun className="w-6 h-6" />, 
      desc: 'Travail et Affaires' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto p-4">
      {options.map((opt) => (
        <button
          key={opt.type}
          onClick={() => onSelect(opt.type)}
          className={`
            relative p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-start text-left gap-3
            ${selected === opt.type 
              ? 'border-brand-amber bg-yellow-50 text-brand-navy shadow-md transform scale-[1.02]' 
              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-amber/50 hover:shadow-sm'}
          `}
        >
          <div className={`p-3 rounded-lg ${selected === opt.type ? 'bg-brand-amber text-brand-navy' : 'bg-slate-100 text-slate-500'}`}>
            {opt.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg">{opt.label}</h3>
            <p className="text-sm opacity-80">{opt.desc}</p>
          </div>
          {selected === opt.type && (
            <div className="absolute top-4 right-4 w-3 h-3 bg-brand-amber rounded-full animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
};

export default VisaSelect;
