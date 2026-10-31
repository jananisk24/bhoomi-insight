import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Cpu } from 'lucide-react';
import { Project, ActivePage } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface GisMapPageProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNavigate: (page: ActivePage) => void;
}

type RiskFilter = 'All' | 'High' | 'Medium' | 'Low' | 'Not Predicted';

const hasValidCoordinates = (
  coordinates: Project['coordinates']
): coordinates is [number, number] =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  Number.isFinite(coordinates[0]) &&
  Number.isFinite(coordinates[1]) &&
  coordinates[0] >= -90 &&
  coordinates[0] <= 90 &&
  coordinates[1] >= -180 &&
  coordinates[1] <= 180;

const getRiskColor = (category: Project['riskCategory']): string => {
  switch (category) {
    case 'High':
      return '#e11d48';
    case 'Medium':
      return '#d97706';
    case 'Low':
      return '#059669';
    default:
      return '#64748b';
  }
};

const createPopupContent = (
  project: Project,
  color: string,
  onInspect: () => void
): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'p-1';

  const details = document.createElement('div');
  details.style.cssText = 'font-family: inherit; min-width: 180px;';

  const name = document.createElement('div');
  name.textContent = project.name;
  name.style.cssText =
    'font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 2px;';

  const location = document.createElement('div');
  location.textContent = `${project.district} • ${Number(project.landArea).toFixed(2)} Acres`;
  location.style.cssText =
    'font-size: 10px; color: #64748b; margin-bottom: 6px;';

  const scoreRow = document.createElement('div');
  scoreRow.style.cssText =
    'display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 4px 6px; background: #f8fafc; border-radius: 6px;';

  const scoreLabel = document.createElement('span');
  scoreLabel.textContent = 'Risk Score:';
  scoreLabel.style.cssText =
    'font-size: 11px; font-weight: 600; color: #334155;';

  const scoreValue = document.createElement('span');
  scoreValue.textContent =
    project.riskScore == null ? 'N/A' : `${Math.round(project.riskScore)}%`;
  scoreValue.style.cssText =
    `font-size: 12px; font-weight: 800; font-family: monospace; color: ${color};`;

  scoreRow.append(scoreLabel, scoreValue);

  const category = document.createElement('div');
  category.textContent =
    project.riskCategory === 'Not Predicted'
      ? '● Not Predicted'
      : `● ${project.riskCategory} Risk Category`;
  category.style.cssText =
    `font-size: 11px; font-weight: 600; color: ${color}; margin-bottom: 8px;`;

  details.append(name, location, scoreRow, category);

  const inspectButton = document.createElement('button');
  inspectButton.type = 'button';
  inspectButton.textContent = 'View Risk Breakdown';
  inspectButton.style.cssText =
    'width: 100%; background: #2563eb; color: white; font-size: 11px; font-weight: 600; padding: 5px 8px; border-radius: 6px; border: none; cursor: pointer;';
  inspectButton.addEventListener('click', onInspect);

  container.append(details, inspectButton);
  return container;
};

