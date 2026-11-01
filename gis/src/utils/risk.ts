import { RiskCategory } from '../types';
import { probabilityToPercent } from './units';

export const normalizeRiskCategory = (value: unknown): RiskCategory => {
  if (typeof value !== 'string') return 'Not Predicted';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return 'Not Predicted';
};

/**
 * The backend stores probabilities from 0 to 1. Older API responses may have
 * contained an already-normalized percentage, so both shapes are accepted.
 */
export const parseRiskPercentage = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  const percentage =
    parsed >= 0 && parsed <= 1 ? probabilityToPercent(parsed) : parsed;
  if (percentage === null) return null;
  return percentage >= 0 && percentage <= 100 ? percentage : null;
};

export interface PredictionDisplay {
  percentage: number | null;
  category: RiskCategory;
  isLegacyRecord: boolean;
}

/**
 * A legacy row can contain 0.0 with a status such as "Pending". Treat that as
 * an unavailable historical value, never as a real 0% delay probability.
 */
export const describePrediction = (
  probability: unknown,
  riskLevel: unknown
): PredictionDisplay => {
  const category = normalizeRiskCategory(riskLevel);
  if (category === 'Not Predicted') {
    return {
      percentage: null,
      category,
      isLegacyRecord: true,
    };
  }

  return {
    percentage: parseRiskPercentage(probability),
    category,
    isLegacyRecord: false,
  };
};
