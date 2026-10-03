import React from 'react';
import { 
  Layers, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Plus, 
  SlidersHorizontal, 
  Compass, 
  TrendingUp,
  LandPlot,
  Users,
  Scale
} from 'lucide-react';
import { Project, ActivePage } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface DashboardPageProps {
  projects: Project[];
  onNavigate: (page: ActivePage) => void;
  onSelectProjectForPrediction: (project: Project) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  onNavigate,
  onSelectProjectForPrediction
}) => {
  const totalProjects = projects.length;
  const highRiskProjects = projects.filter((p) => p.riskCategory === 'High').length;
  const mediumRiskProjects = projects.filter((p) => p.riskCategory === 'Medium').length;
  const lowRiskProjects = projects.filter((p) => p.riskCategory === 'Low').length;

  const totalAcres = projects.reduce((acc, p) => acc + p.landArea, 0);
  const totalFamilies = projects.reduce((acc, p) => acc + p.affectedFamilies, 0);
  const disputeCount = projects.filter((p) => p.legalDispute).length;
  const avgRiskScore = Math.round(
    projects.reduce((acc, p) => acc + p.riskScore, 0) / (projects.length || 1)
  );

  const recentProjects = [...projects].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <LandPlot className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-blue-200 text-xs font-semibold mb-3 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Operational Land Delay Monitoring</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Early Detection of Land Acquisition Delays
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Machine learning & rule-based weighted risk modeling to predict bottlenecks in compensation,
            court litigation, and statutory approvals before critical project deadlines slip.
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              id="btn-dash-add-proj"
              onClick={() => onNavigate('add-project')}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register & Predict Project</span>
            </button>
            <button
              id="btn-dash-what-if"
              onClick={() => onNavigate('what-if')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Simulate Scenarios</span>
            </button>
            <button
              id="btn-dash-gis-map"
              onClick={() => onNavigate('gis-map')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>View GIS Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Summary Cards Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div 
          id="summary-card-total"
          onClick={() => onNavigate('projects')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Projects</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">{totalProjects}</span>
            <span className="text-xs text-slate-500">Parcels</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-medium flex items-center gap-1">
            <span>View directory list</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* High Risk Projects */}
        <div 
          id="summary-card-high-risk"
          onClick={() => onNavigate('alerts')}
          className="bg-white rounded-xl p-5 border border-rose-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group bg-gradient-to-b from-white to-rose-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">High Risk Projects</span>
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono">{highRiskProjects}</span>
            <span className="text-xs font-medium text-rose-600">Immediate action needed</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-medium flex items-center gap-1">
            <span>Review delay warnings</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Medium Risk Projects */}
        <div 
          id="summary-card-medium-risk"
          onClick={() => onNavigate('projects')}
          className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group bg-gradient-to-b from-white to-amber-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Medium Risk</span>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-700 font-mono">{mediumRiskProjects}</span>
            <span className="text-xs text-amber-600 font-medium">Under observation</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <span>Track clearance stages</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Low Risk Projects */}
        <div 
          id="summary-card-low-risk"
          onClick={() => onNavigate('projects')}
          className="bg-white rounded-xl p-5 border border-emerald-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group bg-gradient-to-b from-white to-emerald-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Low Risk Projects</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono">{lowRiskProjects}</span>
            <span className="text-xs text-emerald-600 font-medium">On scheduled track</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <span>Inspect progress logs</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Quick Statistics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Avg Delay Risk</div>
            <div className="text-base font-bold text-slate-800 font-mono">{avgRiskScore}%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <LandPlot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Land Tracked</div>
            <div className="text-base font-bold text-slate-800 font-mono">{totalAcres.toLocaleString()} Acres</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Project Affected Families</div>
            <div className="text-base font-bold text-slate-800 font-mono">{totalFamilies.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Active Legal Disputes</div>
            <div className="text-base font-bold text-slate-800 font-mono">{disputeCount} Projects</div>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Recent Monitored Projects</h2>
            <p className="text-xs text-slate-500">Newly registered acquisitions and high-priority infrastructure tracks</p>
          </div>
          <button
            id="btn-view-all-projects"
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Directory ({totalProjects})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Land Area</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Risk Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div>{project.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{project.id} • {project.projectType}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{project.district}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{project.landArea} ac</td>
                  <td className="px-4 py-3 font-mono font-bold">
                    <span className={
                      project.riskScore >= 70 ? 'text-rose-600' :
                      project.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'
                    }>
                      {project.riskScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge category={project.riskCategory} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                      project.status === 'Severely Delayed' ? 'bg-rose-100 text-rose-800' :
                      project.status === 'Moderate Delay' ? 'bg-amber-100 text-amber-800' :
                      project.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      id={`btn-analyze-${project.id}`}
                      onClick={() => {
                        onSelectProjectForPrediction(project);
                        onNavigate('prediction-result');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Analyze Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
