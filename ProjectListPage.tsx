import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Cpu, 
  SlidersHorizontal, 
  LandPlot,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Project, ActivePage, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ALL_STATES, getDistrictsForState } from '../data/geoData';
import { exportProjectsCSV, exportExecutiveAssessment } from '../utils/exportReport';

interface ProjectListPageProps {
  projects: Project[];
  onNavigate: (page: ActivePage) => void;
  onSelectProjectForPrediction: (project: Project) => void;
  onSelectProjectForSimulation: (project: Project) => void;
}

export const ProjectListPage: React.FC<ProjectListPageProps> = ({
  projects,
  onNavigate,
  onSelectProjectForPrediction,
  onSelectProjectForSimulation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'riskScore' | 'landArea' | 'name'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Cascading districts list based on selected state
  const availableDistricts = useMemo(() => {
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  // Handle State Change: reset district if not in new state
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('All Districts');
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search filter
        const matchesSearch = 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.projectType.toLowerCase().includes(searchTerm.toLowerCase());

        // State filter
        const matchesState = 
          selectedState === 'All States' || p.state.toLowerCase() === selectedState.toLowerCase();

        // District filter
        const matchesDistrict = 
          selectedDistrict === 'All Districts' || p.district.toLowerCase() === selectedDistrict.toLowerCase();

        // Risk Category filter
        const matchesCategory = 
          selectedCategory === 'All' || p.riskCategory === selectedCategory;

        return matchesSearch && matchesState && matchesDistrict && matchesCategory;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'riskScore') comp = a.riskScore - b.riskScore;
        else if (sortBy === 'landArea') comp = a.landArea - b.landArea;
        else comp = a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [projects, searchTerm, selectedState, selectedDistrict, selectedCategory, sortBy, sortOrder]);

  const toggleSort = (field: 'riskScore' | 'landArea' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedState('All States');
    setSelectedDistrict('All Districts');
    setSelectedCategory('All');
  };

  const handleExportCSV = () => {
    const filename = `land_delay_report_${selectedState.replace(/\s+/g, '_').toLowerCase()}.csv`;
    exportProjectsCSV(filteredProjects, filename);
    setExportSuccessMsg(`Exported ${filteredProjects.length} projects to ${filename}`);
    setTimeout(() => setExportSuccessMsg(null), 3500);
  };

  const handleExportBrief = () => {
    exportExecutiveAssessment(filteredProjects, selectedState, selectedDistrict);
    setExportSuccessMsg(`Executive Delay Audit downloaded successfully.`);
    setTimeout(() => setExportSuccessMsg(null), 3500);
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedState !== 'All States' || 
    selectedDistrict !== 'All Districts' || 
    selectedCategory !== 'All';

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <LandPlot className="w-5 h-5 text-blue-600 shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-slate-800">
              State Land Acquisition Inventory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor clearance milestones, legal disputes, and predicted delay probabilities for {projects.length} parcels
          </p>
        </div>

        {/* Action Buttons: Export Report & Register */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Report Options */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer min-h-[40px]"
              title="Download CSV spreadsheet of filtered projects"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              id="btn-export-summary"
              onClick={handleExportBrief}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer min-h-[40px]"
              title="Download Executive Assessment Brief"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Report</span>
            </button>
          </div>

          <button
            id="btn-list-add-new"
            onClick={() => onNavigate('add-project')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Register Project</span>
          </button>
        </div>
      </div>

      {/* Export Success Notification Toast */}
      {exportSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
          <button
            onClick={() => setExportSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar (Responsive M1/Mobile Optimized) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              id="input-project-search"
              type="text"
              placeholder="Search project name, district, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/60 min-h-[42px]"
            />
          </div>

          {/* State Filter */}
          <div className="lg:col-span-3">
            <label htmlFor="select-state-filter" className="sr-only">Filter by State</label>
            <div className="relative">
              <select
                id="select-state-filter"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              >
                <option value="All States">All States ({ALL_STATES.length})</option>
                {ALL_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* District Filter (Cascading) */}
          <div className="lg:col-span-3">
            <label htmlFor="select-district-filter" className="sr-only">Filter by District</label>
            <div className="relative">
              <select
                id="select-district-filter"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              >
                <option value="All Districts">
                  {selectedState === 'All States' ? 'All Districts' : `All ${selectedState} Districts`}
                </option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Switcher (Table vs Cards for M1/Mobile) */}
          <div className="flex items-center justify-end gap-1 sm:col-span-2 lg:col-span-2">
            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[36px] ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
                <span className="hidden xl:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[36px] ${
                  viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Mobile Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden xl:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Risk Category Pills & Reset Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Risk:</span>
            </span>
            {(['All', 'High', 'Medium', 'Low'] as const).map((cat) => (
              <button
                key={cat}
                id={`filter-btn-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[34px] ${
                  selectedCategory === cat
                    ? cat === 'High'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : cat === 'Medium'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : cat === 'Low'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} {cat !== 'All' && `(${projects.filter((p) => p.riskCategory === cat).length})`}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Scope Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <strong className="text-slate-800">{filteredProjects.length}</strong> of {projects.length} parcels
          {selectedState !== 'All States' && (
            <span> in <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{selectedState}</span></span>
          )}
          {selectedDistrict !== 'All Districts' && (
            <span> • <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{selectedDistrict}</span></span>
          )}
        </div>
        <div className="hidden sm:block text-slate-400">
          Sorted by: <span className="capitalize font-medium text-slate-600">{sortBy}</span> ({sortOrder})
        </div>
      </div>

      {/* M1 Responsive View: Table Mode */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1.5">
                      <span>Project Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">State &amp; District</th>
                  <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('landArea')}>
                    <div className="flex items-center gap-1.5">
                      <span>Land Area</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('riskScore')}>
                    <div className="flex items-center gap-1.5">
                      <span>Risk Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Risk Category</th>
                  <th className="px-4 py-3.5">Current Status</th>
                  <th className="px-4 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">No projects found matching the filter</p>
                        <p className="text-[11px] text-slate-400">Try adjusting the State or District dropdowns, or clear the search query.</p>
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{project.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">{project.id}</span>
                          <span>{project.projectType}</span>
                          {project.legalDispute && (
                            <span className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded text-[10px] font-semibold">
                              Court Stay
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{project.district}</div>
                        <div className="text-[11px] text-slate-400">{project.state}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        <div className="font-semibold">{project.landArea} Acres</div>
                        <div className="text-[10px] text-slate-400">{project.affectedFamilies} PAFs</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                project.riskScore >= 70
                                  ? 'bg-rose-500'
                                  : project.riskScore >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${project.riskScore}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800">{project.riskScore}%</span>
                        </div>
                        {project.estimatedDelayMonths > 0 && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                            ~{project.estimatedDelayMonths} mos delay
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskBadge category={project.riskCategory} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            project.status === 'Severely Delayed'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : project.status === 'Moderate Delay'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : project.status === 'On Track'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-pred-${project.id}`}
                            title="View Predictive Delay Report"
                            onClick={() => {
                              onSelectProjectForPrediction(project);
                              onNavigate('prediction-result');
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer min-h-[32px]"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Prediction</span>
                          </button>
                          <button
                            id={`btn-sim-${project.id}`}
                            title="Simulate in What-If Sandbox"
                            onClick={() => {
                              onSelectProjectForSimulation(project);
                              onNavigate('what-if');
                            }}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-map-${project.id}`}
                            title="View on GIS Map"
                            onClick={() => onNavigate('gis-map')}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Showing {filteredProjects.length} of {projects.length} total registered infrastructure projects</span>
            <span className="text-[11px] text-slate-400">Data automatically aligned with RFCTLARR 2013 provisions</span>
          </div>
        </div>
      ) : (
        /* M1 Responsive View: Mobile/Compact Cards Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
              <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No projects match the current state/district filters.</p>
              <button
                onClick={handleResetFilters}
                className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={`card-${project.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {project.id}
                    </span>
                    <RiskBadge category={project.riskCategory} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{project.name}</h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{project.district}, {project.state}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Area &amp; PAFs</span>
                      <div className="font-semibold text-slate-800">{project.landArea} Ac • {project.affectedFamilies} PAFs</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Risk Score</span>
                      <div className="font-bold text-slate-800 font-mono flex items-center gap-1">
                        <span>{project.riskScore}%</span>
                        {project.estimatedDelayMonths > 0 && (
                          <span className="text-[10px] text-rose-600 font-medium">
                            (~{project.estimatedDelayMonths}m)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {project.legalDispute && (
                    <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Active High Court Litigation Stay</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    project.status === 'Severely Delayed' ? 'bg-rose-100 text-rose-800' :
                    project.status === 'Moderate Delay' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {project.status}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onSelectProjectForPrediction(project);
                        onNavigate('prediction-result');
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Cpu className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectProjectForSimulation(project);
                        onNavigate('what-if');
                      }}
                      className="p-1.5 bg-slate-100 text-slate-700 hover:bg-amber-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Simulate"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigate('gis-map')}
                      className="p-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
