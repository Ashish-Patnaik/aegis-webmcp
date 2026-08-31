"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

export interface Unit {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
}

export interface Hazard {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

interface MapComponentProps {
  units: Unit[];
  hazards: Hazard[];
  focusedCenter?: [number, number] | null;
}

function MapUpdater({ center }: { center?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.4 });
    }
  }, [center, map]);
  return null;
}

// Sticker-style divIcon markers: thick black outline, hard shadow, flat color fill
function makeUnitIcon(status: string) {
  const isHot = status === 'Trapped' || status === 'Code Red';
  const bg = isHot ? '#FF5A36' : '#2F6FED';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:34px;height:34px;
        background:${bg};
        border:3px solid #111111;
        border-radius:10px;
        box-shadow:3px 3px 0 0 #111111;
        display:flex;align-items:center;justify-content:center;
        transform:rotate(-6deg);
        ${isHot ? 'animation: marker-pulse 1.2s ease-in-out infinite;' : ''}
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 2v8L4 15v5h16v-5l-6-5V2"/><path d="M4 15h16"/>
        </svg>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function MapComponent({ units, hazards, focusedCenter }: MapComponentProps) {
  return (
    <div className="h-full w-full bg-[#E7E2D6] z-0">
      <MapContainer
        center={[34.0522, -118.2437]}
        zoom={12}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <MapUpdater center={focusedCenter} />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="brut-map-tiles"
        />

        {hazards.map((hazard) => (
          <Circle
            key={hazard.id}
            center={[hazard.lat, hazard.lng]}
            radius={hazard.radius}
            pathOptions={{
              color: '#111111',
              weight: 3,
              fillColor: '#FF5A36',
              fillOpacity: 0.28,
              dashArray: '10 6',
            }}
          >
            <Popup>
              <div className="font-bold text-[15px] font-[family-name:var(--font-display)] text-gray-900">{hazard.name}</div>
              <div className="inline-flex items-center gap-1.5 mt-1.5 bg-[#FF5A36] text-white text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border-2 border-black">
                Active Hazard
              </div>
            </Popup>
          </Circle>
        ))}

        {units.map((unit) => (
          <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={makeUnitIcon(unit.status)}>
            <Popup>
              <div>
                <div className="font-bold text-gray-900 text-sm font-[family-name:var(--font-display)]">{unit.name}</div>
                <div className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-wide">ID: {unit.id}</div>
                <div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border-2 border-black ${
                  unit.status === 'Code Red' ? 'bg-[#FF5A36] text-white' : 'bg-[#FFD23F] text-black'
                }`}>
                  {unit.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}