export const GisMapPage: React.FC<GisMapPageProps> = ({
  projects,
  onSelectProject,
  onNavigate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [filterRisk, setFilterRisk] = useState<RiskFilter>('All');
  const [filterState, setFilterState] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [activeProject, setActiveProject] = useState<Project | null>(
    projects[0] ?? null
  );

  const filteredProjects = projects.filter(
    (project) =>
      (filterRisk === 'All' || project.riskCategory === filterRisk) &&
      (filterState === 'All' || project.state === filterState) &&
      (filterDistrict === 'All' || project.district === filterDistrict)
  );
  const states = [...new Set(projects.map((project) => project.state))].sort();
  const districts = [
    ...new Set(
      projects
        .filter((project) => filterState === 'All' || project.state === filterState)
        .map((project) => project.district)
    ),
  ].sort();
  const mappedProjects = filteredProjects.filter((project) =>
    hasValidCoordinates(project.coordinates)
  );

  // Create the map once. Project markers are refreshed in the next effect.
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [11.1271, 78.6569],
      zoom: 6,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Leaflet sometimes measures a hidden or not-yet-laid-out container.
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Refresh markers whenever projects or a selected filter changes.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    mappedProjects.forEach((project) => {
      if (!hasValidCoordinates(project.coordinates)) return;
      const color = getRiskColor(project.riskCategory);
      const scoreText =
        project.riskScore == null
          ? 'N/A'
          : String(Math.round(project.riskScore));

      // scoreText is numeric or the fixed text N/A; color comes from fixed constants.
      const customIcon = L.divIcon({
        className: 'custom-gis-pin',
        html: `<div style="background-color:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;font-family:monospace;">${scoreText}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker(project.coordinates, { icon: customIcon }).addTo(
        map
      );

      marker.bindPopup(
        createPopupContent(project, color, () => {
          onSelectProject(project);
          onNavigate('prediction-result');
        })
      );

      marker.on('click', () => setActiveProject(project));
      markersRef.current.push(marker);
    });
  }, [
    projects,
    filterRisk,
    filterState,
    filterDistrict,
    onSelectProject,
    onNavigate,
  ]);

  useEffect(() => {
    if (
      !activeProject ||
      !projects.some((project) => project.id === activeProject.id)
    ) {
      setActiveProject(projects[0] ?? null);
    }
  }, [projects, activeProject]);

  const handleCenterOnProject = (project: Project) => {
    setActiveProject(project);

    if (mapInstanceRef.current && hasValidCoordinates(project.coordinates)) {
      mapInstanceRef.current.flyTo(project.coordinates, 10, { duration: 1.2 });
    }
  };

  const riskFilters: RiskFilter[] = [
    'All',
    'High',
    'Medium',
    'Low',
    'Not Predicted',
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-800">
              GIS Spatial Land Acquisition Map
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic view of projects with verified coordinates and risk categories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Show on Map:
          </span>
          {riskFilters.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilterRisk(category)}
              aria-pressed={filterRisk === category}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterRisk === category
                  ? category === 'High'
                    ? 'bg-rose-600 text-white'
                    : category === 'Medium'
                      ? 'bg-amber-600 text-white'
                      : category === 'Low'
                        ? 'bg-emerald-600 text-white'
                        : category === 'Not Predicted'
                          ? 'bg-slate-600 text-white'
                          : 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
          <label className="sr-only" htmlFor="gis-state-filter">Filter by state</label>
          <select
            id="gis-state-filter"
            value={filterState}
            onChange={(event) => {
              setFilterState(event.target.value);
              setFilterDistrict('All');
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
          >
            <option value="All">All states</option>
            {states.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <label className="sr-only" htmlFor="gis-district-filter">Filter by district</label>
          <select
            id="gis-district-filter"
            value={filterDistrict}
            onChange={(event) => setFilterDistrict(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
          >
            <option value="All">All districts</option>
            {districts.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[580px]">
        <div className="lg:col-span-3 h-full rounded-xl overflow-hidden border border-slate-200 shadow-xs relative bg-slate-100">
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ zIndex: 1 }}
          />

          {filteredProjects.length > 0 && mappedProjects.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-lg border border-amber-200 bg-white/95 px-4 py-2 text-xs text-amber-800 shadow">
              No verified project coordinates available. Projects are listed
              without placing inaccurate markers.
            </div>
          )}

          {filteredProjects.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-xs text-slate-600 shadow">
              No projects match this risk filter.
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200/80 shadow-md text-xs space-y-1.5 z-20 pointer-events-auto">
            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
              Delay Risk Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white" />
              <span className="text-slate-700">High Risk (≥70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
              <span className="text-slate-700">Medium Risk (40–&lt;70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white" />
              <span className="text-slate-700">Low Risk (&lt;40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500 border border-white" />
              <span className="text-slate-700">Not Predicted</span>
            </div>
          </div>
        </div>

        <div className="h-full bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Projects ({mappedProjects.length} mapped)
            </h2>
            <p className="text-[11px] text-slate-500">
              {filteredProjects.length - mappedProjects.length} project(s)
              without verified coordinates are listed but not pinned.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredProjects.map((project) => {
              const hasCoordinates = hasValidCoordinates(project.coordinates);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleCenterOnProject(project)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    activeProject?.id === project.id
                      ? 'bg-blue-50 border-blue-400 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {project.name}
                    </span>
                    <span className="font-mono font-bold text-slate-700 shrink-0">
                      {project.riskScore == null
                        ? 'N/A'
                        : `${project.riskScore.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {project.district}
                      {!hasCoordinates && ' • Location unavailable'}
                    </span>
                    <RiskBadge category={project.riskCategory} size="sm" />
                  </div>
                </button>
              );
            })}

            {filteredProjects.length === 0 && (
              <p className="p-3 text-xs text-slate-500">
                No projects in this category.
              </p>
            )}
          </div>

          {activeProject && (
            <div className="p-3 border-t border-slate-200 bg-slate-50/70">
              <div className="text-[11px] font-semibold text-blue-600">
                Selected Project:
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {activeProject.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {Number(activeProject.landArea).toFixed(2)} Acres •{' '}
                {activeProject.status}
                {!hasValidCoordinates(activeProject.coordinates) &&
                  ' • No verified map coordinates'}
              </div>
              <button
                id="btn-gis-inspect-active"
                type="button"
                onClick={() => {
                  onSelectProject(activeProject);
                  onNavigate('prediction-result');
                }}
                className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Open Prediction Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
