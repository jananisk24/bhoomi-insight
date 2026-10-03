import React, { useState } from 'react';
import { 
  Sparkles, 
  LandPlot, 
  MapPin, 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw
} from 'lucide-react';
import { 
  Project, 
  ActivePage, 
  CompensationStatus, 
  ApprovalStatus, 
  RehabilitationStatus 
} from '../types';
import { calculateDelayRisk } from '../utils/predictionEngine';

interface AddProjectPageProps {
  onAddProject: (project: Project) => void;
  onNavigate: (page: ActivePage) => void;
}

export const AddProjectPage: React.FC<AddProjectPageProps> = ({
  onAddProject,
  onNavigate
}) => {
  // Form State
  const [projectName, setProjectName] = useState('');
  const [district, setDistrict] = useState('Bengaluru Rural');
  const [projectType, setProjectType] = useState('Highway / Expressway');
  const [landArea, setLandArea] = useState<number>(180);
  const [affectedFamilies, setAffectedFamilies] = useState<number>(240);
  const [compensationStatus, setCompensationStatus] = useState<CompensationStatus>('Pending (<25%)');
  const [legalDispute, setLegalDispute] = useState<boolean>(true);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('Environmental Clearance Pending');
  const [rehabilitationStatus, setRehabilitationStatus] = useState<RehabilitationStatus>('Not Started');
  const [budgetCr, setBudgetCr] = useState<number>(320);

  const [formError, setFormError] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);

  const districts = [
    'Bengaluru Urban',
    'Bengaluru Rural',
    'Tumakuru',
    'Belagavi',
    'Ballari',
    'Vijayapura',
    'Mysuru',
    'Shivamogga',
    'Dakshina Kannada',
    'Kalaburagi',
    'Dharwad',
    'Mandya',
    'Hassan',
    'Udupi'
  ];

  const handlePredictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setFormError('Please enter the project name.');
      return;
    }
    if (landArea <= 0) {
      setFormError('Please enter a valid land area (acres).');
      return;
    }

    setFormError('');
    setIsPredicting(true);

    // Call prediction algorithm
    const prediction = calculateDelayRisk({
      landArea: Number(landArea),
      affectedFamilies: Number(affectedFamilies),
      compensationStatus,
      legalDispute,
      approvalStatus,
      rehabilitationStatus
    });

    const newProject: Project = {
      id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      name: projectName.trim(),
      district,
      state: 'Karnataka',
      landArea: Number(landArea),
      affectedFamilies: Number(affectedFamilies),
      compensationStatus,
      legalDispute,
      approvalStatus,
      rehabilitationStatus,
      riskScore: prediction.riskScore,
      riskCategory: prediction.riskCategory,
      status: prediction.riskCategory === 'High' 
        ? 'Severely Delayed' 
        : prediction.riskCategory === 'Medium' 
        ? 'Moderate Delay' 
        : 'On Track',
      coordinates: [13.0 + Math.random() * 2.5, 75.0 + Math.random() * 2.5],
      projectType,
      delayFactors: prediction.delayFactors,
      recommendedActions: prediction.recommendedActions,
      createdDate: new Date().toISOString().split('T')[0],
      estimatedDelayMonths: prediction.estimatedDelayMonths,
      budgetCr: Number(budgetCr)
    };

    setTimeout(() => {
      setIsPredicting(false);
      onAddProject(newProject);
      // Automatically navigate to prediction results page
      onNavigate('prediction-result');
    }, 450);
  };

  const handleLoadSample = (type: 'high' | 'low') => {
    if (type === 'high') {
      setProjectName('Western Ring Peripheral Expressway Phase 1');
      setDistrict('Tumakuru');
      setProjectType('Highway / Expressway');
      setLandArea(410);
      setAffectedFamilies(550);
      setCompensationStatus('Under Dispute');
      setLegalDispute(true);
      setApprovalStatus('Environmental Clearance Pending');
      setRehabilitationStatus('Not Started');
      setBudgetCr(650);
    } else {
      setProjectName('Clean Energy Green Hydrogen Park');
      setDistrict('Ballari');
      setProjectType('Solar Power Plant');
      setLandArea(120);
      setAffectedFamilies(40);
      setCompensationStatus('Disbursed (100%)');
      setLegalDispute(false);
      setApprovalStatus('Cleared / Approved');
      setRehabilitationStatus('Completed');
      setBudgetCr(180);
    }
    setFormError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Presets Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LandPlot className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">Add Project & Predict Delay Risk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Provide acquisition parcel attributes for automatic calculation of delay probability & bottleneck analysis
          </p>
        </div>

        {/* Quick Demo Pre-fills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('high')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
          >
            High Risk Sample
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('low')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            Low Risk Sample
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handlePredictSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Section 1: Basic Information */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>1. General Project Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="project-name-input">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="project-name-input"
                type="text"
                required
                placeholder="e.g. National Corridor Ring Highway Expansion"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="district-select">
                District / Jurisdiction <span className="text-rose-500">*</span>
              </label>
              <select
                id="district-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="project-type-select">
                Infrastructure Category
              </label>
              <select
                id="project-type-select"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="Highway / Expressway">Highway / Expressway</option>
                <option value="Railway Corridor">Railway Freight Corridor</option>
                <option value="Industrial Park">Industrial Estate / SEZ</option>
                <option value="Airport Expansion">Airport Expansion</option>
                <option value="Solar Power Plant">Solar Power Park</option>
                <option value="Irrigation Canal">Irrigation Canal Network</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Land & Demographics */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>2. Land Scope & Affected Population</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="land-area-input">
                Total Land Area (Acres) <span className="text-rose-500">*</span>
              </label>
              <input
                id="land-area-input"
                type="number"
                min="1"
                required
                value={landArea}
                onChange={(e) => setLandArea(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="families-input">
                Affected Families (PAFs) <span className="text-rose-500">*</span>
              </label>
              <input
                id="families-input"
                type="number"
                min="0"
                required
                value={affectedFamilies}
                onChange={(e) => setAffectedFamilies(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="budget-input">
                Project Budget (₹ Crores)
              </label>
              <input
                id="budget-input"
                type="number"
                min="1"
                value={budgetCr}
                onChange={(e) => setBudgetCr(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Statutory & Delay Factor Inputs */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>3. Critical Delay Risk Indicators</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Compensation Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="compensation-status-select">
                Compensation Disbursement Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="compensation-status-select"
                value={compensationStatus}
                onChange={(e) => setCompensationStatus(e.target.value as CompensationStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="Disbursed (100%)">Disbursed (100%) - Completed</option>
                <option value="Partially Disbursed (50-75%)">Partially Disbursed (50-75%)</option>
                <option value="Pending (<25%)">Pending (&lt;25%) - Escrow Unreleased</option>
                <option value="Under Dispute">Under Dispute / Compensation Injunction</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Weight: 30% towards overall delay probability</p>
            </div>

            {/* Legal Dispute (Yes/No) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Legal Dispute / Court Litigation <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4 mt-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50 w-1/2">
                  <input
                    type="radio"
                    name="legalDispute"
                    checked={legalDispute === true}
                    onChange={() => setLegalDispute(true)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-rose-700">Yes (Active Litigation / Stay)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50 w-1/2">
                  <input
                    type="radio"
                    name="legalDispute"
                    checked={legalDispute === false}
                    onChange={() => setLegalDispute(false)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-emerald-700">No (Litigation Free)</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Weight: 30% towards overall delay probability</p>
            </div>

            {/* Approval Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="approval-status-select">
                Statutory & Environmental Approval Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="approval-status-select"
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="Cleared / Approved">Cleared / Approved (All NOCs In Order)</option>
                <option value="In Administrative Review">In Administrative Review (Collectorate)</option>
                <option value="Environmental Clearance Pending">Environmental Clearance Pending (MoEFCC)</option>
                <option value="Incomplete Documentation">Incomplete Documentation (Cadastral Mismatch)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Weight: 25% towards overall delay probability</p>
            </div>

            {/* Rehabilitation Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="rehab-status-select">
                Rehabilitation & Resettlement (R&amp;R) Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="rehab-status-select"
                value={rehabilitationStatus}
                onChange={(e) => setRehabilitationStatus(e.target.value as RehabilitationStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="Completed">Completed - Fully Relocated &amp; Compensated</option>
                <option value="In Progress">In Progress - Colony Infrastructure Ongoing</option>
                <option value="Land Allocated">Land Allocated - Construction Pending</option>
                <option value="Not Started">Not Started - Eviction Notice Not Issued</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Weight: 15% towards overall delay probability</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Predictive weighting algorithm configured for instant processing</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setProjectName('');
                setLandArea(100);
                setAffectedFamilies(100);
              }}
              className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              id="btn-predict-delay-risk"
              type="submit"
              disabled={isPredicting}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
            >
              {isPredicting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Weighted Delay Risk...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Delay Risk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
