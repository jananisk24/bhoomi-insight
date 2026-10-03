import React from 'react';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Lightbulb, 
  SlidersHorizontal, 
  ArrowLeft, 
  LandPlot, 
  Calendar,
  Layers,
  Printer,
  FileText,
  Download
} from 'lucide-react';
import { Project, ActivePage } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { printProjectAudit, exportSingleProjectReportText } from '../utils/exportReport';

interface PredictionResultsPageProps {
  project: Project | null;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
  onNavigate: (page: ActivePage) => void;
  onSimulate: (p: Project) => void;
}

export const PredictionResultsPage: React.FC<PredictionResultsPageProps> = ({
  project,
  allProjects,
  onSelectProject,
  onNavigate,
  onSimulate
}) => {
  const currentProject = project || allProjects[0];

  if (!currentProject) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select a project from the directory or create a new prediction.</p>
        <button
          onClick={() => onNavigate('add-project')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
        >
          Create New Prediction
        </button>
      </div>
    );
  }

  const { delayFactors } = currentProject;

  const getBarColor = (val: number) => {
    if (val >= 75) return 'bg-rose-500';
    if (val >= 45) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getTextColor = (val: number) => {
    if (val >= 75) return 'text-rose-600';
    if (val >= 45) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Project Selector & Navigation Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-projects"
            onClick={() => onNavigate('projects')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Selected Acquisition Project
            </div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>{currentProject.name}</span>
              <span className="text-xs font-mono font-normal text-slate-500">({currentProject.id})</span>
            </h1>
          </div>
        </div>

        {/* Project Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Analyze Another:</span>
          <select
            id="select-active-project-prediction"
            value={currentProject.id}
            onChange={(e) => {
              const found = allProjects.find((p) => p.id === e.target.value);
              if (found) onSelectProject(found);
            }}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[220px]"
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.name.substring(0, 24)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Prediction Score Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Risk Gauge Block */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Overall Delay Risk Score
            </span>
            <div className="relative flex items-center justify-center my-2">
              <div
                className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center ${
                  currentProject.riskScore >= 70
                    ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                    : currentProject.riskScore >= 40
                    ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                    : 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                }`}
              >
                <span className="text-3xl font-black font-mono tracking-tight leading-none">
                  {currentProject.riskScore}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide mt-1">
                  Delay Risk
                </span>
              </div>
            </div>

            <div className="mt-3">
              <RiskBadge category={currentProject.riskCategory} size="lg" />
            </div>
          </div>

          {/* Status & Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Predicted Acquisition Status
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {currentProject.riskCategory === 'High' && 'High Risk of Prolonged Acquisition Bottleneck'}
                {currentProject.riskCategory === 'Medium' && 'Moderate Acquisition Delay Risk Detected'}
                {currentProject.riskCategory === 'Low' && 'On-Schedule Acquisition with Minimal Obstruction'}
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {currentProject.status === 'Severely Delayed'
                  ? 'Based on active judicial disputes and incomplete compensation disbursements, this parcel is forecasted to experience a critical delay exceeding statutory milestones.'
                  : currentProject.status === 'Moderate Delay'
                  ? 'Procedural clearances and partial compensation disbursement require close departmental coordination to prevent timeline slippage.'
                  : 'All key statutory parameters and beneficiary disbursements are aligned with the RFCTLARR statutory timeline.'}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Estimated Delay</div>
                <div className="text-base font-bold text-rose-600 font-mono mt-0.5">
                  {currentProject.estimatedDelayMonths > 0 ? `+${currentProject.estimatedDelayMonths} Months` : '0 Days'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Land & Families</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                  {currentProject.landArea} ac • {currentProject.affectedFamilies} PAFs
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Est. Budget Impact</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                  ₹{currentProject.budgetCr} Crores
                </div>
              </div>
            </div>

            {/* Action Buttons: Simulator + Export Report */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                id="btn-open-whatif-for-project"
                onClick={() => {
                  onSimulate(currentProject);
                  onNavigate('what-if');
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Simulate Mitigations in What-If</span>
              </button>

              <button
                id="btn-print-audit-report"
                onClick={() => printProjectAudit(currentProject)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                title="Print or Save official PDF Assessment"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>Print / PDF Report</span>
              </button>

              <button
                id="btn-download-txt-report"
                onClick={() => exportSingleProjectReportText(currentProject)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                title="Download text audit summary"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>

              <button
                onClick={() => onNavigate('projects')}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
              >
                Directory
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delay Factors Breakdown with Progress Bars */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Delay Factors Breakdown</h2>
            <p className="text-xs text-slate-500">Individual contribution of critical statutory bottlenecks</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-400">Model Weights Applied</span>
        </div>

        <div className="space-y-4">
          {/* Factor 1: Compensation Pending */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Compensation Disbursement Pending
                <span className="text-[10px] text-slate-400 font-normal">(Weight: 30%)</span>
              </span>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-xs text-slate-500">{currentProject.compensationStatus}</span>
                <span className={`text-xs ${getTextColor(delayFactors.compensationPending)}`}>
                  {delayFactors.compensationPending}%
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(delayFactors.compensationPending)}`}
                style={{ width: `${delayFactors.compensationPending}%` }}
              />
            </div>
          </div>

          {/* Factor 2: Legal Dispute */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Legal Dispute &amp; Court Litigation
                <span className="text-[10px] text-slate-400 font-normal">(Weight: 30%)</span>
              </span>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-xs text-slate-500">
                  {currentProject.legalDispute ? 'Active Court Injunction' : 'Litigation Free'}
                </span>
                <span className={`text-xs ${getTextColor(delayFactors.legalDispute)}`}>
                  {delayFactors.legalDispute}%
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(delayFactors.legalDispute)}`}
                style={{ width: `${delayFactors.legalDispute}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Approval Delay */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Statutory &amp; Environmental Approval Delay
                <span className="text-[10px] text-slate-400 font-normal">(Weight: 25%)</span>
              </span>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-xs text-slate-500">{currentProject.approvalStatus}</span>
                <span className={`text-xs ${getTextColor(delayFactors.approvalDelay)}`}>
                  {delayFactors.approvalDelay}%
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(delayFactors.approvalDelay)}`}
                style={{ width: `${delayFactors.approvalDelay}%` }}
              />
            </div>
          </div>

          {/* Factor 4: Rehabilitation Gap */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Rehabilitation &amp; Resettlement (R&amp;R) Pendency
                <span className="text-[10px] text-slate-400 font-normal">(Weight: 15%)</span>
              </span>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-xs text-slate-500">{currentProject.rehabilitationStatus}</span>
                <span className={`text-xs ${getTextColor(delayFactors.rehabilitationGap)}`}>
                  {delayFactors.rehabilitationGap}%
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(delayFactors.rehabilitationGap)}`}
                style={{ width: `${delayFactors.rehabilitationGap}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-bold text-slate-800">Prescriptive Administrative Actions</h2>
            <p className="text-xs text-slate-500">Actionable steps recommended by the predictive rule engine to avoid project stagnation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentProject.recommendedActions.map((action, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-slate-800 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                {idx + 1}
              </div>
              <div className="font-medium leading-relaxed">{action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
