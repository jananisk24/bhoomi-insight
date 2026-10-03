import React from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Plus, 
  User as UserIcon,
  Menu
} from 'lucide-react';
import { ActivePage, User } from '../types';

interface HeaderProps {
  activePage: ActivePage;
  user: User;
  alertCount: number;
  onNavigate: (page: ActivePage) => void;
  onToggleMobileMenu?: () => void;
}

const pageTitles: Record<ActivePage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Dashboard',
    subtitle: 'Summary of land acquisition monitoring and risk early-detection metrics'
  },
  projects: {
    title: 'Project Directory',
    subtitle: 'Comprehensive inventory of active infrastructure parcels and clearance status'
  },
  'add-project': {
    title: 'Register New Land Acquisition Project',
    subtitle: 'Enter parcel parameters to generate an automated delay risk score'
  },
  'prediction-result': {
    title: 'Predictive Delay Analysis Report',
    subtitle: 'Feature breakdown, bottleneck factor scores, and administrative mitigations'
  },
  'what-if': {
    title: 'What-If Simulation Sandbox',
    subtitle: 'Experiment with compensation, approvals, and rehabilitation scenarios live'
  },
  analytics: {
    title: 'Statistical Analytics & Trend Visualizer',
    subtitle: 'District-wise concentration, risk distributions, and acquisition delay curves'
  },
  'gis-map': {
    title: 'Geographic Information System (GIS) Map',
    subtitle: 'Spatial distribution of acquisition projects with risk-tiered map coordinates'
  },
  alerts: {
    title: 'Early Warning & Risk Alerts',
    subtitle: 'Critical bottlenecks requiring urgent administrative review and intervention'
  },
  login: {
    title: 'Portal Access',
    subtitle: 'Authentication'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  user,
  alertCount,
  onNavigate,
  onToggleMobileMenu
}) => {
  const currentMeta = pageTitles[activePage] || {
    title: 'Predictive Analytics System',
    subtitle: 'Land Acquisition Delay Detection'
  };

  return (
    <header id="main-app-header" className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            id="mobile-menu-toggle-btn"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">{currentMeta.title}</h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              RFCTLARR Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">{currentMeta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Add Project Action */}
        {activePage !== 'add-project' && (
          <button
            id="btn-header-add-project"
            onClick={() => onNavigate('add-project')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Prediction</span>
          </button>
        )}

        {/* Alerts Icon */}
        <button
          id="btn-header-alerts"
          onClick={() => onNavigate('alerts')}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
          title="View Early Warning Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {alertCount}
            </span>
          )}
        </button>

        {/* User Badge & Logout button */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">{user.fullName}</div>
            <div className="text-[10px] text-slate-500 leading-tight">{user.role}</div>
          </div>
          <button
            id="btn-header-view-login"
            onClick={() => onNavigate('login')}
            className="ml-2 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
            title="Switch to Login Page / Log Out"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
