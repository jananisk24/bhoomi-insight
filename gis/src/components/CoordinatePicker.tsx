import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { formatCoordinates, type Coordinates } from '../utils/coordinates';

interface CoordinatePickerProps {
  coordinates: Coordinates | null;
  onSelect: (coordinates: Coordinates) => void;
}

export const CoordinatePicker: React.FC<CoordinatePickerProps> = ({
  coordinates,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: coordinates ?? [22.5, 78.9],
      zoom: coordinates ? 12 : 4,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      onSelectRef.current(
        formatCoordinates(event.latlng.lat, event.latlng.lng)
      );
    });
    mapRef.current = map;

    if (coordinates) {
      markerRef.current = L.marker(coordinates).addTo(map);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();
    markerRef.current = null;
    if (coordinates) {
      markerRef.current = L.marker(coordinates).addTo(map);
    }
  }, [coordinates]);

  return (
    <div>
      <div
        ref={containerRef}
        aria-label="Select project coordinates by clicking the map"
        className="h-56 w-full rounded-lg border border-slate-300"
      />
      <p className="mt-1 text-[11px] text-slate-500">
        Click the map to set the project location. The initial India view is
        approximate only and is never saved as project coordinates.
      </p>
    </div>
  );
};
