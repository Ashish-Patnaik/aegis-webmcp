"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// 1. Add TypeScript Interfaces to fix the 'any' errors
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
}

// 2. Fix Leaflet's default icon paths in Next.js
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

// 3. Apply the Props type to the component
export default function MapComponent({ units, hazards }: MapComponentProps) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-700">
      <MapContainer 
        center={[34.0522, -118.2437]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {hazards.map((hazard) => (
          <Circle 
            key={hazard.id}
            center={[hazard.lat, hazard.lng]} 
            radius={hazard.radius} 
            pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.4 }}
          >
            <Popup className="text-slate-900 font-bold">{hazard.name}</Popup>
          </Circle>
        ))}

        {units.map((unit) => (
          <Marker 
            key={unit.id} 
            position={[unit.lat, unit.lng]} 
            icon={unit.status === 'Trapped' || unit.status === 'Code Red' ? redIcon : customIcon}
          >
            <Popup className="text-slate-900">
              <strong>{unit.name}</strong><br/>
              Status: {unit.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}