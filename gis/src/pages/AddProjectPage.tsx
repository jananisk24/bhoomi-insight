import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { 
  Sparkles, 
  LandPlot, 
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
  PossessionStatus,
  RehabilitationStatus 
} from '../types';
import { calculateDelayRisk } from '../utils/predictionEngine';
import {
  acresToHectares,
  croresToRupees,
  formatAcres,
  probabilityToPercent,
} from '../utils/units';

interface AddProjectPageProps {
  initialProject?: Project | null;
  onAddProject: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
  onNavigate: (page: ActivePage) => void;
}

export const AddProjectPage: React.FC<AddProjectPageProps> = ({
  initialProject = null,
  onAddProject,
  onUpdateProject,
  onNavigate
}) => {
  // Form State
  const [projectName, setProjectName] = useState(initialProject?.name ?? '');
  const [state, setState] = useState(initialProject?.state ?? 'Tamil Nadu');
  const [district, setDistrict] = useState(initialProject?.district ?? '');
  const [projectType, setProjectType] = useState(
    initialProject?.projectType === 'Railway'
      ? 'Railway Corridor'
      : initialProject?.projectType === 'Irrigation'
        ? 'Irrigation Canal'
        : initialProject?.projectType === 'Power'
          ? 'Power / Solar Park'
          : 'Highway / Expressway'
  );
  const [landArea, setLandArea] = useState<number>(initialProject?.landArea ?? 0);
  const [landAreaInput, setLandAreaInput] = useState<string>(
    initialProject?.landArea != null ? formatAcres(initialProject.landArea) : '0'
  );
  const [affectedFamilies, setAffectedFamilies] = useState<number>(initialProject?.affectedFamilies ?? 0);
  const [compensationStatus, setCompensationStatus] = useState<CompensationStatus>(
    initialProject?.compensationStatus ?? 'Pending (<25%)'
  );
  const [legalDispute, setLegalDispute] = useState<boolean>(initialProject?.legalDispute ?? false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(
    initialProject?.approvalStatus ?? 'In Administrative Review'
  );
  const [approvalDaysPending, setApprovalDaysPending] = useState<number>(
    initialProject?.approvalDaysPending ?? 0
  );
  const [rehabilitationStatus, setRehabilitationStatus] = useState<RehabilitationStatus>(
    initialProject?.rehabilitationStatus ?? 'Not Started'
  );
  const [possessionStatus, setPossessionStatus] = useState<PossessionStatus>(
    initialProject?.possessionStatus ?? 'Not Taken'
  );
  const [stakeholderScore, setStakeholderScore] = useState<number>(
    initialProject?.stakeholderScore ?? 5
  );
  const [districtHistoricalDelay, setDistrictHistoricalDelay] = useState<number>(
    initialProject?.districtHistoricalDelay ?? 0
  );
  const [budgetCr, setBudgetCr] = useState<number>(initialProject?.budgetCr ?? 0);
  const [latitude, setLatitude] = useState(
    initialProject?.coordinates?.[0]?.toString() ?? ''
  );
  const [longitude, setLongitude] = useState(
    initialProject?.coordinates?.[1]?.toString() ?? ''
  );

  const [formError, setFormError] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSamplePreview, setIsSamplePreview] = useState(false);
  const [confirmSampleSubmission, setConfirmSampleSubmission] = useState(false);

  const states = [...new Set([
    'Tamil Nadu',
    'Karnataka',
    'Andhra Pradesh',
    'Kerala',
    state,
  ])];

  const handleLoadSample = (type: 'high' | 'low') => {
    const sample =
      type === 'high'
        ? {
            projectName: 'Sample High-Risk Highway Project',
            state: 'Maharashtra',
            district: 'Pune',
            projectType: 'Highway / Expressway',
            landArea: 410,
            affectedFamilies: 550,
            compensationStatus: 'Under Dispute' as const,
            legalDispute: true,
            approvalStatus: 'Environmental Clearance Pending' as const,
            rehabilitationStatus: 'Not Started' as const,
            budgetCr: 650,
            approvalDaysPending: 120,
            stakeholderScore: 2,
            districtHistoricalDelay: 65,
          }
        : {
            projectName: 'Sample Low-Risk Renewable Energy Project',
            state: 'Karnataka',
            district: 'Ballari',
            projectType: 'Power / Solar Park',
            landArea: 120,
            affectedFamilies: 40,
            compensationStatus: 'Disbursed (100%)' as const,
            legalDispute: false,
            approvalStatus: 'Cleared / Approved' as const,
            rehabilitationStatus: 'Completed' as const,
            budgetCr: 240,
            approvalDaysPending: 0,
            stakeholderScore: 5,
            districtHistoricalDelay: 15,
          };

    setProjectName(sample.projectName);
    setState(sample.state);
    setDistrict(sample.district);
    setProjectType(sample.projectType);
    setLandArea(sample.landArea);
    setLandAreaInput(String(sample.landArea));
    setAffectedFamilies(sample.affectedFamilies);
    setCompensationStatus(sample.compensationStatus);
    setLegalDispute(sample.legalDispute);
    setApprovalStatus(sample.approvalStatus);
    setRehabilitationStatus(sample.rehabilitationStatus);
    setBudgetCr(sample.budgetCr);
    setApprovalDaysPending(sample.approvalDaysPending);
    setStakeholderScore(sample.stakeholderScore);
    setDistrictHistoricalDelay(sample.districtHistoricalDelay);
    setLatitude('');
    setLongitude('');
    setFormError('');
    setIsSamplePreview(true);
    setConfirmSampleSubmission(false);
  };

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSamplePreview && !confirmSampleSubmission) {
      setFormError('Example values are for preview. Confirm before saving them as a real project.');
      return;
    }

    if (!projectName.trim()) {
      setFormError('Please enter the project name.');
      return;
    }

    if (
      !state ||
      !district ||
      !Number.isFinite(landArea) || landArea <= 0 ||
      !Number.isInteger(affectedFamilies) || affectedFamilies < 0 ||
      !Number.isFinite(budgetCr) || budgetCr <= 0 ||
      !Number.isInteger(approvalDaysPending) || approvalDaysPending < 0 || approvalDaysPending > 365 ||
      !Number.isInteger(stakeholderScore) || stakeholderScore < 1 || stakeholderScore > 5 ||
      !Number.isFinite(districtHistoricalDelay) || districtHistoricalDelay < 0 || districtHistoricalDelay > 100 ||
      (latitude.trim() !== '' && !Number.isFinite(Number(latitude))) ||
      (longitude.trim() !== '' && !Number.isFinite(Number(longitude))) ||
      (latitude.trim() === '') !== (longitude.trim() === '') ||
      (latitude.trim() !== '' && (Number(latitude) < -90 || Number(latitude) > 90)) ||
      (longitude.trim() !== '' && (Number(longitude) < -180 || Number(longitude) > 180))
    ) {
      setFormError(
        'Enter valid project details. Approval days must be 0–365, stakeholder score 1–5, historical delay index 0–100, and provide both valid coordinates or neither.'
      );
      return;
    }

    const token = sessionStorage.getItem('access_token');

    if (!token) {
      setFormError('Your session has expired. Please log in again.');
      return;
    }

    setFormError('');
    setIsPredicting(true);

    try {
      // Convert the form values to the backend's expected format.
      const projectPayload = {
        project_name: projectName.trim(),
        state,
        district,
        land_required: acresToHectares(Number(landArea)),
        affected_families: Number(affectedFamilies),
        estimated_cost: croresToRupees(Number(budgetCr)),
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,

        // These four values match the Project_Type categories used to train
        // the deployed model. Do not send UI labels or unsupported categories.
        project_type:
          projectType === 'Highway / Expressway'
            ? 'Highway'
            : projectType === 'Railway Corridor'
              ? 'Railway'
              : projectType === 'Power / Solar Park'
                ? 'Power'
                : 'Irrigation',

        // Keep the recorded status; the backend maps it to the model categories.
        compensation_status: compensationStatus,

        // Use the user's actual pending-day input instead of fixed 0/30/90/120
        // guesses based only on the approval-status label.
        approval_days_pending: Number(approvalDaysPending),
        approval_status: approvalStatus,

        legal_dispute: legalDispute ? 'Yes' : 'No',

        possession_status: possessionStatus,

        rehabilitation_progress:
          rehabilitationStatus === 'Completed'
            ? 100
            : rehabilitationStatus === 'In Progress'
              ? 50
              : rehabilitationStatus === 'Land Allocated'
                ? 25
                : 0,

        stakeholder_score: Number(stakeholderScore),
        district_historical_delay: Number(districtHistoricalDelay),
      };

      // Save the project and its first prediction as one backend transaction.
      const projectUrl = initialProject
        ? `${API_BASE_URL}/projects/${encodeURIComponent(initialProject.id)}/predict`
        : `${API_BASE_URL}/projects/predict`;
      const createResponse = await fetch(projectUrl, {
        method: initialProject ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectPayload),
      });

      if (!createResponse.ok) {
        const message = await createResponse.text();
        throw new Error(
          `Could not ${initialProject ? 'update' : 'save'} project: ${message}`
        );
      }

      const result = await createResponse.json();
      const savedProject = result.project;
      const mlPrediction = result.prediction;

    // Keep the existing local calculator for its supporting
    // explanation fields, but use the backend ML model's risk result.
      const supportingDetails = calculateDelayRisk({
        landArea: Number(landArea),
        affectedFamilies: Number(affectedFamilies),
        compensationStatus,
        legalDispute,
        approvalStatus,
        rehabilitationStatus,
      });

      const newProject: Project = {
        id: String(savedProject.id),
        name: savedProject.project_name,
        district: savedProject.district,
        state: savedProject.state,
        landArea: Number(landArea),
        affectedFamilies: Number(affectedFamilies),
        compensationStatus,
        legalDispute,
        approvalStatus,
        rehabilitationStatus,

        riskScore: probabilityToPercent(mlPrediction.delay_probability),
        riskCategory: mlPrediction.risk_level,

        status:
          mlPrediction.risk_level === 'High'
            ? 'Severely Delayed'
            : mlPrediction.risk_level === 'Medium'
              ? 'Moderate Delay'
              : 'On Track',

        // Never place every new project in Bengaluru. [0, 0] means the
        // district is not in this lookup and the GIS page must skip that marker.
        coordinates:
          savedProject.latitude == null || savedProject.longitude == null
            ? null
            : [Number(savedProject.latitude), Number(savedProject.longitude)],
        projectType,
        approvalDaysPending: Number(approvalDaysPending),
        possessionStatus,
        rehabilitationProgress:
          rehabilitationStatus === 'Completed'
            ? 100
            : rehabilitationStatus === 'In Progress'
              ? 50
              : rehabilitationStatus === 'Land Allocated'
                ? 25
                : 0,
        stakeholderScore: Number(stakeholderScore),
        districtHistoricalDelay: Number(districtHistoricalDelay),
        stageRisk: mlPrediction.stage_risk,
        highestRiskStage: mlPrediction.highest_risk_stage,
        delayFactors: supportingDetails.delayFactors,
        recommendedActions: supportingDetails.recommendedActions,
        createdDate: String(savedProject.created_at ?? '').slice(0, 10),

      // The backend model does not currently provide an estimated
      // number of delay months.
        estimatedDelayMonths: null,

        budgetCr: Number(budgetCr),
      };

      if (initialProject) {
        onUpdateProject?.(newProject);
      } else {
        onAddProject(newProject);
      }
      onNavigate('prediction-result');
    } catch (error) {
      console.error('Project submission failed:', error);

      setFormError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the project.'
      );
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LandPlot className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">
              {initialProject ? 'Edit Project & Refresh Prediction' : 'Add Project & Predict Delay Risk'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Save project details and calculate delay probability using the trained model
          </p>
          {!initialProject && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">
                Example values only; review before saving:
              </span>
              <button
                type="button"
                onClick={() => handleLoadSample('high')}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
              >
                Fill high-risk example
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('low')}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Fill low-risk example
              </button>
              {isSamplePreview && (
                <label className="flex items-center gap-2 text-xs text-rose-700">
                  <input
                    type="checkbox"
                    checked={confirmSampleSubmission}
                    onChange={(event) => setConfirmSampleSubmission(event.target.checked)}
                  />
                  I confirm these example values should be saved as a real project.
                </label>
              )}
            </div>
          )}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="state-select">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                id="state-select"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {states.map((stateName) => (
                  <option key={stateName} value={stateName}>{stateName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="district-select">
                District / Jurisdiction <span className="text-rose-500">*</span>
              </label>
              <input
                id="district-select"
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Enter project district"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
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
                <option value="Power / Solar Park">Power / Solar Park</option>
                <option value="Irrigation Canal">Irrigation Canal Network</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="latitude-input">
                Project Latitude (optional)
              </label>
              <input
                id="latitude-input"
                type="number"
                min="-90"
                max="90"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Enter project latitude"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="longitude-input">
                Project Longitude (optional)
              </label>
              <input
                id="longitude-input"
                type="number"
                min="-180"
                max="180"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Enter project longitude"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <p className="sm:col-span-2 text-[11px] text-slate-400">
              Map markers are shown for projects with coordinates.
            </p>
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
                step="any"
                required
                value={landAreaInput}
                onChange={(e) => {
                  const nextInput = e.target.value;
                  setLandAreaInput(nextInput);
                  setLandArea(nextInput === '' ? Number.NaN : Number(nextInput));
                }}
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
                Project Budget (₹ Crores) <span className="text-rose-500">*</span>
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="approval-days-input">
                Approval Days Pending (0–365) <span className="text-rose-500">*</span>
              </label>
              <input
                id="approval-days-input"
                type="number"
                min="0"
                max="365"
                step="1"
                required
                value={approvalDaysPending}
                onChange={(e) => setApprovalDaysPending(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter the actual number of days the pending approval has been delayed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="stakeholder-score-input">
                Stakeholder Coordination Score (1–5) <span className="text-rose-500">*</span>
              </label>
              <input
                id="stakeholder-score-input"
                type="number"
                min="1"
                max="5"
                step="1"
                required
                value={stakeholderScore}
                onChange={(e) => setStakeholderScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Use the project's documented stakeholder assessment.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="historical-delay-input">
                District Historical Delay Index (0–100)
              </label>
              <input
                id="historical-delay-input"
                type="number"
                min="0"
                max="100"
                step="1"
                value={districtHistoricalDelay}
                onChange={(e) => setDistrictHistoricalDelay(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter a value only when supported by historical district records; otherwise leave 0.</p>
            </div>

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
              <p className="text-[11px] text-slate-400 mt-1">The trained model determines this input's contribution to delay probability.</p>
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
              <p className="text-[11px] text-slate-400 mt-1">The trained model determines this input's contribution to delay probability.</p>
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
              <p className="text-[11px] text-slate-400 mt-1">Approval status and pending days are sent to the trained model.</p>
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
              <p className="text-[11px] text-slate-400 mt-1">The trained model uses the recorded rehabilitation progress.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="possession-status-select">
                Land Possession Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="possession-status-select"
                value={possessionStatus}
                onChange={(e) => setPossessionStatus(e.target.value as PossessionStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Not Taken">Not Taken</option>
                <option value="Partial">Partial</option>
                <option value="Full">Full</option>
              </select>
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
                setState('Tamil Nadu');
                setDistrict('Chennai');
                setProjectType('Highway / Expressway');
                setLandArea(100);
                setLandAreaInput('100');
                setAffectedFamilies(100);
                setCompensationStatus('Pending (<25%)');
                setLegalDispute(false);
                setApprovalStatus('Environmental Clearance Pending');
                setApprovalDaysPending(90);
                setRehabilitationStatus('Not Started');
                setPossessionStatus('Not Taken');
                setStakeholderScore(3);
                setDistrictHistoricalDelay(0);
                setBudgetCr(320);
                setLatitude('');
                setLongitude('');
                setFormError('');
                setIsSamplePreview(false);
                setConfirmSampleSubmission(false);
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
                  <span>Saving project and running ML prediction...</span>
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
