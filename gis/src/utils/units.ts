export const HECTARES_PER_ACRE = 0.40468564224;
export const RUPEES_PER_CRORE = 10_000_000;

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
