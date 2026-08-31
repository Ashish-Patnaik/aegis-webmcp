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
  focusedCenter?: [number, number] | null; // NEW: Tells the map where to fly to
}

// 1. New component to programmatically pan the map camera
function MapUpdater({ center }: { center?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 }); // Smooth fly animation
    }
  }, [center, map]);
  return null;
}

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function MapComponent({ units, hazards, focusedCenter }: MapComponentProps) {
  return (
    <div className="h-full w-full bg-[#e5e5e5] z-0">
      <MapContainer 
        center={[34.0522, -118.2437]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        {/* The Camera Controller */}
        <MapUpdater center={focusedCenter} />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="sleek-map-tiles"
        />
        
        {hazards.map((hazard) => (
          <Circle 
            key={hazard.id}
            center={[hazard.lat, hazard.lng]} 
            radius={hazard.radius} 
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 2, dashArray: '6' }} 
          >
            <Popup>
              <div className="font-semibold text-gray-900">{hazard.name}</div>
              <div className="text-xs text-red-500 mt-1">Active Hazard Zone</div>
            </Popup>
          </Circle>
        ))}

        {units.map((unit) => (
          <Marker 
            key={unit.id} 
            position={[unit.lat, unit.lng]} 
            icon={unit.status === 'Trapped' || unit.status === 'Code Red' ? redIcon : customIcon}
          >
            <Popup>
              <div>
                <div className="font-bold text-gray-900 text-sm">{unit.name}</div>
                <div className="text-xs text-gray-500 mb-2">ID: {unit.id}</div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  unit.status === 'Code Red' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
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