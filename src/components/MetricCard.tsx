import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'amber' | 'emerald' | 'blue' | 'rose' | 'slate';
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'amber',
  description
}) => {
  const colorMap = {
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
      border: 'border-amber-500/20',
      lightBg: 'bg-amber-50'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-500',
      border: 'border-emerald-500/20',
      lightBg: 'bg-emerald-50'
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      border: 'border-blue-500/20',
      lightBg: 'bg-blue-50'
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-500',
      border: 'border-rose-500/20',
      lightBg: 'bg-rose-50'
    },
    slate: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-500',
      border: 'border-slate-500/20',
      lightBg: 'bg-slate-50'
    }
  };

  const selectedColor = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow duration-250 relative overflow-hidden group">
      {/* Decorative hover effect background */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${selectedColor.bg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -mr-10 -mt-10`} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedColor.bg} ${selectedColor.text} ${selectedColor.border} border shadow-xs`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="relative z-10 flex items-baseline gap-2">
        <span className="font-display font-bold text-2xl text-slate-800 tracking-tight">{value}</span>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
            trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}%
          </span>
        )}
      </div>

      {description && (
        <p className="text-[10px] text-slate-400 font-mono mt-1 relative z-10">{description}</p>
      )}
    </div>
  );
};
