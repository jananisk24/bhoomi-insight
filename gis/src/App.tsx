import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api';
import { calculateDelayRisk } from './utils/predictionEngine';
import { Project, ActivePage, User } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { AddProjectPage } from './pages/AddProjectPage';
import { PredictionResultsPage } from './pages/PredictionResultsPage';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { GisMapPage } from './pages/GisMapPage';
import { AlertsPage } from './pages/AlertsPage';
import { X, ShieldCheck } from 'lucide-react';
import {
  hectaresToAcres,
  probabilityToPercent,
  rupeesToCrores,
} from './utils/units';

type BackendProject = {
  id: number | string;
  project_name: string;
  state: string;
  district: string;
  land_required: number | string;
  affected_families: number | string;
  compensation_status?: string | null;
  approval_status?: string | null;
  legal_dispute?: string | null;
  approval_days_pending?: number | string | null;
  rehabilitation_progress?: number | string | null;
  possession_status?: string | null;
  stakeholder_score?: number | string | null;
  district_historical_delay?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  project_type?: string | null;
  created_at?: string | null;
  estimated_cost?: number | string | null;
};

type BackendPrediction = {
  id?: number | string;
  delay_probability?: number | string | null;
  risk_level?: string | null;
  stage_risk?: Project['stageRisk'];
  highest_risk_stage?: Project['highestRiskStage'];
  created_at?: string | null;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapRiskCategory = (value: unknown): Project['riskCategory'] => {
  if (typeof value !== 'string') return 'Not Predicted';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return 'Not Predicted';
};

const mapProbabilityToPercent = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const percentage =
    parsed >= 0 && parsed <= 1 ? probabilityToPercent(parsed) : parsed;
  if (percentage === null) return null;
  return percentage >= 0 && percentage <= 100 ? percentage : null;
};

const getLatestPrediction = (
  predictions: BackendPrediction[]
): BackendPrediction | null => {
  if (!Array.isArray(predictions) || predictions.length === 0) return null;

  // Prefer timestamps; use the prediction ID as a fallback.
  return [...predictions].sort((a, b) => {
    const timeA = a.created_at ? Date.parse(a.created_at) : Number.NaN;
    const timeB = b.created_at ? Date.parse(b.created_at) : Number.NaN;
    if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }
    return toNumber(b.id, -1) - toNumber(a.id, -1);
  })[0];
};

