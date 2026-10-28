import React from 'react';
import type { RiskCategory } from './types';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  category,
  score,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const colors: Record<RiskCategory, string> = {
    Low: 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-500/20',
    Medium: 'bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-500/20',
    High: 'bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-500/20',
    'Not Predicted':
      'bg-slate-100 text-slate-600 border border-slate-200 ring-1 ring-slate-400/20',
  };

  const dots: Record<RiskCategory, string> = {
    Low: 'bg-emerald-500',
    Medium: 'bg-amber-500',
    High: 'bg-rose-500',
    'Not Predicted': 'bg-slate-400',
  };

  const labels: Record<RiskCategory, string> = {
    Low: 'Low Risk',
    Medium: 'Medium Risk',
    High: 'High Risk',
    'Not Predicted': 'Not Predicted',
  };

  return (
    <span
      id={`risk-badge-${category.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center gap-1.5 rounded-full ${
        sizeClasses[size]
      } ${colors[category]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dots[category]} ${
          category !== 'Not Predicted' ? 'animate-pulse' : ''
        }`}
      />

      <span>{labels[category]}</span>

      {score !== undefined && category !== 'Not Predicted' && (
        <span className="font-mono ml-0.5 opacity-85">({score}%)</span>
      )}
    </span>
  );
};