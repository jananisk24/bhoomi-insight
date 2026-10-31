export type RiskCategory = 'Low' | 'Medium' | 'High' | 'Not Predicted';

export type ProjectStatus =
| 'On Track'
| 'In Progress'
| 'Moderate Delay'
| 'Severely Delayed'
| 'Cleared'
| 'Not Predicted';

export type CompensationStatus =
| 'Disbursed (100%)'
| 'Partially Disbursed (50-75%)'
| 'Pending (<25%)'
| 'Under Dispute'
| 'In Progress'
| 'Pending'
| 'Not Started'
| 'Paid'
| 'Unknown';

export type ApprovalStatus =
| 'Cleared / Approved'
| 'In Administrative Review'
| 'Environmental Clearance Pending'
| 'Incomplete Documentation'
| 'Unknown';

export type RehabilitationStatus =
| 'Completed'
| 'In Progress'
| 'Land Allocated'
| 'Not Started';

export type PossessionStatus = 'Not Taken' | 'Partial' | 'Full' | 'Unknown';

export type AcquisitionStage =
| 'Planning'
| 'Approval'
| 'Compensation'
| 'Rehabilitation'
| 'Possession';

export interface StageRisk {
score: number;
category: Exclude<RiskCategory, 'Not Predicted'>;
}

export interface DelayFactors {
compensationPending: number;
legalDispute: number;
approvalDelay: number;
rehabilitationGap: number;
}

export interface Project {
id: string;
name: string;
district: string;
state: string;

/** Land area displayed in acres. */
landArea: number;

affectedFamilies: number;
compensationStatus: CompensationStatus;
legalDispute: boolean;
approvalStatus: ApprovalStatus;
rehabilitationStatus: RehabilitationStatus;

/** ML-generated delay probability, expressed as a percentage. */
riskScore: number | null;
riskCategory: RiskCategory;
status: ProjectStatus;

coordinates: [number, number] | null;
projectType: string;
approvalDaysPending?: number;
possessionStatus?: PossessionStatus;
rehabilitationProgress?: number;
stakeholderScore?: number;
districtHistoricalDelay?: number;
stageRisk?: Partial<Record<AcquisitionStage, StageRisk>> | null;
highestRiskStage?: AcquisitionStage | null;

/** Rule-based factor severity scores, not ML feature attribution. */
delayFactors: DelayFactors;

recommendedActions: string[];
createdDate: string;

/** Null means a verified delay estimate is unavailable. */
estimatedDelayMonths: number | null;

budgetCr: number;
}

export interface User {
username: string;
fullName: string;
role: string;
department: string;
isAuthenticated: boolean;
}

export type ActivePage =
| 'dashboard'
| 'projects'
| 'add-project'
| 'edit-project'
| 'prediction-result'
| 'what-if'
| 'analytics'
| 'gis-map'
| 'alerts'
| 'login';