const mapBackendProject = async (
  item: BackendProject,
  token: string
): Promise<Project> => {
  let riskScore: number | null = null;
  let riskCategory: Project['riskCategory'] = 'Not Predicted';
  let latestPrediction: BackendPrediction | null = null;
  let predictionLoadError: string | null = null;

  try {
    const predictionResponse = await fetch(
      `${API_BASE_URL}/predictions/${encodeURIComponent(String(item.id))}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (predictionResponse.ok) {
      const predictions: BackendPrediction[] = await predictionResponse.json();
      latestPrediction = getLatestPrediction(predictions);

      if (latestPrediction) {
        riskScore = mapProbabilityToPercent(latestPrediction.delay_probability);
        riskCategory = mapRiskCategory(latestPrediction.risk_level);
        if (riskScore === null) riskCategory = 'Not Predicted';
      }
    } else if (predictionResponse.status !== 404) {
      predictionLoadError =
        `Could not load saved prediction (HTTP ${predictionResponse.status}).`;
      console.warn(
        `Could not load prediction for project ${item.id} (HTTP ${predictionResponse.status}).`
      );
    }
  } catch (error) {
    predictionLoadError =
      'Could not load saved prediction due to a network or response error.';
    console.error(`Could not load prediction for project ${item.id}:`, error);
  }

  const backendCompensationStatus = String(item.compensation_status ?? '');
  const compensationStatus: Project['compensationStatus'] =
    backendCompensationStatus === 'Paid' ||
    backendCompensationStatus === 'Disbursed (100%)'
      ? 'Disbursed (100%)'
      : backendCompensationStatus === 'Pending' ||
          backendCompensationStatus === 'Not Started' ||
          backendCompensationStatus === 'Pending (<25%)'
        ? 'Pending (<25%)'
        : backendCompensationStatus === 'Under Dispute'
          ? 'Under Dispute'
          :               backendCompensationStatus === 'Partially Disbursed (50-75%)'
            ? 'Partially Disbursed (50-75%)'
            : backendCompensationStatus === 'In Progress'
              ? 'In Progress'
              : 'Unknown';

  const knownApprovalStatuses: Project['approvalStatus'][] = [
    'Cleared / Approved',
    'In Administrative Review',
    'Environmental Clearance Pending',
    'Incomplete Documentation',
  ];
  const approvalStatus = knownApprovalStatuses.includes(
    item.approval_status as Project['approvalStatus']
  )
    ? (item.approval_status as Project['approvalStatus'])
    : 'Unknown';

  const rehabilitationProgress = Math.min(
    100,
    Math.max(0, toNumber(item.rehabilitation_progress))
  );
  const rehabilitationStatus: Project['rehabilitationStatus'] =
    rehabilitationProgress >= 100
      ? 'Completed'
      : rehabilitationProgress >= 50
        ? 'In Progress'
        : rehabilitationProgress > 0
          ? 'Land Allocated'
          : 'Not Started';

  const landAreaAcres = hectaresToAcres(toNumber(item.land_required));
  const affectedFamilies = toNumber(item.affected_families);
  const legalDispute = String(item.legal_dispute ?? '').toLowerCase() === 'yes';
  const latitude = item.latitude == null ? Number.NaN : Number(item.latitude);
  const longitude = item.longitude == null ? Number.NaN : Number(item.longitude);
  const coordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
      ? ([latitude, longitude] as [number, number])
      : null;

  const ruleBasedDetails = calculateDelayRisk({
    landArea: landAreaAcres,
    affectedFamilies,
    compensationStatus,
    legalDispute,
    approvalStatus,
    rehabilitationStatus,
  });

  return {
    id: String(item.id),
    name: item.project_name,
    state: item.state,
    district: item.district,
    landArea: landAreaAcres,
    affectedFamilies,
    compensationStatus,
    legalDispute,
    approvalStatus,
    rehabilitationStatus,
    riskScore,
    riskCategory,
    predictionLoadError,
    status:
      riskCategory === 'High'
        ? 'Severely Delayed'
        : riskCategory === 'Medium'
          ? 'Moderate Delay'
          : riskCategory === 'Low'
            ? 'On Track'
            : 'Not Predicted',
    coordinates,
    projectType: item.project_type ?? 'Unknown',
    // These are rule-based factor severities, not ML feature attributions.
    delayFactors: ruleBasedDetails.delayFactors,
    recommendedActions: ruleBasedDetails.recommendedActions,
    approvalDaysPending: toNumber(item.approval_days_pending),
    possessionStatus:
      item.possession_status === 'Full' ||
      item.possession_status === 'Partial' ||
      item.possession_status === 'Not Taken'
        ? item.possession_status
        : 'Unknown',
    rehabilitationProgress,
    stakeholderScore: toNumber(item.stakeholder_score, 5),
    districtHistoricalDelay: toNumber(item.district_historical_delay),
    stageRisk: latestPrediction?.stage_risk ?? null,
    highestRiskStage: latestPrediction?.highest_risk_stage ?? null,
    createdDate: String(item.created_at ?? '').slice(0, 10),
    // The ML endpoint predicts probability, not validated delay duration.
    estimatedDelayMonths: null,
    budgetCr: rupeesToCrores(toNumber(item.estimated_cost)),
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    username: '',
    fullName: '',
    role: '',
    department: '',
    isAuthenticated: false,
  });
  const [activePage, setActivePage] = useState<ActivePage>('login');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const highRiskCount = projects.filter(
    (project) => project.riskCategory === 'High'
  ).length;

  const handleLoginSuccess = useCallback(async (user: User) => {
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      setCurrentUser({
        username: '',
        fullName: '',
        role: '',
        department: '',
        isAuthenticated: false,
      });
      setActivePage('login');
      setProjectsError('Your login token is missing. Please log in again.');
      return;
    }

    setSessionMessage('');
    setCurrentUser(user);
    setActivePage('dashboard');
    setProjectsLoading(true);
    setProjectsError('');

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to load projects (HTTP ${response.status}).`);
      }

      const savedProjects: BackendProject[] = await response.json();
      if (!Array.isArray(savedProjects)) {
        throw new Error('The backend returned an invalid projects response.');
      }

      const mappedProjects = await Promise.all(
        savedProjects.map((item) => mapBackendProject(item, token))
      );
      setProjects(mappedProjects);
      setSelectedProject(mappedProjects[0] ?? null);
      console.log('Projects loaded from backend:', mappedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjectsError(
        error instanceof Error
          ? error.message
          : 'Could not load projects from the backend.'
      );
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('token_type');
          setSessionMessage('Your session expired. Please sign in again.');
          return;
        }
        if (!response.ok) {
          throw new Error(`Could not restore your session (HTTP ${response.status}).`);
        }

        const profile: unknown = await response.json();
        if (
          typeof profile !== 'object' ||
          profile === null ||
          !('username' in profile) ||
          !('role' in profile) ||
          typeof profile.username !== 'string' ||
          typeof profile.role !== 'string' ||
          !profile.username.trim() ||
          !profile.role.trim()
        ) {
          throw new Error('The backend returned an invalid user profile.');
        }

        if (!cancelled) {
          await handleLoginSuccess({
            username: profile.username,
            fullName: profile.username,
            role: profile.role,
            department: 'Land Resources',
            isAuthenticated: true,
          });
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        if (!cancelled) {
          setSessionMessage(
            'Could not restore your previous session. Please sign in again.'
          );
        }
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [handleLoginSuccess]);

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_type');
    setCurrentUser({
      username: '',
      fullName: '',
      role: '',
      department: '',
      isAuthenticated: false,
    });
    setProjects([]);
    setSelectedProject(null);
    setProjectsError('');
    setSessionMessage('');
    setActivePage('login');
  };

  const handleAddProject = (newProject: Project) => {
    setProjects((previousProjects) => [newProject, ...previousProjects]);
    setSelectedProject(newProject);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((previousProjects) =>
      previousProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
    setSelectedProject(updatedProject);
  };

  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (activePage === 'login' || !currentUser.isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        sessionMessage={sessionMessage}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      <div className="hidden md:flex h-full">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          alertCount={highRiskCount}
        />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-slate-900 h-full shadow-2xl z-50">
            <div className="flex items-center justify-end p-3 border-b border-slate-800">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              activePage={activePage}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              alertCount={highRiskCount}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header
          activePage={activePage}
          user={currentUser}
          alertCount={highRiskCount}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {projectsLoading && (
            <p className="p-4 text-center text-blue-600">Loading projects...</p>
          )}
          {projectsError && (
            <div className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              {projectsError}
            </div>
          )}

          {activePage === 'dashboard' && (
            <DashboardPage
              projects={projects}
              onNavigate={handleNavigate}
              onSelectProjectForPrediction={setSelectedProject}
            />
          )}
          {activePage === 'projects' && (
            <ProjectListPage
              projects={projects}
              onNavigate={handleNavigate}
              onSelectProjectForPrediction={setSelectedProject}
              onSelectProjectForSimulation={setSelectedProject}
              onSelectProjectForEdit={(project) => {
                setSelectedProject(project);
                handleNavigate('edit-project');
              }}
            />
          )}
          {activePage === 'add-project' && (
            <AddProjectPage
              onAddProject={handleAddProject}
              onNavigate={handleNavigate}
            />
          )}
          {activePage === 'edit-project' && selectedProject && (
            <AddProjectPage
              initialProject={selectedProject}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onNavigate={handleNavigate}
            />
          )}
          {activePage === 'prediction-result' && (
            <PredictionResultsPage
              project={selectedProject}
              allProjects={projects}
              onSelectProject={setSelectedProject}
              onNavigate={handleNavigate}
              onSimulate={setSelectedProject}
            />
          )}
          {activePage === 'what-if' && (
            <WhatIfSimulatorPage
              initialProject={selectedProject}
              allProjects={projects}
            />
          )}
          {activePage === 'analytics' && <AnalyticsPage projects={projects} />}
          {activePage === 'gis-map' && (
            <GisMapPage
              projects={projects}
              onSelectProject={setSelectedProject}
              onNavigate={handleNavigate}
            />
          )}
          {activePage === 'alerts' && (
            <AlertsPage
              projects={projects}
              onSelectProject={setSelectedProject}
              onNavigate={handleNavigate}
            />
          )}

          <footer className="pt-6 pb-2 text-center text-xs text-slate-400 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Predictive Analytics System for Early Detection of Land
                Acquisition Delays
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Government Infrastructure &amp; Land Resources Monitoring Portal
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
