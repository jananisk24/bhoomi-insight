import {
ApprovalStatus,
CompensationStatus,
DelayFactors,
RehabilitationStatus,
RiskCategory,
} from '../types';

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

export function calculateDelayRisk(input: PredictionInput): PredictionResult {
// Legal dispute severity
const legalScore = input.legalDispute ? 90 : 15;

// Compensation severity
let compensationScore: number;

switch (input.compensationStatus) {
case 'Disbursed (100%)':
case 'Paid':
compensationScore = 10;
break;


case 'Partially Disbursed (50-75%)':
  compensationScore = 45;
  break;

case 'In Progress':
  compensationScore = 55;
  break;

case 'Pending (<25%)':
case 'Pending':
case 'Not Started':
  compensationScore = 80;
  break;

case 'Under Dispute':
  compensationScore = 95;
  break;

default:
  compensationScore = 50;

}

// Approval severity
let approvalScore: number;

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

default:
  approvalScore = 50;

}

// Rehabilitation severity
let rehabScore: number;

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

default:
  rehabScore = 50;


}

// Scale adjustment
const scaleBonus =
(input.affectedFamilies > 500 ? 8 : 0) +
(input.landArea > 200 ? 7 : 0);

// Weighted rule-based score
const rawScore =
legalScore * 0.30 +
compensationScore * 0.30 +
approvalScore * 0.25 +
rehabScore * 0.15 +
scaleBonus;

const riskScore = Math.min(98, Math.max(12, Math.round(rawScore)));

// Risk category and indicative delay
let riskCategory: RiskCategory;
let predictedStatus: string;
let estimatedDelayMonths: number;

if (riskScore >= 70) {
riskCategory = 'High';
predictedStatus = 'High Delay Risk - Immediate administrative attention required';
estimatedDelayMonths = Math.round(8 + (riskScore - 70) * 0.4);
} else if (riskScore >= 40) {
riskCategory = 'Medium';
predictedStatus = 'Moderate Delay Risk - Active monitoring recommended';
estimatedDelayMonths = Math.round(3 + (riskScore - 40) * 0.15);
} else {
riskCategory = 'Low';
predictedStatus = 'Low Delay Risk - Routine monitoring recommended';
estimatedDelayMonths = 0;
}

// Recommended administrative actions
const recommendedActions: string[] = [];

if (input.legalDispute) {
recommendedActions.push(
'Review pending legal cases and coordinate with the concerned legal authorities.'
);
}

if (
input.compensationStatus === 'Pending (<25%)' ||
input.compensationStatus === 'Pending' ||
input.compensationStatus === 'Not Started' ||
input.compensationStatus === 'Under Dispute'
) {
recommendedActions.push(
'Verify pending compensation claims and resolve payment-related disputes.'
);
} else if (
input.compensationStatus === 'Partially Disbursed (50-75%)' ||
input.compensationStatus === 'In Progress'
) {
recommendedActions.push(
'Verify remaining compensation claims and complete eligible disbursements.'
);
}

if (input.approvalStatus === 'Environmental Clearance Pending') {
recommendedActions.push(
'Coordinate with the concerned environmental authority to obtain pending clearance.'
);
} else if (input.approvalStatus === 'Incomplete Documentation') {
recommendedActions.push(
'Review and complete missing land acquisition and administrative documents.'
);
} else if (input.approvalStatus === 'In Administrative Review') {
recommendedActions.push(
'Follow up with the concerned department to complete administrative approval.'
);
}

if (
input.rehabilitationStatus === 'Not Started' ||
input.rehabilitationStatus === 'Land Allocated'
) {
recommendedActions.push(
'Prepare rehabilitation facilities and monitor resettlement implementation.'
);
} else if (input.rehabilitationStatus === 'In Progress') {
recommendedActions.push(
'Monitor rehabilitation progress and complete the remaining resettlement activities.'
);
}

if (recommendedActions.length === 0) {
recommendedActions.push(
'Continue regular project monitoring and update acquisition progress.'
);
}

return {
riskScore,
riskCategory,
predictedStatus,
delayFactors: {
compensationPending: compensationScore,
legalDispute: legalScore,
approvalDelay: approvalScore,
rehabilitationGap: rehabScore,
},
recommendedActions,
estimatedDelayMonths,
};
}
