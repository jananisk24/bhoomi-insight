import { Project } from '../types';

export const initialProjects: Project[] = [
  {
    id: 'PRJ-101',
    name: 'Greenfield Expressway Bypass Link - Phase II',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    landArea: 340,
    affectedFamilies: 420,
    compensationStatus: 'Under Dispute',
    legalDispute: true,
    approvalStatus: 'Environmental Clearance Pending',
    rehabilitationStatus: 'Not Started',
    riskScore: 88,
    riskCategory: 'High',
    status: 'Severely Delayed',
    coordinates: [13.1986, 77.7066],
    projectType: 'Highway / Expressway',
    delayFactors: {
      compensationPending: 95,
      legalDispute: 90,
      approvalDelay: 75,
      rehabilitationGap: 90
    },
    recommendedActions: [
      'Convene district magistrate fast-track compensation settlement council',
      'Submit compensatory afforestation GPS polygon to State Forest Dept',
      'Issue interim rehabilitation assistance checks'
    ],
    createdDate: '2025-08-12',
    estimatedDelayMonths: 14,
    budgetCr: 450
  },
  {
    id: 'PRJ-102',
    name: 'Industrial Smart City & Logistics Hub',
    district: 'Tumakuru',
    state: 'Karnataka',
    landArea: 580,
    affectedFamilies: 680,
    compensationStatus: 'Pending (<25%)',
    legalDispute: true,
    approvalStatus: 'In Administrative Review',
    rehabilitationStatus: 'Land Allocated',
    riskScore: 78,
    riskCategory: 'High',
    status: 'Severely Delayed',
    coordinates: [13.3409, 77.1010],
    projectType: 'Industrial Park',
    delayFactors: {
      compensationPending: 80,
      legalDispute: 90,
      approvalDelay: 40,
      rehabilitationGap: 65
    },
    recommendedActions: [
      'Release second tranche of state acquisition treasury funds',
      'Resolve writ petition regarding fertile irrigated land classification',
      'Expedite ground leveling at the allocated resettlement colony'
    ],
    createdDate: '2025-09-04',
    estimatedDelayMonths: 9,
    budgetCr: 720
  },
  {
    id: 'PRJ-103',
    name: 'High-Speed Rail Freight Corridor Section 4',
    district: 'Belagavi',
    state: 'Karnataka',
    landArea: 210,
    affectedFamilies: 310,
    compensationStatus: 'Partially Disbursed (50-75%)',
    legalDispute: false,
    approvalStatus: 'Environmental Clearance Pending',
    rehabilitationStatus: 'In Progress',
    riskScore: 56,
    riskCategory: 'Medium',
    status: 'Moderate Delay',
    coordinates: [15.8497, 74.4977],
    projectType: 'Railway Corridor',
    delayFactors: {
      compensationPending: 45,
      legalDispute: 15,
      approvalDelay: 75,
      rehabilitationGap: 45
    },
    recommendedActions: [
      'Complete joint survey for remaining 28 revenue parcels',
      'Follow up with zonal railway board for tree felling NOC'
    ],
    createdDate: '2025-10-18',
    estimatedDelayMonths: 5,
    budgetCr: 380
  },
  {
    id: 'PRJ-104',
    name: 'Mega Solar Park & Grid Substation',
    district: 'Ballari',
    state: 'Karnataka',
    landArea: 650,
    affectedFamilies: 140,
    compensationStatus: 'Disbursed (100%)',
    legalDispute: false,
    approvalStatus: 'Cleared / Approved',
    rehabilitationStatus: 'Completed',
    riskScore: 18,
    riskCategory: 'Low',
    status: 'On Track',
    coordinates: [15.1394, 76.9214],
    projectType: 'Solar Power Plant',
    delayFactors: {
      compensationPending: 10,
      legalDispute: 15,
      approvalDelay: 10,
      rehabilitationGap: 10
    },
    recommendedActions: [
      'Proceed with boundary fencing and handover to developer',
      'Verify digital encumbrance certificates in revenue portal'
    ],
    createdDate: '2025-11-01',
    estimatedDelayMonths: 0,
    budgetCr: 520
  },
  {
    id: 'PRJ-105',
    name: 'River Lift Irrigation Canal Right Bank',
    district: 'Vijayapura',
    state: 'Karnataka',
    landArea: 190,
    affectedFamilies: 280,
    compensationStatus: 'Partially Disbursed (50-75%)',
    legalDispute: false,
    approvalStatus: 'In Administrative Review',
    rehabilitationStatus: 'In Progress',
    riskScore: 48,
    riskCategory: 'Medium',
    status: 'In Progress',
    coordinates: [16.8302, 75.7100],
    projectType: 'Irrigation Canal',
    delayFactors: {
      compensationPending: 45,
      legalDispute: 15,
      approvalDelay: 40,
      rehabilitationGap: 45
    },
    recommendedActions: [
      'Speed up validation of inherited property succession records',
      'Conduct community consultation on water distribution rights'
    ],
    createdDate: '2025-11-20',
    estimatedDelayMonths: 4,
    budgetCr: 210
  },
  {
    id: 'PRJ-106',
    name: 'Suburban Regional Airport Runway Expansion',
    district: 'Mysuru',
    state: 'Karnataka',
    landArea: 175,
    affectedFamilies: 195,
    compensationStatus: 'Disbursed (100%)',
    legalDispute: false,
    approvalStatus: 'Cleared / Approved',
    rehabilitationStatus: 'Completed',
    riskScore: 22,
    riskCategory: 'Low',
    status: 'Cleared',
    coordinates: [12.2253, 76.6500],
    projectType: 'Airport Expansion',
    delayFactors: {
      compensationPending: 10,
      legalDispute: 15,
      approvalDelay: 10,
      rehabilitationGap: 10
    },
    recommendedActions: [
      'Coordinate with Airport Authority of India for civil works mobilization',
      'Complete final physical demarcation stones placement'
    ],
    createdDate: '2025-12-05',
    estimatedDelayMonths: 0,
    budgetCr: 290
  },
  {
    id: 'PRJ-107',
    name: 'Ring Road Peripheral Corridor - Segment 3',
    district: 'Shivamogga',
    state: 'Karnataka',
    landArea: 280,
    affectedFamilies: 390,
    compensationStatus: 'Pending (<25%)',
    legalDispute: true,
    approvalStatus: 'Incomplete Documentation',
    rehabilitationStatus: 'Not Started',
    riskScore: 84,
    riskCategory: 'High',
    status: 'Severely Delayed',
    coordinates: [13.9299, 75.5681],
    projectType: 'Highway / Expressway',
    delayFactors: {
      compensationPending: 80,
      legalDispute: 90,
      approvalDelay: 90,
      rehabilitationGap: 90
    },
    recommendedActions: [
      'Address land survey boundary mismatch in Section 11 gazette notification',
      'Schedule high-level collectorate review with legal advocates',
      'Allocate initial budget for temporary displacement allowances'
    ],
    createdDate: '2026-01-10',
    estimatedDelayMonths: 12,
    budgetCr: 410
  },
  {
    id: 'PRJ-108',
    name: 'Coastal Multi-Modal Port Connectivity Link',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    landArea: 160,
    affectedFamilies: 215,
    compensationStatus: 'Partially Disbursed (50-75%)',
    legalDispute: false,
    approvalStatus: 'In Administrative Review',
    rehabilitationStatus: 'In Progress',
    riskScore: 42,
    riskCategory: 'Medium',
    status: 'In Progress',
    coordinates: [12.9141, 74.8560],
    projectType: 'Highway / Expressway',
    delayFactors: {
      compensationPending: 45,
      legalDispute: 15,
      approvalDelay: 40,
      rehabilitationGap: 45
    },
    recommendedActions: [
      'Publish final award determination under Section 23 of RFCTLARR Act',
      'Expedite CRZ (Coastal Regulation Zone) compliance report'
    ],
    createdDate: '2026-01-25',
    estimatedDelayMonths: 3,
    budgetCr: 340
  },
  {
    id: 'PRJ-109',
    name: 'Bio-Tech Innovation SEZ Development',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    landArea: 120,
    affectedFamilies: 95,
    compensationStatus: 'Disbursed (100%)',
    legalDispute: false,
    approvalStatus: 'Cleared / Approved',
    rehabilitationStatus: 'Completed',
    riskScore: 16,
    riskCategory: 'Low',
    status: 'On Track',
    coordinates: [12.9716, 77.5946],
    projectType: 'Industrial Park',
    delayFactors: {
      compensationPending: 10,
      legalDispute: 15,
      approvalDelay: 10,
      rehabilitationGap: 10
    },
    recommendedActions: [
      'Notify KIADB for immediate allotment to registered enterprise units',
      'Finalize utility connection pathways'
    ],
    createdDate: '2026-02-02',
    estimatedDelayMonths: 0,
    budgetCr: 260
  }
];
