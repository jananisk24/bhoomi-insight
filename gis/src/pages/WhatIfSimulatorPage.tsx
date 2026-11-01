import React, { useState } from 'react';
import { AlertCircle, Cpu, SlidersHorizontal } from 'lucide-react';
import { API_BASE_URL } from '../api';
import { Project, StageRisk } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface WhatIfSimulatorPageProps {
  initialProject: Project | null;
  allProjects: Project[];
}

interface SimulationResponse {
  project_id: number;
  project_name: string;
  baseline_delay_probability: number;
  delay_probability: number;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  stage_risk: Record<string, StageRisk>;
  highest_risk_stage: string;
}

type ModelCompensationStatus = 'Paid' | 'In Progress' | 'Not Started' | '';

const modelCompensationStatus = (
  status: Project['compensationStatus']
): ModelCompensationStatus => {
  if (status === 'Paid' || status === 'Disbursed (100%)') return 'Paid';
  if (status === 'Not Started' || status === 'Pending' || status === 'Pending (<25%)') {
    return 'Not Started';
  }
  if (
    status === 'In Progress' ||
    status === 'Under Dispute' ||
    status === 'Partially Disbursed (50-75%)'
  ) {
    return 'In Progress';
  }
  return '';
};

const scenarioValues = (project: Project) => ({
  affectedFamilies: project.affectedFamilies,
  compensationStatus: modelCompensationStatus(project.compensationStatus),
  approvalDaysPending: project.approvalDaysPending ?? 0,
  legalDispute: project.legalDispute,
  possessionStatus:
    project.possessionStatus === 'Full' ||
    project.possessionStatus === 'Partial' ||
    project.possessionStatus === 'Not Taken'
      ? project.possessionStatus
      : '',
  rehabilitationProgress: project.rehabilitationProgress ?? 0,
  stakeholderScore: project.stakeholderScore ?? 5,
  districtHistoricalDelay: project.districtHistoricalDelay ?? 0,
});

