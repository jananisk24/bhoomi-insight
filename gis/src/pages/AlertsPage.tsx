import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Coins,
  FileCheck2,
  Send,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { API_BASE_URL } from '../api';
import { Project, ActivePage } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { formatAcresLabel } from '../utils/units';

interface AlertsPageProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNavigate: (page: ActivePage) => void;
}

type AdministrativeActionType =
  | 'COLLECTOR_NOTIFICATION'
  | 'FAST_TRACK_NOC'
  | 'DBT_TRANCHE_REQUEST';

type AdministrativeActionStatus =
  | 'Requested'
  | 'In Progress'
  | 'Completed'
  | 'Rejected';

interface AdministrativeAction {
  id: number;
  project_id: number;
  action_type: AdministrativeActionType;
  status: AdministrativeActionStatus;
  requested_by: string;
  notes: string | null;
  created_at: string;
}

const actionLabels: Record<AdministrativeActionType, string> = {
  COLLECTOR_NOTIFICATION: 'Collector notification request',
  FAST_TRACK_NOC: 'Fast-track NOC request',
  DBT_TRANCHE_REQUEST: 'DBT tranche request',
};

const statusClasses: Record<AdministrativeActionStatus, string> = {
  Requested: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-rose-100 text-rose-800',
};

