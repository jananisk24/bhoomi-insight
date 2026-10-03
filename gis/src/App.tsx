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
import { X, ShieldCheck } from 'lucide-react';

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
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
