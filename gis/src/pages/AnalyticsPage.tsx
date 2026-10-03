import React from 'react';
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  LandPlot, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';
import { Project } from '../types';

interface AnalyticsPageProps {
  projects: Project[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ projects }) => {
  // 1. Risk Category Distribution Data
  const highCount = projects.filter((p) => p.riskCategory === 'High').length;
  const medCount = projects.filter((p) => p.riskCategory === 'Medium').length;
  const lowCount = projects.filter((p) => p.riskCategory === 'Low').length;

  const riskDistributionData = [
    { name: 'High Risk', value: highCount, color: '#f43f5e' },
    { name: 'Medium Risk', value: medCount, color: '#f59e0b' },
    { name: 'Low Risk', value: lowCount, color: '#10b981' }
  ];

  // 2. District-wise Projects Data
  const districtMap: Record<string, { total: number; highRisk: number; acres: number }> = {};
  projects.forEach((p) => {
    if (!districtMap[p.district]) {
      districtMap[p.district] = { total: 0, highRisk: 0, acres: 0 };
    }
    districtMap[p.district].total += 1;
    if (p.riskCategory === 'High') districtMap[p.district].highRisk += 1;
    districtMap[p.district].acres += p.landArea;
  });

  const districtData = Object.entries(districtMap).map(([district, data]) => ({
    district: district.replace('Bengaluru', 'Blr'),
    totalProjects: data.total,
    highRisk: data.highRisk,
    acres: data.acres
  }));

  // 3. Delay Trend Chart Data (Quarterly Historical vs Forecasted Delays in months)
  const delayTrendData = [
    { quarter: 'Q1 2025', avgDelayMonths: 2.1, resolvedCases: 12, forecastedDelay: 2.4 },
    { quarter: 'Q2 2025', avgDelayMonths: 3.5, resolvedCases: 15, forecastedDelay: 3.8 },
    { quarter: 'Q3 2025', avgDelayMonths: 5.2, resolvedCases: 9, forecastedDelay: 5.0 },
    { quarter: 'Q4 2025', avgDelayMonths: 6.8, resolvedCases: 7, forecastedDelay: 6.5 },
    { quarter: 'Q1 2026', avgDelayMonths: 8.4, resolvedCases: 6, forecastedDelay: 7.9 },
    { quarter: 'Q2 2026 (Pred)', avgDelayMonths: 9.1, resolvedCases: 14, forecastedDelay: 8.8 }
  ];

  const totalAcresAtRisk = projects
    .filter((p) => p.riskCategory === 'High')
    .reduce((acc, p) => acc + p.landArea, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">State Acquisition Analytics & Trends</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Macro statistical overview of delay concentrations across districts, risk profiles, and quarterly timelines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Land Tracked</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {projects.reduce((a, b) => a + b.landArea, 0).toLocaleString()} Acres
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 Metric Summary Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">High Risk Land In Jeopardy</div>
            <div className="text-xl font-bold text-rose-600 font-mono">{totalAcresAtRisk.toLocaleString()} Acres</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across {highCount} critical stalled projects</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Average Forecasted Overrun</div>
            <div className="text-xl font-bold text-amber-600 font-mono">5.8 Months</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Without proactive administrative intervention</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <LandPlot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Primary Bottleneck Driver</div>
            <div className="text-sm font-bold text-slate-800">Compensation Injunctions</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Accounts for 42% of total delay weight</div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Risk Category Distribution (Donut Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Risk Category Distribution
              </h2>
              <p className="text-[11px] text-slate-500">Share of high, medium, and low risk parcels</p>
            </div>
            <PieIcon className="w-4 h-4 text-blue-600" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number | string | undefined) => [`${val} Projects`, 'Count']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around pt-3 border-t border-slate-100 text-xs">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-mono font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: District-wise Projects (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                District-Wise Acquisition Projects
              </h2>
              <p className="text-[11px] text-slate-500">Total volume and critical high-risk breakdown by jurisdiction</p>
            </div>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="totalProjects" name="Total Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highRisk" name="High Risk Parcels" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Delay Trend Chart across Quarters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quarterly Delay Duration Trend &amp; Forecast (Months)
            </h2>
            <p className="text-[11px] text-slate-500">
              Observed escalation in average acquisition delay over successive project monitoring cycles
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={delayTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area 
                type="monotone" 
                dataKey="avgDelayMonths" 
                name="Average Actual Delay (Months)" 
                stroke="#2563eb" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDelay)" 
              />
              <Line 
                type="monotone" 
                dataKey="forecastedDelay" 
                name="Predictive Forecast (Months)" 
                stroke="#d97706" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