export const AlertsPage: React.FC<AlertsPageProps> = ({
  projects,
  onSelectProject,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'high-risk' | 'pending-approvals' | 'compensation'
  >('all');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [actions, setActions] = useState<AdministrativeAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [submittingProjectId, setSubmittingProjectId] = useState<number | null>(null);

  const getToken = () => sessionStorage.getItem('access_token');

  const loadActions = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setActionErrorMessage('Your login session is missing. Please log in again.');
      setActionsLoading(false);
      return;
    }

    setActionsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/administrative-actions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Could not load saved requests (HTTP ${response.status}).`);
      }

      const data: AdministrativeAction[] = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('The backend returned an invalid administrative-actions response.');
      }
      setActions(data);
      setActionErrorMessage(null);
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error ? error.message : 'Could not load saved requests.'
      );
    } finally {
      setActionsLoading(false);
    }
  }, []);

  // Keep the saved-request list synchronized with the backend.
  useEffect(() => {
    void loadActions();
  }, [loadActions]);


  const submitAdministrativeAction = async (
    project: Project,
    actionType: AdministrativeActionType
  ) => {
    const token = getToken();
    const projectId = Number(project.id);

    if (!token) {
      setActionErrorMessage('Your login session is missing. Please log in again.');
      return;
    }
    if (!Number.isInteger(projectId) || projectId <= 0) {
      setActionErrorMessage('This project has an invalid backend ID. No request was saved.');
      return;
    }

    setSubmittingProjectId(projectId);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/administrative-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          action_type: actionType,
          notes: `Request created from the Bhoomi Insight alerts page for ${project.name}.`,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail =
          typeof errorBody?.detail === 'string'
            ? errorBody.detail
            : `Request could not be saved (HTTP ${response.status}).`;
        throw new Error(detail);
      }

      const savedAction: AdministrativeAction = await response.json();
      setActions((previous) => [savedAction, ...previous.filter((item) => item.id !== savedAction.id)]);
      setActionSuccessMessage(
        `${actionLabels[actionType]} saved for "${project.name}". Current status: ${savedAction.status}.`
      );
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error ? error.message : 'Could not save the administrative request.'
      );
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const highRiskProjects = projects.filter((p) => p.riskCategory === 'High');

  const pendingApprovalProjects = projects.filter(
    (p) =>
      p.approvalStatus === 'In Administrative Review' ||
      p.approvalStatus === 'Environmental Clearance Pending' ||
      p.approvalStatus === 'Incomplete Documentation'
  );

  const compensationDelayProjects = projects.filter(
    (p) =>
      p.compensationStatus === 'Pending (<25%)' ||
      p.compensationStatus === 'Under Dispute'
  );

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [Number(project.id), project.name])),
    [projects]
  );

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-600" />
            <h1 className="text-lg font-bold text-slate-800">
              Early Warning Alerts &amp; Interventions
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review delay risks and record administrative intervention requests.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold">
            {highRiskProjects.length} Critical Risks
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
            {pendingApprovalProjects.length} Pending Clearances
          </span>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} aria-label="Dismiss success message">
            ✕
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span>{actionErrorMessage}</span>
          <button onClick={() => setActionErrorMessage(null)} aria-label="Dismiss error message">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Alerts ({new Set(
            [...highRiskProjects, ...pendingApprovalProjects, ...compensationDelayProjects]
              .map((project) => project.id)
          ).size})
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

      {(activeTab === 'all' || activeTab === 'high-risk') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>High Risk Projects - Immediate Intervention Required</span>
          </div>
          {highRiskProjects.length === 0 ? (
            <p className="text-xs text-slate-500 bg-white border rounded-xl p-4">No high-risk projects found.</p>
          ) : (
            highRiskProjects.map((p) => {
              const projectId = Number(p.id);
              return (
                <div key={`alert-high-${p.id}`} className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs hover:border-rose-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">CRITICAL DELAY ALERT</span>
                      <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                      <span className="text-xs text-slate-500">• {p.district}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Delay duration: <strong className="text-rose-600">{p.estimatedDelayMonths == null ? 'not estimated by the ML model' : `~${p.estimatedDelayMonths} months (rule-based estimate)`}</strong>.
                      {p.legalDispute && ' Legal dispute recorded.'} Compensation status: {p.compensationStatus}.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <RiskBadge category={p.riskCategory} score={p.riskScore ?? undefined} size="sm" />
                      <span className="text-[11px] text-slate-400">{formatAcresLabel(p.landArea)} affected</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      disabled={submittingProjectId === projectId}
                      onClick={() => void submitAdministrativeAction(p, 'COLLECTOR_NOTIFICATION')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{submittingProjectId === projectId ? 'Saving...' : 'Record Collector Request'}</span>
                    </button>
                    <button onClick={() => { onSelectProject(p); onNavigate('prediction-result'); }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                      <span>View Breakdown</span><ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {(activeTab === 'all' || activeTab === 'pending-approvals') && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Pending Approvals &amp; Documentation Clearances</span>
          </div>
          {pendingApprovalProjects.length === 0 ? (
            <p className="text-xs text-slate-500 bg-white border rounded-xl p-4">No pending approval alerts found.</p>
          ) : (
            pendingApprovalProjects.map((p) => {
              const projectId = Number(p.id);
              return (
                <div key={`alert-appr-${p.id}`} className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs hover:border-amber-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">CLEARANCE STALLED</span>
                      <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                      <span className="text-xs text-slate-500">• {p.district}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bottleneck: <strong className="text-amber-700">{p.approvalStatus}</strong>. Review the outstanding departmental clearances and documentation.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <RiskBadge category={p.riskCategory} score={p.riskScore ?? undefined} size="sm" />
                      <span className="text-[11px] text-slate-400">Budget: ₹{p.budgetCr} Cr</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      disabled={submittingProjectId === projectId}
                      onClick={() => void submitAdministrativeAction(p, 'FAST_TRACK_NOC')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>{submittingProjectId === projectId ? 'Saving...' : 'Record Fast-Track NOC Request'}</span>
                    </button>
                    <button onClick={() => { onSelectProject(p); onNavigate('prediction-result'); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                      <span>Inspect</span><ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {(activeTab === 'all' || activeTab === 'compensation') && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Compensation &amp; DBT Escrow Pendency</span>
          </div>
          {compensationDelayProjects.length === 0 ? (
            <p className="text-xs text-slate-500 bg-white border rounded-xl p-4">No compensation delay alerts found.</p>
          ) : (
            compensationDelayProjects.map((p) => {
              const projectId = Number(p.id);
              return (
                <div key={`alert-comp-${p.id}`} className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs hover:border-blue-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">COMPENSATION PENDENCY</span>
                      <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                      <span className="text-xs text-slate-500">• {p.district}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Compensation status: <strong className="text-blue-700">{p.compensationStatus}</strong> for {p.affectedFamilies} Project Affected Families (PAFs).
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <RiskBadge category={p.riskCategory} score={p.riskScore ?? undefined} size="sm" />
                      <span className="text-[11px] text-slate-400">{p.affectedFamilies} Families affected</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      disabled={submittingProjectId === projectId}
                      onClick={() => void submitAdministrativeAction(p, 'DBT_TRANCHE_REQUEST')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{submittingProjectId === projectId ? 'Saving...' : 'Record DBT Tranche Request'}</span>
                    </button>
                    <button onClick={() => { onSelectProject(p); onNavigate('prediction-result'); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                      <span>Details</span><ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Saved Administrative Requests</h2>
            <p className="text-xs text-slate-500 mt-1">Requests stored by the backend. A saved request does not mean an official action has been executed.</p>
          </div>
          <button
            onClick={() => void loadActions()}
            disabled={actionsLoading}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {actionsLoading ? (
          <p className="p-4 text-xs text-slate-500">Loading saved requests...</p>
        ) : actions.length === 0 ? (
          <p className="p-4 text-xs text-slate-500">No administrative requests have been saved yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {actions.map((action) => (
              <div key={action.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    {actionLabels[action.action_type] ?? action.action_type}
                    <span className="font-normal text-slate-500"> · {projectNames.get(action.project_id) ?? `Project #${action.project_id}`}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Request #{action.id} · By {action.requested_by} · {formatDate(action.created_at)}
                  </p>
                  {action.notes && <p className="text-[11px] text-slate-500 mt-1 break-words">{action.notes}</p>}
                </div>
                <span className={`self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-bold ${statusClasses[action.status] ?? 'bg-slate-100 text-slate-700'}`}>
                  {action.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