export const WhatIfSimulatorPage: React.FC<WhatIfSimulatorPageProps> = ({
  initialProject,
  allProjects,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProject?.id ?? allProjects[0]?.id ?? ''
  );
  const baseProject =
    allProjects.find((project) => project.id === selectedProjectId) ??
    allProjects[0];
  const [scenario, setScenario] = useState(() =>
    baseProject ? scenarioValues(baseProject) : null
  );
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = allProjects.find((item) => item.id === projectId);
    setScenario(project ? scenarioValues(project) : null);
    setResult(null);
    setError('');
  };

  const updateScenario = <K extends keyof NonNullable<typeof scenario>>(
    key: K,
    value: NonNullable<typeof scenario>[K]
  ) => {
    setScenario((current) => current ? { ...current, [key]: value } : current);
    setResult(null);
  };

  const applyPreset = (preset: 'best' | 'settle-court' | 'clear-funds') => {
    setScenario((current) => {
      if (!current) return current;
      if (preset === 'settle-court') {
        return { ...current, legalDispute: false };
      }
      if (preset === 'clear-funds') {
        return { ...current, compensationStatus: 'Paid' };
      }
      return {
        ...current,
        compensationStatus: 'Paid',
        approvalDaysPending: 0,
        legalDispute: false,
        possessionStatus: 'Full',
        rehabilitationProgress: 100,
        stakeholderScore: 5,
        districtHistoricalDelay: 0,
      };
    });
    setResult(null);
    setError('');
  };

  const resetScenario = () => {
    setScenario(scenarioValues(baseProject));
    setResult(null);
    setError('');
  };

  const runSimulation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!baseProject || !scenario) return;

    const projectId = Number(baseProject.id);
    const token = sessionStorage.getItem('access_token');
    if (!Number.isInteger(projectId) || projectId <= 0) {
      setError('This project has an invalid backend ID.');
      return;
    }
    if (!token) {
      setError('Your login session is missing. Please log in again.');
      return;
    }
    if (!scenario.compensationStatus || !scenario.possessionStatus) {
      setError('Choose valid compensation and possession statuses before simulating.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          affected_families: scenario.affectedFamilies,
          compensation_status: scenario.compensationStatus,
          approval_days_pending: scenario.approvalDaysPending,
          legal_dispute: scenario.legalDispute ? 'Yes' : 'No',
          possession_status: scenario.possessionStatus,
          rehabilitation_progress: scenario.rehabilitationProgress,
          stakeholder_score: scenario.stakeholderScore,
          district_historical_delay: scenario.districtHistoricalDelay,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Simulation failed (HTTP ${response.status}): ${detail}`);
      }

      const simulation: SimulationResponse = await response.json();
      if (
        !Number.isFinite(simulation.delay_probability) ||
        simulation.delay_probability < 0 ||
        simulation.delay_probability > 1
      ) {
        throw new Error('The backend returned an invalid model probability.');
      }
      setResult(simulation);
    } catch (simulationError) {
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : 'The model simulation failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!baseProject || !scenario) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No saved project is available for simulation.
      </div>
    );
  }

  const percentDelta = result
    ? (result.delay_probability - result.baseline_delay_probability) * 100
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-bold text-slate-800">
            Model-Based What-If Simulator
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Scenario inputs are sent through the same trained Random Forest pipeline as saved predictions.
        </p>
        <label className="mt-4 block text-xs font-semibold text-slate-700" htmlFor="what-if-project-picker">
          Project
        </label>
        <select
          id="what-if-project-picker"
          value={baseProject.id}
          onChange={(event) => selectProject(event.target.value)}
          className="mt-1 w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {allProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.id}: {project.name}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <span className="mr-1 text-xs font-semibold text-slate-600">
          Fill a scenario:
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => applyPreset('settle-court')}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Resolve court stay
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => applyPreset('clear-funds')}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Release compensation funds
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => applyPreset('best')}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
        >
          Best-case scenario
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={resetScenario}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          Reset to saved project
        </button>
        <span className="basis-full text-[11px] text-slate-500">
          These buttons only change the form. Run the model simulation to see results.
        </span>
      </div>

      <form onSubmit={runSimulation} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">
            Affected families
            <input
              type="number"
              min="0"
              step="1"
              required
              value={scenario.affectedFamilies}
              onChange={(event) => updateScenario('affectedFamilies', Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Compensation status
            <select
              required
              value={scenario.compensationStatus}
              onChange={(event) => updateScenario('compensationStatus', event.target.value as ModelCompensationStatus)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
            >
              <option value="">Select status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Paid">Paid</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Approval days pending
            <input
              type="number"
              min="0"
              step="1"
              required
              value={scenario.approvalDaysPending}
              onChange={(event) => updateScenario('approvalDaysPending', Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Legal dispute
            <select
              value={scenario.legalDispute ? 'Yes' : 'No'}
              onChange={(event) => updateScenario('legalDispute', event.target.value === 'Yes')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Possession status
            <select
              required
              value={scenario.possessionStatus}
              onChange={(event) => updateScenario('possessionStatus', event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
            >
              <option value="">Select status</option>
              <option value="Not Taken">Not Taken</option>
              <option value="Partial">Partial</option>
              <option value="Full">Full</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Rehabilitation progress (%)
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={scenario.rehabilitationProgress}
              onChange={(event) => updateScenario('rehabilitationProgress', Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Stakeholder score (1–5)
            <input
              type="number"
              min="1"
              max="5"
              step="1"
              required
              value={scenario.stakeholderScore}
              onChange={(event) => updateScenario('stakeholderScore', Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            District historical delay (0–100)
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              required
              value={scenario.districtHistoricalDelay}
              onChange={(event) => updateScenario('districtHistoricalDelay', Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          <Cpu className="h-4 w-4" />
          {loading ? 'Running trained model…' : 'Run model simulation'}
        </button>
      </form>

      {result && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Saved model baseline</div>
              <div className="mt-1 text-2xl font-bold">
                {(result.baseline_delay_probability * 100).toFixed(2)}%
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="text-xs text-slate-500">Scenario model probability</div>
              <div className="mt-1 text-2xl font-bold text-blue-700">
                {result.risk_score.toFixed(2)}%
              </div>
              <RiskBadge category={result.risk_level} />
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Change from baseline</div>
              <div className={`mt-1 text-2xl font-bold ${
                percentDelta !== null && percentDelta < 0
                  ? 'text-emerald-700'
                  : percentDelta !== null && percentDelta > 0
                    ? 'text-rose-700'
                    : 'text-slate-700'
              }`}>
                {percentDelta === null ? 'N/A' : `${percentDelta > 0 ? '+' : ''}${percentDelta.toFixed(2)} percentage points`}
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-800">
              Scenario stage-risk scores
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Highest-risk stage: <strong>{result.highest_risk_stage}</strong>
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries<StageRisk>(result.stage_risk).map(([stage, risk]) => (
                <div key={stage} className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-700">{stage}</div>
                  <div className="my-1 text-lg font-bold">{risk.score.toFixed(2)}%</div>
                  <RiskBadge category={risk.category} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
