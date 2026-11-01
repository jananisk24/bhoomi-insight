export interface ProjectNumericInputs {
  landArea: string;
  affectedFamilies: string;
  budgetCr: string;
  approvalDaysPending: string;
  stakeholderScore: string;
  districtHistoricalDelay: string;
}

export interface ProjectNumericValues {
  landArea: number;
  affectedFamilies: number;
  budgetCr: number;
  approvalDaysPending: number;
  stakeholderScore: number;
  districtHistoricalDelay: number;
}

export const parseProjectNumericInputs = (
  inputs: ProjectNumericInputs
): ProjectNumericValues | null => {
  if (
    inputs.landArea.trim() === '' ||
    inputs.affectedFamilies.trim() === '' ||
    inputs.budgetCr.trim() === '' ||
    inputs.approvalDaysPending.trim() === '' ||
    inputs.stakeholderScore.trim() === ''
  ) {
    return null;
  }

  const values: ProjectNumericValues = {
    landArea: Number(inputs.landArea),
    affectedFamilies: Number(inputs.affectedFamilies),
    budgetCr: Number(inputs.budgetCr),
    approvalDaysPending: Number(inputs.approvalDaysPending),
    stakeholderScore: Number(inputs.stakeholderScore),
    districtHistoricalDelay:
      inputs.districtHistoricalDelay.trim() === ''
        ? 0
        : Number(inputs.districtHistoricalDelay),
  };

  if (
    !Number.isFinite(values.landArea) ||
    values.landArea <= 0 ||
    !Number.isInteger(values.affectedFamilies) ||
    values.affectedFamilies < 0 ||
    !Number.isFinite(values.budgetCr) ||
    values.budgetCr <= 0 ||
    !Number.isInteger(values.approvalDaysPending) ||
    values.approvalDaysPending < 0 ||
    values.approvalDaysPending > 365 ||
    !Number.isInteger(values.stakeholderScore) ||
    values.stakeholderScore < 1 ||
    values.stakeholderScore > 5 ||
    !Number.isInteger(values.districtHistoricalDelay) ||
    values.districtHistoricalDelay < 0 ||
    values.districtHistoricalDelay > 100
  ) {
    return null;
  }

  return values;
};
