import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Zap,
  Info
} from 'lucide-react';
import { 
  Project, 
  CompensationStatus, 
  ApprovalStatus, 
  RehabilitationStatus 
} from '../types';
import { calculateDelayRisk } from '../utils/predictionEngine';
import { RiskBadge } from '../components/RiskBadge';

interface WhatIfSimulatorPageProps {
  initialProject: Project | null;
  allProjects: Project[];
}

export const WhatIfSimulatorPage: React.FC<WhatIfSimulatorPageProps> = ({
  initialProject,
  allProjects
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProject ? initialProject.id : allProjects[0]?.id || ''
  );

  const baseProject = useMemo(() => {
    return allProjects.find((p) => p.id === selectedProjectId) || allProjects[0];
  }, [allProjects, selectedProjectId]);

  // Simulation Controls
  const [simCompensation, setSimCompensation] = useState<CompensationStatus>(
    baseProject?.compensationStatus || 'Disbursed (100%)'
  );
  const [simLegalDispute, setSimLegalDispute] = useState<boolean>(
    baseProject ? baseProject.legalDispute : false
  );
  const [simApproval, setSimApproval] = useState<ApprovalStatus>(
    baseProject?.approvalStatus || 'Cleared / Approved'
  );
  const [simRehabilitation, setSimRehabilitation] = useState<RehabilitationStatus>(
    baseProject?.rehabilitationStatus || 'Completed'
  );

  // Sync controls when base project changes
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const proj = allProjects.find((p) => p.id === projectId);
    if (proj) {
      setSimCompensation(proj.compensationStatus);
      setSimLegalDispute(proj.legalDispute);
      setSimApproval(proj.approvalStatus);
      setSimRehabilitation(proj.rehabilitationStatus);
    }
  };

  // Calculate live simulation results
  const simulatedResult = useMemo(() => {
    if (!baseProject) return null;
    return calculateDelayRisk({
      landArea: baseProject.landArea,
      affectedFamilies: baseProject.affectedFamilies,
      compensationStatus: simCompensation,
      legalDispute: simLegalDispute,
      approvalStatus: simApproval,
      rehabilitationStatus: simRehabilitation
    });
  }, [baseProject, simCompensation, simLegalDispute, simApproval, simRehabilitation]);

  const scoreDiff = simulatedResult && baseProject 
    ? simulatedResult.riskScore - baseProject.riskScore 
    : 0;

  // Preset Scenario Handlers
  const applyPreset = (type: 'best' | 'settle-court' | 'clear-funds') => {
    if (!baseProject) return;
    if (type === 'best') {
      setSimCompensation('Disbursed (100%)');
      setSimLegalDispute(false);
      setSimApproval('Cleared / Approved');
      setSimRehabilitation('Completed');
    } else if (type === 'settle-court') {
      setSimLegalDispute(false);
    } else if (type === 'clear-funds') {
      setSimCompensation('Disbursed (100%)');
    }
  };

  const resetToOriginal = () => {
    if (!baseProject) return;
    setSimCompensation(baseProject.compensationStatus);
    setSimLegalDispute(baseProject.legalDispute);
    setSimApproval(baseProject.approvalStatus);
    setSimRehabilitation(baseProject.rehabilitationStatus);
  };

  if (!baseProject || !simulatedResult) {
    return <div className="p-8 text-center text-slate-500">No project available for simulation.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">What-If Delay Risk Simulator</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test policy interventions, funding tranches, and legal resolutions to quantify delay reduction in real-time
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Select Project:</label>
          <select
            id="what-if-project-picker"
            value={selectedProjectId}
            onChange={(e) => handleSelectProject(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 max-w-xs"
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}: {p.name.substring(0, 30)}... ({p.riskScore}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Before vs After Impact Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baseline Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Baseline Risk</div>
            <div className="my-3 flex items-center justify-center">
              <span className={`text-3xl font-black font-mono ${
                baseProject.riskScore >= 70 ? 'text-rose-600' :
                baseProject.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {baseProject.riskScore}%
              </span>
            </div>
            <RiskBadge category={baseProject.riskCategory} size="sm" />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Est. Delay: ~{baseProject.estimatedDelayMonths} months
          </div>
        </div>

        {/* Dynamic Delta Arrow Card */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-5 rounded-xl shadow-xs text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-blue-200">
            Predicted Risk Shift
          </div>
          <div className="my-3 flex items-center gap-1 text-2xl font-black font-mono">
            {scoreDiff < 0 ? (
              <span className="text-emerald-300 flex items-center gap-1">
                <TrendingDown className="w-6 h-6" />
                {scoreDiff}%
              </span>
            ) : scoreDiff > 0 ? (
              <span className="text-rose-300">+{scoreDiff}%</span>
            ) : (
              <span className="text-slate-200">0%</span>
            )}
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white">
            {scoreDiff < 0 ? 'Risk Reduced (Mitigation Effective)' : scoreDiff > 0 ? 'Risk Escalated' : 'Unchanged'}
          </div>
        </div>

        {/* Simulated Outcome Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Simulated Outcome Risk</div>
            <div className="my-3 flex items-center justify-center">
              <span className={`text-3xl font-black font-mono ${
                simulatedResult.riskScore >= 70 ? 'text-rose-600' :
                simulatedResult.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {simulatedResult.riskScore}%
              </span>
            </div>
            <RiskBadge category={simulatedResult.riskCategory} size="sm" />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Est. Delay: ~{simulatedResult.estimatedDelayMonths} months
          </div>
        </div>
      </div>

      {/* Simulator Control Sliders & Radios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Interactive Parameter Controls</h2>
            <p className="text-xs text-slate-500">Toggle values below to witness how risk score updates automatically</p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Scenarios:</span>
            <button
              id="btn-preset-settle-court"
              type="button"
              onClick={() => applyPreset('settle-court')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              Resolve Court Stay
            </button>
            <button
              id="btn-preset-clear-funds"
              type="button"
              onClick={() => applyPreset('clear-funds')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              Release 100% Funds
            </button>
            <button
              id="btn-preset-best"
              type="button"
              onClick={() => applyPreset('best')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Best Case</span>
            </button>
            <button
              type="button"
              onClick={resetToOriginal}
              className="p-1 text-slate-400 hover:text-slate-700"
              title="Reset to Original Values"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Control 1: Compensation Status */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700" htmlFor="sim-comp-select">
                1. Compensation Disbursement Status
              </label>
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                Weight: 30%
              </span>
            </div>
            <select
              id="sim-comp-select"
              value={simCompensation}
              onChange={(e) => setSimCompensation(e.target.value as CompensationStatus)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="Disbursed (100%)">Disbursed (100%) - (Minimal Risk Contribution)</option>
              <option value="Partially Disbursed (50-75%)">Partially Disbursed (50-75%)</option>
              <option value="Pending (<25%)">Pending (&lt;25%) - Escrow Unreleased</option>
              <option value="Under Dispute">Under Dispute - (Max Delay Impact)</option>
            </select>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Full DBT disbursement slashes compensation factor to 10%.</span>
            </div>
          </div>

          {/* Control 2: Legal Dispute (Yes/No) */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">
                2. Legal Litigation / High Court Stay
              </label>
              <span className="text-[10px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                Weight: 30%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                id="btn-sim-legal-no"
                onClick={() => setSimLegalDispute(false)}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  !simLegalDispute
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                No Dispute (Clear)
              </button>
              <button
                type="button"
                id="btn-sim-legal-yes"
                onClick={() => setSimLegalDispute(true)}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  simLegalDispute
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Yes (Active Stay)
              </button>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Vacating stay drops legal risk score from 90% down to 15%.</span>
            </div>
          </div>

          {/* Control 3: Statutory & Environmental Approval */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700" htmlFor="sim-appr-select">
                3. Statutory Clearance Status
              </label>
              <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                Weight: 25%
              </span>
            </div>
            <select
              id="sim-appr-select"
              value={simApproval}
              onChange={(e) => setSimApproval(e.target.value as ApprovalStatus)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="Cleared / Approved">Cleared / Approved</option>
              <option value="In Administrative Review">In Administrative Review</option>
              <option value="Environmental Clearance Pending">Environmental Clearance Pending</option>
              <option value="Incomplete Documentation">Incomplete Documentation</option>
            </select>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Receiving State Environment NOC reduces delay by up to 5 months.</span>
            </div>
          </div>

          {/* Control 4: Rehabilitation Status */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700" htmlFor="sim-rehab-select">
                4. R&amp;R Resettlement Progress
              </label>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                Weight: 15%
              </span>
            </div>
            <select
              id="sim-rehab-select"
              value={simRehabilitation}
              onChange={(e) => setSimRehabilitation(e.target.value as RehabilitationStatus)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="Completed">Completed - Fully Settled</option>
              <option value="In Progress">In Progress - Civil Works</option>
              <option value="Land Allocated">Land Allocated Only</option>
              <option value="Not Started">Not Started</option>
            </select>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Completing PAF rehabilitation colony clears physical possession hurdles.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
