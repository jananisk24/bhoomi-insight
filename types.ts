export type RiskCategory = 'Low' | 'Medium' | 'High';

export type ProjectStatus = 'On Track' | 'In Progress' | 'Moderate Delay' | 'Severely Delayed' | 'Cleared';

export type CompensationStatus = 
  | 'Disbursed (100%)'
  | 'Partially Disbursed (50-75%)'
  | 'Pending (<25%)'
  | 'Under Dispute';

export type ApprovalStatus = 
  | 'Cleared / Approved'
  | 'In Administrative Review'
  | 'Environmental Clearance Pending'
  | 'Incomplete Documentation';

export type RehabilitationStatus = 
  | 'Completed'
  | 'In Progress'
  | 'Land Allocated'
  | 'Not Started';

export interface DelayFactors {
  compensationPending: number; // 0 - 100%
  legalDispute: number;        // 0 - 100%
  approvalDelay: number;       // 0 - 100%
  rehabilitationGap: number;   // 0 - 100%
}

export interface Project {
  id: string;
  name: string;
  district: string;
  state: string;
  landArea: number; // in acres
  affectedFamilies: number;
  compensationStatus: CompensationStatus;
  legalDispute: boolean;
  approvalStatus: ApprovalStatus;
  rehabilitationStatus: RehabilitationStatus;
  riskScore: number; // 0 to 100%
  riskCategory: RiskCategory;
  status: ProjectStatus;
  coordinates: [number, number]; // [lat, lng]
  projectType: string;
  delayFactors: DelayFactors;
  recommendedActions: string[];
  createdDate: string;
  estimatedDelayMonths: number;
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
  | 'prediction-result'
  | 'what-if'
  | 'analytics'
  | 'gis-map'
  | 'alerts'
  | 'login';
