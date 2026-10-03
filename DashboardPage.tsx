import React, { useState, useMemo } from 'react';
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
  Scale,
  FileSpreadsheet,
  FileText,
  Filter,
  Check
} from 'lucide-react';
import { Project, ActivePage } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ALL_STATES, getDistrictsForState } from '../data/geoData';
import { exportProjectsCSV, exportExecutiveAssessment } from '../utils/exportReport';

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
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const availableDistricts = useMemo(() => {
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('All Districts');
  };

  // Filter projects by selected state & district
  const scopedProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchState = selectedState === 'All States' || p.state.toLowerCase() === selectedState.toLowerCase();
      const matchDistrict = selectedDistrict === 'All Districts' || p.district.toLowerCase() === selectedDistrict.toLowerCase();
      return matchState && matchDistrict;
    });
  }, [projects, selectedState, selectedDistrict]);

  const totalProjects = scopedProjects.length;
  const highRiskProjects = scopedProjects.filter((p) => p.riskCategory === 'High').length;
  const mediumRiskProjects = scopedProjects.filter((p) => p.riskCategory === 'Medium').length;
  const lowRiskProjects = scopedProjects.filter((p) => p.riskCategory === 'Low').length;

  const totalAcres = scopedProjects.reduce((acc, p) => acc + p.landArea, 0);
  const totalFamilies = scopedProjects.reduce((acc, p) => acc + p.affectedFamilies, 0);
  const disputeCount = scopedProjects.filter((p) => p.legalDispute).length;
  const totalBudget = scopedProjects.reduce((acc, p) => acc + p.budgetCr, 0);
  const avgRiskScore = Math.round(
    scopedProjects.reduce((acc, p) => acc + p.riskScore, 0) / (scopedProjects.length || 1)
  );

  const recentProjects = [...scopedProjects].slice(0, 5);

  const handleExportCSV = () => {
    exportProjectsCSV(scopedProjects, `executive_dashboard_${selectedState.replace(/\s+/g, '_').toLowerCase()}.csv`);
    setExportNotice(`Exported ${scopedProjects.length} parcel records to CSV.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportAssessment = () => {
    exportExecutiveAssessment(scopedProjects, selectedState, selectedDistrict);
    setExportNotice(`Executive Delay Audit downloaded successfully.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <LandPlot className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-blue-200 text-xs font-semibold mb-3 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Operational Land Delay Monitoring System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Early Detection of Land Acquisition Delays
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Rule-based weighted risk analytics to predict bottlenecks in compensation disbursement,
            court litigation stays, and environmental approvals before critical project deadlines slip.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-4">
            <button
              id="btn-dash-add-proj"
              onClick={() => onNavigate('add-project')}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>Register & Predict Project</span>
            </button>
            <button
              id="btn-dash-what-if"
              onClick={() => onNavigate('what-if')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer min-h-[38px]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Simulate Scenarios</span>
            </button>
            <button
              id="btn-dash-gis-map"
              onClick={() => onNavigate('gis-map')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer min-h-[38px]"
            >
              <Compass className="w-4 h-4" />
              <span>View GIS Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* State & District Filter Bar + Export Report Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Jurisdiction Scope:</span>
          </div>

          {/* State Filter Dropdown */}
          <div className="min-w-[170px]">
            <select
              id="dash-state-filter"
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[38px]"
            >
              <option value="All States">All States ({ALL_STATES.length})</option>
              {ALL_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Filter Dropdown (Cascading) */}
          <div className="min-w-[180px]">
            <select
              id="dash-district-filter"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[38px]"
            >
              <option value="All Districts">
                {selectedState === 'All States' ? 'All Districts' : `All ${selectedState} Districts`}
              </option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {(selectedState !== 'All States' || selectedDistrict !== 'All Districts') && (
            <button
              onClick={() => {
                setSelectedState('All States');
                setSelectedDistrict('All Districts');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 hover:bg-rose-50 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Export Report Actions */}
        <div className="flex items-center gap-2">
          <button
            id="dash-export-csv-btn"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer min-h-[38px]"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            id="dash-export-report-btn"
            onClick={handleExportAssessment}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer min-h-[38px]"
            title="Download Executive Assessment Brief"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Toast */}
      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {/* 4 Primary Summary Cards Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div 
          id="summary-card-total"
          onClick={() => onNavigate('projects')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Parcels</span>
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
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Avg Delay Risk</div>
            <div className="text-base font-bold text-slate-800 font-mono">{avgRiskScore}%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <LandPlot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Land Tracked</div>
            <div className="text-base font-bold text-slate-800 font-mono">{totalAcres.toLocaleString()} Ac</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Affected Families</div>
            <div className="text-base font-bold text-slate-800 font-mono">{totalFamilies.toLocaleString()} PAFs</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Court Injunctions</div>
            <div className="text-base font-bold text-slate-800 font-mono">{disputeCount} Parcels</div>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Active Monitored Projects {selectedState !== 'All States' ? `(${selectedState})` : ''}
            </h2>
            <p className="text-xs text-slate-500">
              Newly registered acquisitions and high-priority infrastructure parcels
            </p>
          </div>
          <button
            id="btn-view-all-projects"
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Directory ({scopedProjects.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">State &amp; District</th>
                <th className="px-4 py-3">Land Area</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Risk Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No projects found for {selectedDistrict !== 'All Districts' ? selectedDistrict : selectedState}.
                  </td>
                </tr>
              ) : (
                recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{project.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{project.id} • {project.projectType}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{project.district}</div>
                      <div className="text-[10px] text-slate-400">{project.state}</div>
                    </td>
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
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer min-h-[32px]"
                      >
                        Analyze Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
