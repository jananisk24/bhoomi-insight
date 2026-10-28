export type RiskCategory = 'Low' | 'Medium' | 'High' | 'Not Predicted';

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
  backendPrediction?: BackendPrediction;
}
export interface BackendPrediction {
  prediction_id: number;
  project_id: number;
  project_name: string;
  delayed: boolean;
  delay_probability: number;
  risk_score: number;
  risk_level: RiskCategory;
  stage_risk: {
    Planning: {
      score: number;
      category: RiskCategory;
    };
    Approval: {
      score: number;
      category: RiskCategory;
    };
    Compensation: {
      score: number;
      category: RiskCategory;
    };
    Rehabilitation: {
      score: number;
      category: RiskCategory;
    };
    Possession: {
      score: number;
      category: RiskCategory;
    };
  };
  highest_risk_stage: string;
  status: string;
}

export interface User {
  username: string;
  fullName: string;
  role: string;
  department: string;
  isAuthenticated: boolean;
}
export interface BackendPredictionRecord {
  id: number;
  project_id: number;
  delay_probability: number;
  risk_level: RiskCategory;
  created_at: string;
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
