import { ApprovalStatus, CompensationStatus, DelayFactors, RehabilitationStatus, RiskCategory } from '../types';

export interface PredictionInput {
  landArea: number;
  affectedFamilies: number;
  compensationStatus: CompensationStatus;
  legalDispute: boolean;
  approvalStatus: ApprovalStatus;
  rehabilitationStatus: RehabilitationStatus;
}

export interface PredictionResult {
  riskScore: number;
  riskCategory: RiskCategory;
  predictedStatus: string;
  delayFactors: DelayFactors;
  recommendedActions: string[];
  estimatedDelayMonths: number;
}

/**
 * Predicts land acquisition delay risk using a weighted scoring model
 * with transparent feature weights and quantitative risk metrics.
 */
export function calculateDelayRisk(input: PredictionInput): PredictionResult {
  // 1. Legal dispute factor (Weight: 30%)
  const legalScore = input.legalDispute ? 90 : 15;

  // 2. Compensation status factor (Weight: 30%)
  let compensationScore = 20;
  switch (input.compensationStatus) {
    case 'Disbursed (100%)':
      compensationScore = 10;
      break;
    case 'Partially Disbursed (50-75%)':
      compensationScore = 45;
      break;
    case 'Pending (<25%)':
      compensationScore = 80;
      break;
    case 'Under Dispute':
      compensationScore = 95;
      break;
  }

  // 3. Approval status factor (Weight: 25%)
  let approvalScore = 15;
  switch (input.approvalStatus) {
    case 'Cleared / Approved':
      approvalScore = 10;
      break;
    case 'In Administrative Review':
      approvalScore = 40;
      break;
    case 'Environmental Clearance Pending':
      approvalScore = 75;
      break;
    case 'Incomplete Documentation':
      approvalScore = 90;
      break;
  }

  // 4. Rehabilitation status factor (Weight: 15%)
  let rehabScore = 15;
  switch (input.rehabilitationStatus) {
    case 'Completed':
      rehabScore = 10;
      break;
    case 'In Progress':
      rehabScore = 45;
      break;
    case 'Land Allocated':
      rehabScore = 65;
      break;
    case 'Not Started':
      rehabScore = 90;
      break;
  }

  // Scale adjustment based on affected families and land area
  const scaleBonus = Math.min(15, (input.affectedFamilies > 500 ? 8 : 0) + (input.landArea > 200 ? 7 : 0));

  // Weighted sum
  const rawScore = 
    (legalScore * 0.30) +
    (compensationScore * 0.30) +
    (approvalScore * 0.25) +
    (rehabScore * 0.15) +
    scaleBonus;

  const riskScore = Math.min(98, Math.max(12, Math.round(rawScore)));

  // Determine Category
  let riskCategory: RiskCategory = 'Low';
  let predictedStatus = 'On Track (Low probability of acquisition bottleneck)';
  let estimatedDelayMonths = 0;

  if (riskScore >= 70) {
    riskCategory = 'High';
    predictedStatus = 'Critical Delay Anticipated (High probability of stalling)';
    estimatedDelayMonths = Math.round(8 + (riskScore - 70) * 0.4);
  } else if (riskScore >= 40) {
    riskCategory = 'Medium';
    predictedStatus = 'Moderate Delay Risk (Requires active administrative monitoring)';
    estimatedDelayMonths = Math.round(3 + (riskScore - 40) * 0.15);
  } else {
    riskCategory = 'Low';
    predictedStatus = 'Normal Progression (Project cleared for scheduled land handover)';
    estimatedDelayMonths = 0;
  }

  // Generate tailored recommended actions
  const recommendedActions: string[] = [];

  if (input.legalDispute) {
    recommendedActions.push('Establish dedicated Lok Adalat fast-track legal reconciliation bench.');
  }
  if (input.compensationStatus === 'Pending (<25%)' || input.compensationStatus === 'Under Dispute') {
    recommendedActions.push('Authorize direct benefit transfer (DBT) escrow deposit for pending land parcels.');
  } else if (input.compensationStatus === 'Partially Disbursed (50-75%)') {
    recommendedActions.push('Expedite verification of remaining 25% title deeds at Tahsildar office.');
  }
  if (input.approvalStatus === 'Environmental Clearance Pending') {
    recommendedActions.push('Submit mandatory compensatory afforestation plan to Ministry of Environment.');
  } else if (input.approvalStatus === 'Incomplete Documentation') {
    recommendedActions.push('Convene inter-departmental revenue audit to rectify cadastral map discrepancies.');
  }
  if (input.rehabilitationStatus === 'Not Started' || input.rehabilitationStatus === 'Land Allocated') {
    recommendedActions.push('Finalize civic amenities layout and basic infrastructure tender for R&R colony.');
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push('Maintain bi-weekly drone survey and maintain routine revenue liaison.');
    recommendedActions.push('Proceed with physical possession and boundary demarcation.');
  }

  return {
    riskScore,
    riskCategory,
    predictedStatus,
    delayFactors: {
      compensationPending: compensationScore,
      legalDispute: legalScore,
      approvalDelay: approvalScore,
      rehabilitationGap: rehabScore
    },
    recommendedActions,
    estimatedDelayMonths
  };
}
