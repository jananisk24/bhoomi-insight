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
  Legend
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
  const unpredictedCount = projects.filter(
    (project) => project.riskScore === null
  ).length;
  const uniqueRiskScores = new Map<string, number | null>(
    projects.map(
      (project): [string, number | null] => [project.id, project.riskScore]
    )
  );
  const validRiskScores = [...uniqueRiskScores.values()].filter(
    (score): score is number =>
      score !== null && Number.isFinite(score) && score >= 0 && score <= 100
  );
  const averageRisk = validRiskScores.length
    ? validRiskScores.reduce((total, score) => total + score, 0) /
      validRiskScores.length
    : null;

  const riskDistributionData = [
    { name: 'High Risk', value: highCount, color: '#f43f5e' },
    { name: 'Medium Risk', value: medCount, color: '#f59e0b' },
    { name: 'Low Risk', value: lowCount, color: '#10b981' },
    { name: 'Not Predicted', value: unpredictedCount, color: '#64748b' }
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

  const stageNames = [
    'Planning',
    'Approval',
    'Compensation',
    'Rehabilitation',
    'Possession',
  ] as const;
  const stageRiskData = stageNames.flatMap((stage) => {
    const scores = projects
      .map((project) => project.stageRisk?.[stage]?.score)
      .filter(
        (score): score is number =>
          score !== undefined &&
          Number.isFinite(score) &&
          score >= 0 &&
          score <= 100
      );
    return scores.length
      ? [{ stage, averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length }]
      : [];
  });
  const highestRiskStageCounts = new Map<string, number>();
  projects.forEach((project) => {
    if (project.highestRiskStage) {
      highestRiskStageCounts.set(
        project.highestRiskStage,
        (highestRiskStageCounts.get(project.highestRiskStage) ?? 0) + 1
      );
    }
  });
  const primaryBottleneck = [...highestRiskStageCounts.entries()].sort(
    (left, right) => right[1] - left[1]
  )[0];

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
            <div className="text-xs font-semibold text-slate-500">Average Saved Delay Risk</div>
            <div className="text-xl font-bold text-amber-600 font-mono">
              {averageRisk === null ? 'N/A' : `${averageRisk.toFixed(2)}%`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Mean saved model probability across {validRiskScores.length} predicted projects
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <LandPlot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Primary Bottleneck Driver</div>
            <div className="text-sm font-bold text-slate-800">
              {primaryBottleneck?.[0] ?? 'Not available'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {primaryBottleneck
                ? `Highest-risk stage for ${primaryBottleneck[1]} projects`
                : 'No saved stage-risk predictions'}
            </div>
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
              Average Operational Risk by Acquisition Stage
            </h2>
            <p className="text-[11px] text-slate-500">
              Mean of saved stage-risk scores; unmeasured stages are omitted
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageRiskData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="averageScore" name="Average risk score" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
