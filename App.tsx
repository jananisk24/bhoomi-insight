import React, { useState } from 'react';
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProjects[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
