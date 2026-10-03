import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  Cpu, 
  SlidersHorizontal, 
  BarChart3, 
  MapPin, 
  Bell, 
  LogOut,
  LogIn,
  LandPlot,
  ShieldCheck
} from 'lucide-react';
import { ActivePage } from '../types';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onLogout: () => void;
  alertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  onLogout,
  alertCount
}) => {
  const navItems = [
    { id: 'dashboard' as ActivePage, label: 'Main Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'projects' as ActivePage, label: 'Project Directory', icon: Layers, badge: null },
    { id: 'add-project' as ActivePage, label: 'Add New Project', icon: PlusCircle, badge: null },
    { id: 'prediction-result' as ActivePage, label: 'Prediction Results', icon: Cpu, badge: 'Delay' },
    { id: 'what-if' as ActivePage, label: 'What-If Simulator', icon: SlidersHorizontal, badge: 'Sim' },
    { id: 'analytics' as ActivePage, label: 'Analytics & Trends', icon: BarChart3, badge: null },
    { id: 'gis-map' as ActivePage, label: 'GIS Project Map', icon: MapPin, badge: 'Live' },
    { id: 'alerts' as ActivePage, label: 'Early Warning Alerts', icon: Bell, badge: alertCount > 0 ? String(alertCount) : null },
    { id: 'login' as ActivePage, label: 'Login Screen', icon: LogIn, badge: 'Auth' },
  ];

  return (
    <aside id="app-sidebar" className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Portal Branding */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
            <LandPlot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">GovTech Portal</div>
            <h1 className="text-sm font-bold text-white leading-tight">LandDelay Predict</h1>
          </div>
        </div>

        {/* System Tag */}
        <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-blue-950/70 border border-blue-800/60 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="text-[11px] text-blue-200 leading-none">
            <span className="font-semibold text-blue-100">Decision Support System</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          System Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.id === 'alerts'
                      ? 'bg-rose-500 text-white'
                      : isActive
                      ? 'bg-blue-800 text-blue-100'
                      : 'bg-slate-800 text-emerald-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User / Logout Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
        <div className="px-3 py-2 rounded-lg bg-slate-800/60 mb-2">
          <div className="text-[11px] font-semibold text-slate-200">Revenue Dept. Analyst</div>
          <div className="text-[10px] text-slate-400">Land Acquisition Unit</div>
        </div>

        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit / Log Out</span>
        </button>
      </div>
    </aside>
  );
};
