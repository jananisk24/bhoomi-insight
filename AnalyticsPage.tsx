import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  LandPlot, 
  FileSpreadsheet,
  FileText,
  Filter
} from 'lucide-react';
import { Project } from '../types';
import { ALL_STATES, getDistrictsForState } from '../data/geoData';
import { exportProjectsCSV, exportExecutiveAssessment } from '../utils/exportReport';

interface AnalyticsPageProps {
  projects: Project[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ projects }) => {
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');

  const availableDistricts = useMemo(() => {
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('All Districts');
  };

  const scopedProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchState = selectedState === 'All States' || p.state.toLowerCase() === selectedState.toLowerCase();
      const matchDistrict = selectedDistrict === 'All Districts' || p.district.toLowerCase() === selectedDistrict.toLowerCase();
      return matchState && matchDistrict;
    });
  }, [projects, selectedState, selectedDistrict]);

  // 1. Risk Category Distribution Data
  const highCount = scopedProjects.filter((p) => p.riskCategory === 'High').length;
  const medCount = scopedProjects.filter((p) => p.riskCategory === 'Medium').length;
  const lowCount = scopedProjects.filter((p) => p.riskCategory === 'Low').length;

  const riskDistributionData = [
    { name: 'High Risk', value: highCount, color: '#f43f5e' },
    { name: 'Medium Risk', value: medCount, color: '#f59e0b' },
    { name: 'Low Risk', value: lowCount, color: '#10b981' }
  ];

  // 2. District-wise Projects Data
  const districtMap: Record<string, { total: number; highRisk: number; acres: number }> = {};
  scopedProjects.forEach((p) => {
    if (!districtMap[p.district]) {
      districtMap[p.district] = { total: 0, highRisk: 0, acres: 0 };
    }
    districtMap[p.district].total += 1;
    if (p.riskCategory === 'High') districtMap[p.district].highRisk += 1;
    districtMap[p.district].acres += p.landArea;
  });

  const districtData = Object.entries(districtMap).map(([district, data]) => ({
    name: district.length > 12 ? `${district.substring(0, 10)}..` : district,
    fullName: district,
    totalProjects: data.total,
    highRisk: data.highRisk,
    acres: data.acres
  }));

  // 3. State comparison data (when All States is active)
  const stateMap: Record<string, { total: number; highRisk: number; totalAcres: number }> = {};
  projects.forEach((p) => {
    if (!stateMap[p.state]) {
      stateMap[p.state] = { total: 0, highRisk: 0, totalAcres: 0 };
    }
    stateMap[p.state].total += 1;
    if (p.riskCategory === 'High') stateMap[p.state].highRisk += 1;
    stateMap[p.state].totalAcres += p.landArea;
  });

  const stateData = Object.entries(stateMap).map(([state, d]) => ({
    name: state,
    fullName: state,
    totalProjects: d.total,
    highRisk: d.highRisk,
    acres: d.totalAcres
  }));

  // 4. Delay Factor Averages
  const avgCompensation = Math.round(
    scopedProjects.reduce((acc, p) => acc + p.delayFactors.compensationPending, 0) / (scopedProjects.length || 1)
  );
  const avgLegal = Math.round(
    scopedProjects.reduce((acc, p) => acc + p.delayFactors.legalDispute, 0) / (scopedProjects.length || 1)
  );
  const avgApproval = Math.round(
    scopedProjects.reduce((acc, p) => acc + p.delayFactors.approvalDelay, 0) / (scopedProjects.length || 1)
  );
  const avgRehab = Math.round(
    scopedProjects.reduce((acc, p) => acc + p.delayFactors.rehabilitationGap, 0) / (scopedProjects.length || 1)
  );

  const factorData = [
    { factor: 'Compensation', score: avgCompensation, fill: '#ef4444' },
    { factor: 'Court Litigation', score: avgLegal, fill: '#f97316' },
    { factor: 'Clearances', score: avgApproval, fill: '#eab308' },
    { factor: 'Resettlement Gap', score: avgRehab, fill: '#3b82f6' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Analytics Filters:</span>
          </div>

          <div className="min-w-[160px]">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[38px]"
            >
              <option value="All States">All States ({ALL_STATES.length})</option>
              {ALL_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[170px]">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[38px]"
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
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportProjectsCSV(scopedProjects, `analytics_report_${selectedState.toLowerCase()}.csv`)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 min-h-[36px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportExecutiveAssessment(scopedProjects, selectedState, selectedDistrict)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-200 min-h-[36px]"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Audit Report</span>
          </button>
        </div>
      </div>

      {/* Grid of Statistical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Risk Category Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-blue-600" />
                <span>Delay Risk Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">Parcels classified by predicted delay severity</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
              {scopedProjects.length} Projects
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span>High ({highCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span>Medium ({medCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>Low ({lowCount})</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Average Delay Factor Contributions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Delay Bottleneck Contributions</span>
              </h3>
              <p className="text-xs text-slate-500">Average impact % across monitored parameters</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="factor" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}% impact`, 'Weight']} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {factorData.map((entry, idx) => (
                    <Cell key={`factor-cell-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: District / State Comparison */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <LandPlot className="w-4 h-4 text-blue-600" />
                <span>
                  {selectedState === 'All States' ? 'Inter-State Infrastructure & Delay Comparison' : `${selectedState} District-Wise Risk Assessment`}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Total registered projects vs. critical delay parcels</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={selectedState === 'All States' ? stateData : districtData}
                margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="totalProjects" name="Total Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highRisk" name="High Risk Parcels" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
