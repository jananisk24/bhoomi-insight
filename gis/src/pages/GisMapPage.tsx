import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Cpu, 
  SlidersHorizontal, 
  Compass, 
  Info,
  Maximize2,
  ZoomIn
} from 'lucide-react';
import { Project, ActivePage, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface GisMapPageProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNavigate: (page: ActivePage) => void;
}

export const GisMapPage: React.FC<GisMapPageProps> = ({
  projects,
  onSelectProject,
  onNavigate
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<Project | null>(projects[0] || null);

  // Initialize and update map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Karnataka State coordinates approx center [14.5, 76.0]
      const map = L.map(mapContainerRef.current, {
        center: [14.0, 76.0],
        zoom: 7,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Filter projects according to state
    const visibleProjects = projects.filter(
      (p) => filterRisk === 'All' || p.riskCategory === filterRisk
    );

    visibleProjects.forEach((project) => {
      const color =
        project.riskCategory === 'High'
          ? '#e11d48'
          : project.riskCategory === 'Medium'
          ? '#d97706'
          : '#059669';

      // Create distinctive SVG circle marker icon
      const customIcon = L.divIcon({
        className: 'custom-gis-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
            font-family: monospace;
          ">
            ${project.riskScore}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker(project.coordinates, { icon: customIcon }).addTo(map);

      // Popup Content satisfying prompt: Project Name, Risk Score, Risk Category
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-1';
      popupHtml.innerHTML = `
        <div style="font-family: inherit; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
            ${project.name}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
            ${project.district} • ${project.landArea} Acres
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 4px 6px; background: #f8fafc; border-radius: 6px;">
            <span style="font-size: 11px; font-weight: 600; color: #334155;">Risk Score:</span>
            <span style="font-size: 12px; font-weight: 800; font-family: monospace; color: ${color};">${project.riskScore}%</span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${color}; margin-bottom: 8px;">
            ● ${project.riskCategory} Risk Category
          </div>
        </div>
      `;

      // Add clickable inspect button inside popup
      const inspectBtn = document.createElement('button');
      inspectBtn.innerText = 'View Risk Breakdown';
      inspectBtn.style.cssText = `
        width: 100%;
        background: #2563eb;
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 8px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
      `;
      inspectBtn.onclick = () => {
        onSelectProject(project);
        onNavigate('prediction-result');
      };
      popupHtml.appendChild(inspectBtn);

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setActiveProject(project);
      });

      markersRef.current.push(marker);
    });

    return () => {
      // Keep map alive across standard renders, cleanup only on unmount
    };
  }, [projects, filterRisk, onSelectProject, onNavigate]);

  // Clean cleanup on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleCenterOnProject = (p: Project) => {
    setActiveProject(p);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(p.coordinates, 10, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-800">GIS Spatial Land Acquisition Map</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive geographic visualization of land parcels with color-coded risk markers
          </p>
        </div>

        {/* Filter on Map */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Show on Map:</span>
          {(['All', 'High', 'Medium', 'Low'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterRisk(cat)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterRisk === cat
                  ? cat === 'High'
                    ? 'bg-rose-600 text-white'
                    : cat === 'Medium'
                    ? 'bg-amber-600 text-white'
                    : cat === 'Low'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[580px]">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 h-full rounded-xl overflow-hidden border border-slate-200 shadow-xs relative bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Map Legend overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200/80 shadow-md text-xs space-y-1.5 z-20 pointer-events-auto">
            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
              Marker Delay Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white" />
              <span className="text-slate-700">High Delay Risk (&gt;70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
              <span className="text-slate-700">Medium Risk (40-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white" />
              <span className="text-slate-700">Low Risk (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Selected Project Card & Parcel Quick List */}
        <div className="h-full bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Parcels on Map ({projects.filter((p) => filterRisk === 'All' || p.riskCategory === filterRisk).length})
            </h2>
            <p className="text-[11px] text-slate-500">Click a project to fly to location</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {projects
              .filter((p) => filterRisk === 'All' || p.riskCategory === filterRisk)
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleCenterOnProject(p)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    activeProject?.id === p.id
                      ? 'bg-blue-50 border-blue-400 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 line-clamp-1">{p.name}</span>
                    <span className="font-mono font-bold text-slate-700 ml-1">{p.riskScore}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{p.district}</span>
                    <RiskBadge category={p.riskCategory} size="sm" />
                  </div>
                </div>
              ))}
          </div>

          {/* Active project card footer */}
          {activeProject && (
            <div className="p-3 border-t border-slate-200 bg-slate-50/70">
              <div className="text-[11px] font-semibold text-blue-600">Selected Marker:</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">{activeProject.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {activeProject.landArea} Acres • {activeProject.status}
              </div>
              <button
                id="btn-gis-inspect-active"
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
