import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Cpu, 
  SlidersHorizontal, 
  LandPlot,
  ArrowUpDown
} from 'lucide-react';
import { Project, ActivePage, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'riskScore' | 'landArea' | 'name'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.projectType.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = 
          selectedCategory === 'All' || p.riskCategory === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'riskScore') comp = a.riskScore - b.riskScore;
        else if (sortBy === 'landArea') comp = a.landArea - b.landArea;
        else comp = a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [projects, searchTerm, selectedCategory, sortBy, sortOrder]);

  const toggleSort = (field: 'riskScore' | 'landArea' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <LandPlot className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">State Land Acquisition Inventory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor clearance milestones, legal disputes, and predicted delay probabilities for {projects.length} parcels
          </p>
        </div>
        <button
          id="btn-list-add-new"
          onClick={() => onNavigate('add-project')}
          className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-project-search"
            type="text"
            placeholder="Search by project name, district, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Risk:</span>
          </div>
          {(['All', 'High', 'Medium', 'Low'] as const).map((cat) => (
            <button
              key={cat}
              id={`filter-btn-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
      </div>

      {/* Main Table */}
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
                <th className="px-4 py-3.5">District</th>
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
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No projects found matching the filter criteria.
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
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-map-${project.id}`}
                          title="View on GIS Map"
                          onClick={() => onNavigate('gis-map')}
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
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
          <span className="text-[11px] text-slate-400">Data automatically validated against RFCTLARR 2013 provisions</span>
        </div>
      </div>
    </div>
  );
};
