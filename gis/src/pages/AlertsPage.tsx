import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Coins, 
  FileCheck2, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  LandPlot,
  Filter
} from 'lucide-react';
import { Project, ActivePage } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface AlertsPageProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNavigate: (page: ActivePage) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  projects,
  onSelectProject,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'high-risk' | 'pending-approvals' | 'compensation'>('all');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filter project categories
  const highRiskProjects = projects.filter((p) => p.riskCategory === 'High');
  
  const pendingApprovalProjects = projects.filter(
    (p) => p.approvalStatus === 'Environmental Clearance Pending' || p.approvalStatus === 'Incomplete Documentation'
  );

  const compensationDelayProjects = projects.filter(
    (p) => p.compensationStatus === 'Pending (<25%)' || p.compensationStatus === 'Under Dispute'
  );

  const handleEscalate = (projectName: string, actionType: string) => {
    setActionSuccessMessage(`Urgent notification dispatched: ${actionType} triggered for "${projectName}".`);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-600" />
            <h1 className="text-lg font-bold text-slate-800">Early Warning Alerts &amp; Interventions</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time triggers for critical delay bottlenecks requiring administrative escalation
          </p>
        </div>

        {/* Quick Summary Counts */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold">
            {highRiskProjects.length} Critical Risks
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
            {pendingApprovalProjects.length} Pending Clearances
          </span>
        </div>
      </div>

      {/* Success Toast */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Alerts ({highRiskProjects.length + pendingApprovalProjects.length + compensationDelayProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('high-risk')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'high-risk'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>High Risk Projects ({highRiskProjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pending-approvals')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending-approvals'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approvals ({pendingApprovalProjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('compensation')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'compensation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Compensation Delays ({compensationDelayProjects.length})</span>
        </button>
      </div>

      {/* Section 1: High Risk Project Alerts */}
      {(activeTab === 'all' || activeTab === 'high-risk') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>High Risk Projects - Immediate Intervention Required</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {highRiskProjects.map((p) => (
              <div
                key={`alert-high-${p.id}`}
                className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs hover:border-rose-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      CRITICAL DELAY ALERT
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                    <span className="text-xs text-slate-500">• {p.district}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Forecasted Delay: <strong className="text-rose-600">~{p.estimatedDelayMonths} months</strong>. 
                    {p.legalDispute && ' High Court litigation stay on land award.'} Compensation status: {p.compensationStatus}.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <RiskBadge category={p.riskCategory} score={p.riskScore} size="sm" />
                    <span className="text-[11px] text-slate-400">{p.landArea} Acres affected</span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => handleEscalate(p.name, 'Collector Taskforce Summons')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Notify Collector</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectProject(p);
                      onNavigate('prediction-result');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Pending Approval Alerts */}
      {(activeTab === 'all' || activeTab === 'pending-approvals') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Pending Approvals &amp; Documentation Clearances</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {pendingApprovalProjects.map((p) => (
              <div
                key={`alert-appr-${p.id}`}
                className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs hover:border-amber-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      CLEARANCE STALLED
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                    <span className="text-xs text-slate-500">• {p.district}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bottleneck: <strong className="text-amber-700">{p.approvalStatus}</strong>. Requires joint cadastral survey and forest liaison desk approval.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <RiskBadge category={p.riskCategory} score={p.riskScore} size="sm" />
                    <span className="text-[11px] text-slate-400">Budget: ₹{p.budgetCr} Cr</span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => handleEscalate(p.name, 'Inter-Departmental Expedite Notice')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Issue Fast-Track NOC</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectProject(p);
                      onNavigate('prediction-result');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Compensation Delays */}
      {(activeTab === 'all' || activeTab === 'compensation') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Compensation &amp; DBT Escrow Pendency</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {compensationDelayProjects.map((p) => (
              <div
                key={`alert-comp-${p.id}`}
                className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs hover:border-blue-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      FUNDS INJUNCTION
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                    <span className="text-xs text-slate-500">• {p.district}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Compensation status: <strong className="text-blue-700">{p.compensationStatus}</strong> for {p.affectedFamilies} Project Affected Families (PAFs).
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <RiskBadge category={p.riskCategory} score={p.riskScore} size="sm" />
                    <span className="text-[11px] text-slate-400">{p.affectedFamilies} Families waiting</span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => handleEscalate(p.name, 'Treasury Tranche Release Mandate')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize DBT Tranche</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectProject(p);
                      onNavigate('prediction-result');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
