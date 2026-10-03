import React from 'react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  const colors = {
    Low: 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-500/20',
    Medium: 'bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-500/20',
    High: 'bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-500/20'
  };

  const dots = {
    Low: 'bg-emerald-500',
    Medium: 'bg-amber-500',
    High: 'bg-rose-500'
  };

  return (
    <span
      id={`risk-badge-${category.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]} ${colors[category]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[category]} animate-pulse`} />
      <span>{category} Risk</span>
      {score !== undefined && (
        <span className="font-mono ml-0.5 opacity-85">({score}%)</span>
      )}
    </span>
  );
};
