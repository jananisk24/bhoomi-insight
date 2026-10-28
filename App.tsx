import { useEffect, useState } from 'react';
import { ActivePage, BackendPrediction, BackendPredictionRecord, Project, ProjectStatus, User } from './types';
import { initialProjects } from './sampleProjects';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { ProjectListPage } from './ProjectListPage';
import { AddProjectPage } from './AddProjectPage';
import { PredictionResultsPage } from './PredictionResultsPage';
import { WhatIfSimulatorPage } from './WhatIfSimulatorPage';
import { AnalyticsPage } from './AnalyticsPage';
import { GisMapPage } from './GisMapPage';
import { AlertsPage } from './AlertsPage';
import { 
  X, 
  ShieldCheck, 
  LayoutDashboard, 
  LandPlot, 
  PlusCircle, 
  Compass, 
  Bell, 
  Menu 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    username: '',
    fullName: '',
    role: '',
    department: '',
    isAuthenticated: false // Starts on Login Page by default so user sees Page 1 immediately
  });

  const [activePage, setActivePage] = useState<ActivePage>('login');
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [backendProjectsLoaded, setBackendProjectsLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProjects[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const loginResponse = await fetch('http://127.0.0.1:8000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            username: 'janani',
            password: 'janani123',
          }),
        });

        if (!loginResponse.ok) {
          throw new Error('Backend login failed');
        }

        const loginData = await loginResponse.json();

        const projectsResponse = await fetch(
          'http://127.0.0.1:8000/projects',
          {
            headers: {
              Authorization: `Bearer ${loginData.access_token}`,
              Accept: 'application/json',
            },
          }
        );

        if (!projectsResponse.ok) {
          throw new Error(
            `Failed to fetch projects: ${projectsResponse.status}`
          );
        }

        const data = await projectsResponse.json();
        const predictionResults = await Promise.all(
          data.map(async (item: any) => {
            try {
              const predictionResponse = await fetch(
                `http://127.0.0.1:8000/predictions/${item.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${loginData.access_token}`,
                    Accept: 'application/json',
                  },
                }
              );

              if (!predictionResponse.ok) {
                console.warn(
                  `Prediction unavailable for project ${item.id}`
                );
                return { projectId: item.id, prediction: null };
              }

              const records: BackendPredictionRecord[] =
                await predictionResponse.json();

              const latestPrediction =
                records.length > 0
                  ? [...records].sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )[0]
                  : null;

              return {
                projectId: item.id,
                prediction: latestPrediction,
              };
            } catch (error) {
              console.warn(
                `Could not fetch prediction for project ${item.id}`,
                error
              );
              return { projectId: item.id, prediction: null };
            }
          })
        );

        const predictionsByProjectId = new Map(
          predictionResults.map((result) => [
            result.projectId,
            result.prediction,
          ])
        );        

        const backendProjects: Project[] = data.map((item: any) => ({
          id: `BACKEND-${item.id}`,
          name: item.project_name,
          district: item.district,
          state: item.state,
          landArea: Number(item.land_required) || 0,
          affectedFamilies: Number(item.affected_families) || 0,
          compensationStatus: item.compensation_status || 'Pending',
          legalDispute:
            item.legal_dispute === true || item.legal_dispute === 'Yes',
          approvalStatus:
            Number(item.approval_days_pending) > 0
              ? 'Environmental Clearance Pending'
              : 'Approved',
          rehabilitationStatus:
            Number(item.rehabilitation_progress) >= 100
              ? 'Completed'
              : Number(item.rehabilitation_progress) > 0
                ? 'In Progress'
                : 'Not Started',
          riskScore:
            predictionsByProjectId.get(item.id)?.delay_probability != null
              ? predictionsByProjectId.get(item.id)!.delay_probability * 100
              : -1,

          riskCategory:
            predictionsByProjectId.get(item.id)?.risk_level ?? 'Not Predicted',
          status:
            (predictionsByProjectId.get(item.id)?.risk_level === 'High'
              ? 'Severely Delayed'
              : predictionsByProjectId.get(item.id)?.risk_level === 'Medium'
                ? 'Moderate Delay'
                : predictionsByProjectId.get(item.id)?.risk_level === 'Low'
                  ? 'On Track'
                  : item.status || 'Pending') as ProjectStatus,
          coordinates: [13.0827, 80.2707],
          projectType: item.project_type || 'Other',
          delayFactors: {
            compensationPending:
              item.compensation_status === 'Paid' ? 0 : 50,
            legalDispute:
              item.legal_dispute === true || item.legal_dispute === 'Yes'
                ? 100
                : 0,
            approvalDelay: Math.min(
              100,
              Number(item.approval_days_pending) / 2
            ),
            rehabilitationGap: 100 - Math.min(
              100,
              Number(item.rehabilitation_progress) || 0
            ),
          },
          recommendedActions: [
            'Review pending approvals and compensation.',
            'Update rehabilitation and possession progress.',
          ],
          createdDate: item.created_at
            ? String(item.created_at).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          estimatedDelayMonths: 0,
          budgetCr: (Number(item.estimated_cost) || 0) / 10000000,
        }));

        setProjects((previousProjects) => {
          const sampleProjects = previousProjects.filter(
            (project) => !project.id.startsWith('BACKEND-')
          );

          return [...sampleProjects, ...backendProjects];
        });

        console.log('Backend projects added:', backendProjects.length);
      } catch (error) {
        console.error('Backend connection error:', error);
      }
    };

    fetchProjects();
  }, []);
  

  // Compute alert count for high risk projects
  const highRiskCount = projects.filter((p) => p.riskCategory === 'High').length;

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActivePage('dashboard');
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
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

        {/* M1/Mobile Bottom Navigation Bar (Visible only on mobile screens < 768px) */}
        <nav 
          id="mobile-bottom-nav" 
          aria-label="Mobile Bottom Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg"
        >
          <button
            id="mobile-nav-dashboard"
            onClick={() => handleNavigate('dashboard')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] transition-colors ${
              activePage === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button
            id="mobile-nav-projects"
            onClick={() => handleNavigate('projects')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] transition-colors ${
              activePage === 'projects' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LandPlot className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Directory</span>
          </button>

          <button
            id="mobile-nav-add"
            onClick={() => handleNavigate('add-project')}
            className="flex flex-col items-center justify-center -mt-4 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 min-w-[48px] min-h-[48px]"
            title="Register & Predict"
          >
            <PlusCircle className="w-6 h-6" />
          </button>

          <button
            id="mobile-nav-gis"
            onClick={() => handleNavigate('gis-map')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] transition-colors ${
              activePage === 'gis-map' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">GIS Map</span>
          </button>

          <button
            id="mobile-nav-more"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors relative"
          >
            {highRiskCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />
            )}
            <Menu className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
