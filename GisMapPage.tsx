import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Cpu, 
  SlidersHorizontal, 
  Compass, 
  Info,
  Maximize2,
  ZoomIn,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Project, ActivePage, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ALL_STATES, getDistrictsForState, getStateCoordinates } from '../data/geoData';

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

  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<Project | null>(projects[0] || null);

  const availableDistricts = useMemo(() => {
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('All Districts');

    // Pan map to selected state
    if (mapInstanceRef.current) {
      if (state === 'All States') {
        mapInstanceRef.current.setView([18.5, 76.5], 5);
      } else {
        const coords = getStateCoordinates(state);
        if (coords) {
          mapInstanceRef.current.setView(coords, 7);
        }
      }
    }
  };

  // Filter projects according to state, district, and risk
  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchState = selectedState === 'All States' || p.state.toLowerCase() === selectedState.toLowerCase();
      const matchDistrict = selectedDistrict === 'All Districts' || p.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchRisk = filterRisk === 'All' || p.riskCategory === filterRisk;
      return matchState && matchDistrict && matchRisk;
    });
  }, [projects, selectedState, selectedDistrict, filterRisk]);

  // Initialize and update map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [18.5, 76.5],
        zoom: 6,
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

      // Popup Content: Project Name, Risk Score, Risk Category
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-1';
      popupHtml.innerHTML = `
        <div style="font-family: inherit; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
            ${project.name}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
            ${project.district}, ${project.state} • ${project.projectType}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 10px; font-weight: 600; color: ${color};">
              Risk: ${project.riskScore}% (${project.riskCategory})
            </span>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #475569;">
              ${project.landArea} Ac
            </span>
          </div>
          <button 
            id="popup-btn-${project.id}" 
            style="
              width: 100%;
              padding: 6px;
              background-color: #2563eb;
              color: white;
              font-size: 10px;
              font-weight: 600;
              border-radius: 6px;
              border: none;
              cursor: pointer;
            "
          >
            Inspect Breakdown
          </button>
        </div>
      `;

      // Attach click handler to popup button
      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${project.id}`);
        if (btn) {
          btn.onclick = () => {
            setActiveProject(project);
            onSelectProject(project);
          };
        }
      });

      marker.on('click', () => {
        setActiveProject(project);
      });

      markersRef.current.push(marker);
    });

    // If projects are visible and state/district changed, fit bounds
    if (visibleProjects.length > 0 && (selectedState !== 'All States' || selectedDistrict !== 'All Districts')) {
      const bounds = L.latLngBounds(visibleProjects.map((p) => p.coordinates));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [visibleProjects, selectedState, selectedDistrict]);

  return (
    <div className="space-y-4">
      {/* Top Map Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>GIS Map Filters:</span>
          </div>

          {/* State Filter */}
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

          {/* District Filter */}
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

          {/* Risk Filter */}
          <div className="flex items-center gap-1">
            {(['All', 'High', 'Medium', 'Low'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors cursor-pointer ${
                  filterRisk === r
                    ? r === 'High'
                      ? 'bg-rose-600 text-white'
                      : r === 'Medium'
                      ? 'bg-amber-600 text-white'
                      : r === 'Low'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {(selectedState !== 'All States' || selectedDistrict !== 'All Districts' || filterRisk !== 'All') && (
            <button
              onClick={() => {
                setSelectedState('All States');
                setSelectedDistrict('All Districts');
                setFilterRisk('All');
                if (mapInstanceRef.current) mapInstanceRef.current.setView([18.5, 76.5], 6);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{visibleProjects.length}</strong> geocoded parcels
        </div>
      </div>

      {/* Main Map + Side Details Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-[420px] sm:h-[520px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Floating Legend */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5 pointer-events-auto">
            <div className="font-bold text-slate-800 text-[11px] mb-1">Risk Classification</div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white inline-block shadow-xs" />
              <span className="text-slate-700 font-medium">High Risk (Score &gt; 70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white inline-block shadow-xs" />
              <span className="text-slate-700 font-medium">Medium Risk (Score 40-69)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white inline-block shadow-xs" />
              <span className="text-slate-700 font-medium">Low Risk (Score &lt; 40)</span>
            </div>
          </div>
        </div>

        {/* Selected Project Details Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {activeProject ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {activeProject.id}
                </span>
                <RiskBadge category={activeProject.riskCategory} size="sm" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{activeProject.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeProject.district}, {activeProject.state}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Land Area</span>
                  <div className="font-bold text-slate-800">{activeProject.landArea} Acres</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Affected Families</span>
                  <div className="font-bold text-slate-800">{activeProject.affectedFamilies} PAFs</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Budget</span>
                  <div className="font-bold text-slate-800">₹ {activeProject.budgetCr} Cr</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Delay Risk</span>
                  <div className="font-bold text-slate-800 font-mono text-rose-600">{activeProject.riskScore}%</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    onSelectProject(activeProject);
                    onNavigate('prediction-result');
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 min-h-[38px] transition-colors cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>View Detailed Risk Breakdown</span>
                </button>
                <button
                  onClick={() => {
                    onSelectProject(activeProject);
                    onNavigate('what-if');
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[38px] transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Simulate What-If Scenarios</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Click on any marker on the map to inspect project parameters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
