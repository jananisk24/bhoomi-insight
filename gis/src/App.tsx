import { useEffect } from 'react';
import { API_BASE_URL } from './api';
import { initialProjects } from './data/sampleProjects';
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
import { useState } from 'react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    username: '',
    fullName: '',
    role: '',
    department: '',
    isAuthenticated: false // Starts on Login Page by default so user sees Page 1 immediately
  });

  const [activePage, setActivePage] = useState<ActivePage>('login');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute alert count for high risk projects
  const highRiskCount = projects.filter((p) => p.riskCategory === 'High').length;

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setActivePage('dashboard');
    setProjectsLoading(true);
    setProjectsError('');

    const token = sessionStorage.getItem('access_token');

    if (!token) {
      setProjectsError('Your login token is missing. Please log in again.');
      setProjectsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load projects (HTTP ${response.status}).`);
      }

      const savedProjects = await response.json();
      const mappedProjects: Project[] = await Promise.all(
        savedProjects.map(async (item: any): Promise<Project> => {
            let riskScore = 0;
            let riskCategory: Project['riskCategory'] = 'Low';

    // Get the latest saved ML prediction for this project.
            try {
              const predictionResponse = await fetch(
                `${API_BASE_URL}/predictions/${item.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (predictionResponse.ok) {
                const predictions = await predictionResponse.json();

                if (Array.isArray(predictions) && predictions.length > 0) {
                  const latestPrediction = predictions[0];
                  riskScore = Number(latestPrediction.delay_probability) * 100;
                  riskCategory = latestPrediction.risk_level;
                }
              }
            } catch (error) {
              console.error(
                `Could not load prediction for project ${item.id}:`,
                error
              );
            }

            const compensationStatus: Project['compensationStatus'] =
              item.compensation_status === 'Paid'
                ? 'Disbursed (100%)'
                : item.compensation_status === 'Pending'
                  ? 'Pending (<25%)'
                  : item.compensation_status === 'Disputed'
                    ? 'Under Dispute'
                    : 'Partially Disbursed (50-75%)';

            const approvalStatus: Project['approvalStatus'] =
              item.approval_days_pending === 0
                ? 'Cleared / Approved'
                : item.approval_days_pending <= 30
                  ? 'In Administrative Review'
                  : item.approval_days_pending <= 90
                    ? 'Environmental Clearance Pending'
                    : 'Incomplete Documentation';

            const rehabilitationStatus: Project['rehabilitationStatus'] =
              item.rehabilitation_progress >= 100
                ? 'Completed'
                : item.rehabilitation_progress >= 50
                  ? 'In Progress'
                  : item.rehabilitation_progress > 0
                    ? 'Land Allocated'
                    : 'Not Started';

            const matchingSample = initialProjects.find(
              (sample) =>
                sample.state === item.state &&
                sample.district === item.district
            );

            return {
              id: String(item.id),
              name: item.project_name,
              state: item.state,
              district: item.district,
              landArea: Number(item.land_required) / 0.404686,
              affectedFamilies: Number(item.affected_families),
              compensationStatus,
              legalDispute: item.legal_dispute === 'Yes',
              approvalStatus,
              rehabilitationStatus,
              riskScore,
              riskCategory,
              status:
                riskCategory === 'High'
                  ? 'Severely Delayed'
                  : riskCategory === 'Medium'
                    ? 'Moderate Delay'
                    : 'On Track',
              coordinates: matchingSample?.coordinates ?? [12.9716, 77.5946],
              projectType: item.project_type,
              delayFactors: {
                compensationPending: 0,
                legalDispute: item.legal_dispute === 'Yes' ? 1 : 0,
                approvalDelay: Number(item.approval_days_pending),
                rehabilitationGap: 100 - Number(item.rehabilitation_progress),
              },
              recommendedActions: [],
              createdDate: String(item.created_at ?? '').slice(0, 10),
              estimatedDelayMonths: 0,
              budgetCr: Number(item.estimated_cost) / 10_000_000,
            };
          })
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
  };

  const handleLogout = () => {
    setCurrentUser({
      username: '',
      fullName: '',
      role: '',
      department: '',
      isAuthenticated: false
    });
    setActivePage('login');
  };

  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setSelectedProject(newProject);
  };

  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user requested Login page or is unauthenticated
  if (activePage === 'login' || !currentUser.isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          alertCount={highRiskCount}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header
          activePage={activePage}
          user={currentUser}
          alertCount={highRiskCount}
          onNavigate={handleNavigate}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {projectsLoading && (
            <p className="p-4 text-center text-blue-600">
              Loading projects...
            </p>
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
              onSelectProjectForPrediction={(p) => setSelectedProject(p)}
            />
          )}

          {activePage === 'projects' && (
            <ProjectListPage
              projects={projects}
              onNavigate={handleNavigate}
              onSelectProjectForPrediction={(p) => setSelectedProject(p)}
              onSelectProjectForSimulation={(p) => setSelectedProject(p)}
            />
          )}

          {activePage === 'add-project' && (
            <AddProjectPage
              onAddProject={handleAddProject}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'prediction-result' && (
            <PredictionResultsPage
              project={selectedProject}
              allProjects={projects}
              onSelectProject={(p) => setSelectedProject(p)}
              onNavigate={handleNavigate}
              onSimulate={(p) => setSelectedProject(p)}
            />
          )}

          {activePage === 'what-if' && (
            <WhatIfSimulatorPage
              initialProject={selectedProject}
              allProjects={projects}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage projects={projects} />
          )}

          {activePage === 'gis-map' && (
            <GisMapPage
              projects={projects}
              onSelectProject={(p) => setSelectedProject(p)}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'alerts' && (
            <AlertsPage
              projects={projects}
              onSelectProject={(p) => setSelectedProject(p)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Footer */}
          <footer className="pt-6 pb-2 text-center text-xs text-slate-400 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Predictive Analytics System for Early Detection of Land Acquisition Delays</span>
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
