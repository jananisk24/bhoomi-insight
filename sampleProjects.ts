import { Project } from '../types';

export const initialProjects: Project[] = [
  // --- KARNATAKA ---
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
      'Coordinate with Airport Authority for civil works mobilization',
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

  // --- MAHARASHTRA ---
  {
    id: 'PRJ-201',
    name: 'Pune Ring Road Western Alignment - Package 4',
    district: 'Pune',
    state: 'Maharashtra',
    landArea: 420,
    affectedFamilies: 560,
    compensationStatus: 'Under Dispute',
    legalDispute: true,
    approvalStatus: 'Environmental Clearance Pending',
    rehabilitationStatus: 'Not Started',
    riskScore: 86,
    riskCategory: 'High',
    status: 'Severely Delayed',
    coordinates: [18.5204, 73.8567],
    projectType: 'Highway / Expressway',
    delayFactors: {
      compensationPending: 90,
      legalDispute: 90,
      approvalDelay: 80,
      rehabilitationGap: 85
    },
    recommendedActions: [
      'Establish Lok Adalat fast-track arbitration bench in Pune Collectorate',
      'Coordinate with MSRDC for revised compensation multiplier award',
      'Expedite MoEFCC forest clearance for Maval hill cut section'
    ],
    createdDate: '2025-07-15',
    estimatedDelayMonths: 15,
    budgetCr: 890
  },
  {
    id: 'PRJ-202',
    name: 'Samruddhi Multi-Modal Logistics Hub Phase 2',
    district: 'Nagpur',
    state: 'Maharashtra',
    landArea: 310,
    affectedFamilies: 240,
    compensationStatus: 'Disbursed (100%)',
    legalDispute: false,
    approvalStatus: 'Cleared / Approved',
    rehabilitationStatus: 'Completed',
    riskScore: 19,
    riskCategory: 'Low',
    status: 'On Track',
    coordinates: [21.1458, 79.0882],
    projectType: 'Industrial Park',
    delayFactors: {
      compensationPending: 10,
      legalDispute: 10,
      approvalDelay: 15,
      rehabilitationGap: 10
    },
    recommendedActions: [
      'Issue physical possession certificate to Maharashtra MIDC',
      'Commence arterial pipeline laying'
    ],
    createdDate: '2025-09-22',
    estimatedDelayMonths: 0,
    budgetCr: 430
  },
  {
    id: 'PRJ-203',
    name: 'Nashik Metro Neo Line 1 Depot & Stations',
    district: 'Nashik',
    state: 'Maharashtra',
    landArea: 160,
    affectedFamilies: 290,
    compensationStatus: 'Partially Disbursed (50-75%)',
    legalDispute: false,
    approvalStatus: 'In Administrative Review',
    rehabilitationStatus: 'In Progress',
    riskScore: 49,
    riskCategory: 'Medium',
    status: 'In Progress',
    coordinates: [19.9975, 73.7898],
    projectType: 'Metro Transit System',
    delayFactors: {
      compensationPending: 45,
      legalDispute: 15,
      approvalDelay: 45,
      rehabilitationGap: 50
    },
    recommendedActions: [
      'Conclude public hearing for remaining commercial parcel shopkeepers',
      'Execute alternative commercial allotment in NMC market complex'
    ],
    createdDate: '2025-11-14',
    estimatedDelayMonths: 4,
    budgetCr: 360
  },

  // --- TAMIL NADU ---
  {
    id: 'PRJ-301',
    name: 'Chennai Peripheral Ring Road - Section II',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    landArea: 380,
    affectedFamilies: 510,
    compensationStatus: 'Pending (<25%)',
    legalDispute: true,
    approvalStatus: 'In Administrative Review',
    rehabilitationStatus: 'Land Allocated',
    riskScore: 76,
    riskCategory: 'High',
    status: 'Severely Delayed',
    coordinates: [12.8342, 79.7036],
    projectType: 'Highway / Expressway',
    delayFactors: {
      compensationPending: 80,
      legalDispute: 85,
      approvalDelay: 45,
      rehabilitationGap: 60
    },
    recommendedActions: [
      'Verify patta registration titles with district revenue records',
      'Disburse ex-gratia compensation approved by state cabinet'
    ],
    createdDate: '2025-08-30',
    estimatedDelayMonths: 8,
    budgetCr: 620
  },
  {
    id: 'PRJ-302',
    name: 'Aerospace & Defence Industrial Corridor',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    landArea: 450,
    affectedFamilies: 180,
    compensationStatus: 'Disbursed (100%)',
    legalDispute: false,
    approvalStatus: 'Cleared / Approved',
    rehabilitationStatus: 'Completed',
    riskScore: 17,
    riskCategory: 'Low',
    status: 'Cleared',
    coordinates: [11.0168, 76.9558],
    projectType: 'Industrial Park',
    delayFactors: {
      compensationPending: 10,
      legalDispute: 10,
      approvalDelay: 10,
      rehabilitationGap: 10
    },
    recommendedActions: [
      'TIDCO site boundary demarcation complete; proceed to foundation works',
      'Finalize road connectivity link with NH-544'
    ],
    createdDate: '2025-10-05',
    estimatedDelayMonths: 0,
    budgetCr: 550
  },
  {
    id: 'PRJ-303',
    name: 'Madurai Outer Ring Canal Irrigation Link',
    district: 'Madurai',
    state: 'Tamil Nadu',
    landArea: 145,
    affectedFamilies: 210,
    compensationStatus: 'Partially Disbursed (50-75%)',
    legalDispute: false,
    approvalStatus: 'In Administrative Review',
    rehabilitationStatus: 'In Progress',
    riskScore: 46,
    riskCategory: 'Medium',
    status: 'In Progress',
    coordinates: [9.9252, 78.1198],
    projectType: 'Irrigation Canal',
    delayFactors: {
      compensationPending: 40,
      legalDispute: 15,
      approvalDelay: 40,
      rehabilitationGap: 45
    },
    recommendedActions: [
      'Publish second gazette notification for agricultural easement rights',
      'Disburse remaining crop damages valuation'
    ],
    createdDate: '2025-12-10',
    estimatedDelayMonths: 3,
    budgetCr: 180
  },

  // --- GUJARAT ---
  {
    id: 'PRJ-401',
    name: 'Dholera SIR Express Link & Utility Corridor',
    district: 'Ahmedabad',
    state: 'Gujarat',
    landArea: 490,
    affectedFamilies: 320,
    compensationStatus: 'Disbursed (100%)',
    legalDispute: false,
    approvalStatus: 'Cleared / Approved',
    rehabilitationStatus: 'Completed',
    riskScore: 16,
    riskCategory: 'Low',
    status: 'On Track',
    coordinates: [22.2587, 72.1934],
    projectType: 'Highway / Expressway',
    delayFactors: {
      compensationPending: 10,
      legalDispute: 10,
      approvalDelay: 10,
      rehabilitationGap: 10
    },
    recommendedActions: [
      'Complete geotechnical test borings for grade separators',
      'Hand over right-of-way corridor to NHAI contractor'
    ],
    createdDate: '2025-06-18',
    estimatedDelayMonths: 0,
    budgetCr: 680
  },
  {
    id: 'PRJ-402',
    name: 'Petrochemical & Green Energy SEZ Zone C',
    district: 'Bharuch',
    state: 'Gujarat',
    landArea: 370,
    affectedFamilies: 410,
    compensationStatus: 'Pending (<25%)',
    legalDispute: true,
    approvalStatus: 'Incomplete Documentation',
    rehabilitationStatus: 'Not Started',
    riskScore: 82,
    riskCategory: 'High',
    status: 'Severely Delayed',
    coordinates: [21.7051, 72.9959],
    projectType: 'Industrial Park',
    delayFactors: {
      compensationPending: 85,
      legalDispute: 85,
      approvalDelay: 85,
      rehabilitationGap: 80
    },
    recommendedActions: [
      'Resolve joint survey discrepancies in Dahej coastal regulation stretch',
      'Release special rehabilitation package for local fishing hamlets'
    ],
    createdDate: '2025-08-01',
    estimatedDelayMonths: 11,
    budgetCr: 540
  },

  // --- TELANGANA ---
  {
    id: 'PRJ-501',
    name: 'Regional Ring Road (RRR) Northern Spoke',
    district: 'Medak',
    state: 'Telangana',
    landArea: 390,
    affectedFamilies: 480,
    compensationStatus: 'Under Dispute',
    legalDispute: true,
    approvalStatus: 'Environmental Clearance Pending',
    rehabilitationStatus: 'Not Started',
    riskScore: 85,
    riskCategory: 'High',
    status: 'Severely Delayed',
    coordinates: [18.0483, 78.2635],
    projectType: 'Highway / Expressway',
    delayFactors: {
      compensationPending: 90,
      legalDispute: 90,
      approvalDelay: 80,
      rehabilitationGap: 85
    },
    recommendedActions: [
      'Conduct collectorate review for Section 3D land acquisition awards',
      'Disburse enhanced compensation as per high court mediation guidelines',
      'Submit forest division clearance proposal for 4.2 km corridor'
    ],
    createdDate: '2025-09-12',
    estimatedDelayMonths: 13,
    budgetCr: 710
  },
  {
    id: 'PRJ-502',
    name: 'Pharma City Outer Transit & Pipeline Corridor',
    district: 'Rangareddy',
    state: 'Telangana',
    landArea: 260,
    affectedFamilies: 310,
    compensationStatus: 'Partially Disbursed (50-75%)',
    legalDispute: false,
    approvalStatus: 'In Administrative Review',
    rehabilitationStatus: 'In Progress',
    riskScore: 52,
    riskCategory: 'Medium',
    status: 'Moderate Delay',
    coordinates: [17.1500, 78.5200],
    projectType: 'Industrial Park',
    delayFactors: {
      compensationPending: 50,
      legalDispute: 20,
      approvalDelay: 45,
      rehabilitationGap: 50
    },
    recommendedActions: [
      'Finalize remaining 18 PAF rehabilitation house site allotments',
      'Verify water table monitoring compliance report'
    ],
    createdDate: '2025-11-28',
    estimatedDelayMonths: 4,
    budgetCr: 390
  }
];
