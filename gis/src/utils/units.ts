export const HECTARES_PER_ACRE = 0.40468564224;
export const RUPEES_PER_CRORE = 10_000_000;

const acreValueFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  useGrouping: false,
});

const acreLabelFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Format an acre value for display only: at most 2 decimals, no trailing zeros. */
export const formatAcres = (acres: number | null | undefined): string =>
  typeof acres === 'number' && Number.isFinite(acres)
    ? acreValueFormatter.format(acres)
    : 'N/A';

/** Format an acre value with its unit for display only. */
export const formatAcresLabel = (acres: number | null | undefined): string =>
  typeof acres === 'number' && Number.isFinite(acres)
    ? `${acreLabelFormatter.format(acres)} Acres`
    : 'N/A';

export const acresToHectares = (acres: number): number =>
  acres * HECTARES_PER_ACRE;

export const hectaresToAcres = (hectares: number): number =>
  hectares / HECTARES_PER_ACRE;

export const croresToRupees = (crores: number): number =>
  crores * RUPEES_PER_CRORE;

export const rupeesToCrores = (rupees: number): number =>
  rupees / RUPEES_PER_CRORE;

export const probabilityToPercent = (probability: number): number | null =>
  Number.isFinite(probability) && probability >= 0 && probability <= 1
    ? probability * 100
    : null;

/** Format an already-normalized risk percentage for display. */
export const formatRiskPercent = (
  percentage: number | null | undefined
): string =>
  typeof percentage === 'number' && Number.isFinite(percentage)
    ? `${percentage.toFixed(2)}%`
    : 'N/A';
