import React from 'react';
import { VisaType } from '../types';
import { Briefcase, Plane, Sun, Users, Home } from 'lucide-react';
import { translations, Language } from '../locales/translations';

interface VisaSelectProps {
  onSelect: (type: VisaType) => void;
  selected: VisaType;
  disabled?: boolean;
  lang: Language;
}

const VisaSelect: React.FC<VisaSelectProps> = ({ onSelect, selected, disabled = false, lang }) => {
  const t = translations[lang];

  const options: { type: VisaType; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
    {
      type: 'Expatriation',
      label: t.visa_expat_label,
      icon: <Home className="w-6 h-6" />,
      desc: t.visa_expat_desc,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      type: 'DTV',
      label: t.visa_dtv_label,
      icon: <Briefcase className="w-6 h-6" />,
      desc: t.visa_dtv_desc,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      type: 'Retirement',
      label: t.visa_retire_label,
      icon: <Users className="w-6 h-6" />,
      desc: t.visa_retire_desc,
      color: 'bg-green-50 text-green-600'
    },
    {
      type: 'Tourism',
      label: t.visa_tourist_label,
      icon: <Plane className="w-6 h-6" />,
      desc: t.visa_tourist_desc,
      color: 'bg-sky-50 text-sky-600'
    },
    {
      type: 'Business',
      label: t.visa_business_label,
      icon: <Sun className="w-6 h-6" />,
      desc: t.visa_business_desc,
      color: 'bg-amber-50 text-amber-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto p-4 pb-24 md:pb-4">
      {options.map((opt) => {
        const isSelected = selected === opt.type;
        const isFeatured = opt.type === 'Expatriation';

        return (
          <button
            key={opt.type}
            onClick={() => !disabled && onSelect(opt.type)}
            disabled={disabled}
            className={`
                group relative p-5 rounded-2xl border-2 transition-all duration-300 flex items-start text-left gap-4 overflow-hidden
                ${isFeatured ? 'md:col-span-2' : ''}
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                ${isSelected
                ? 'border-brand-amber bg-white shadow-xl ring-1 ring-brand-amber translate-y-[-2px]'
                : 'border-slate-100 bg-white text-slate-600 hover:border-brand-amber/30 hover:shadow-lg hover:translate-y-[-2px]'}
              `}
          >
            {/* Icon Box */}
            <div className={`
                p-3 rounded-xl transition-colors duration-300 flex-shrink-0
                ${isSelected ? 'bg-brand-amber text-brand-navy' : opt.color}
              `}>
              {opt.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-brand-navy' : 'text-slate-800'}`}>{opt.label}</h3>
              <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-600' : 'text-slate-500'}`}>{opt.desc}</p>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-brand-amber rounded-full shadow-sm animate-pulse" />
            )}

            {/* Premium Glow Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none opacity-50" />
          </button>
        );
      })}
    </div>
  );
};

export default VisaSelect;
