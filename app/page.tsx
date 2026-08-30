"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Radio, CheckCircle2, XCircle } from 'lucide-react';

// Dynamically import the map to prevent SSR window errors
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

export default function AegisDashboard() {
  // --- 1. CORE STATE ---
  const [units, setUnits] = useState([
    { id: 'E4', name: 'Engine 4', lat: 34.061, lng: -118.260, status: 'Active' },
    { id: 'E7', name: 'Engine 7', lat: 34.045, lng: -118.230, status: 'Active' },
    { id: 'M1', name: 'Medevac 1', lat: 34.070, lng: -118.210, status: 'Standby' }
  ]);
  
  const [hazards, setHazards] = useState([
    { id: 'H1', name: 'Highway 101 Brush Fire', lat: 34.055, lng: -118.245, radius: 800 }
  ]);

  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [isWebMCpActive, setIsWebMCpActive] = useState(false);

  // --- 2. WEBMCP REGISTRATION ---
  // This useRef must be inside the component, but outside the useEffect!
  const isRegisteredRef = useRef(false); 

  useEffect(() => {
    // Check if the browser supports WebMCP
    if (typeof document !== 'undefined' && (document as any).modelContext) {
      setIsWebMCpActive(true);
      
      // If we already registered the tools, stop here so we don't get the "Duplicate Tool" error
      if (isRegisteredRef.current) return;
      isRegisteredRef.current = true;

      const mc = (document as any).modelContext;

      try {
        // Tool 1: Draft Hazard Zone
        mc.registerTool({
          name: "draft_hazard_zone",
          description: "Draft a new hazard zone (like a fire spread) on the map for human approval. Use this when you detect a new threat in transcripts.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the hazard (e.g., 'Exit 14 Fire Spread')" },
              lat: { type: "number", description: "Latitude" },
              lng: { type: "number", description: "Longitude" },
              radius: { type: "number", description: "Radius in meters (default 500)" }
            },
            required: ["name", "lat", "lng", "radius"]
          },
          execute: async (input: any) => {
            setPendingActions(prev => [...prev, { type: 'HAZARD', data: input, id: Date.now() }]);
            return { status: "success", message: "Hazard drafted. Awaiting human commander approval." };
          }
        });

        // Tool 2: Update Unit Status
        mc.registerTool({
          name: "update_unit_status",
          description: "Draft a status change for a unit (e.g., changing status to 'Trapped', 'Code Red', or 'Evacuating').",
          inputSchema: {
            type: "object",
            properties: {
              unit_id: { type: "string", description: "The ID of the unit (e.g., 'E4', 'E7')" },
              new_status: { type: "string", description: "The new status of the unit" }
            },
            required: ["unit_id", "new_status"]
          },
          execute: async (input: any) => {
            setPendingActions(prev => [...prev, { type: 'UNIT_STATUS', data: input, id: Date.now() }]);
            return { status: "success", message: "Status update drafted. Awaiting human approval." };
          }
        });

        // Tool 3: Broadcast Alert
        mc.registerTool({
          name: "draft_evacuation_alert",
          description: "Draft an emergency broadcast alert to civilians in a specific sector.",
          inputSchema: {
            type: "object",
            properties: {
              sector: { type: "string", description: "The area or subdivision to alert" },
              message: { type: "string", description: "The evacuation message" }
            },
            required: ["sector", "message"]
          },
          execute: async (input: any) => {
            setPendingActions(prev => [...prev, { type: 'ALERT', data: input, id: Date.now() }]);
            return { status: "success", message: "Alert drafted. Awaiting human approval before broadcasting." };
          }
        });
      } catch (error) {
        console.warn("WebMCP Tool Registration skipped or failed:", error);
      }
    }
  }, []);

  // --- 3. APPROVAL LOGIC ---
  const approveAction = (action: any) => {
    if (action.type === 'HAZARD') {
      setHazards(prev => [...prev, { id: `H${Date.now()}`, ...action.data }]);
    } else if (action.type === 'UNIT_STATUS') {
      setUnits(prev => prev.map(u => u.id === action.data.unit_id ? { ...u, status: action.data.new_status } : u));
    } else if (action.type === 'ALERT') {
      alert(`BROADCASTING TO ${action.data.sector}: ${action.data.message}`);
    }
    setPendingActions(prev => prev.filter(a => a.id !== action.id));
  };

  const rejectAction = (actionId: number) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
  };

  // --- 4. UI RENDERING ---
  return (
    <main className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans">
      
      {/* Sidebar: Command Center */}
      <div className="w-96 flex flex-col border-r border-slate-700 bg-slate-900/50 p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="text-red-500 w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">AEGIS COMMAND</h1>
        </div>

        {/* WebMCP Status */}
        <div className={`mb-6 text-sm font-semibold p-2 rounded flex items-center justify-center gap-2 ${isWebMCpActive ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' : 'bg-red-900/40 text-red-400 border border-red-800'}`}>
          <div className={`w-2 h-2 rounded-full ${isWebMCpActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></div>
          {isWebMCpActive ? 'WebMCP Agent Hook Connected' : 'WebMCP Disconnected'}
        </div>

        {/* Units List */}
        <div className="mb-8">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Active Units</h2>
          <div className="flex flex-col gap-2">
            {units.map(unit => (
              <div key={unit.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold">{unit.name}</div>
                  <div className="text-xs text-slate-400">ID: {unit.id}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${unit.status.includes('Active') ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>
                  {unit.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions from Agent */}
        <div className="flex-1">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4" /> 
            Pending Agent Actions ({pendingActions.length})
          </h2>
          {pendingActions.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8 border border-dashed border-slate-700 rounded-lg">
              No actions pending.<br/>Awaiting AI assessment.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingActions.map(action => (
                <div key={action.id} className="bg-amber-900/20 border border-amber-700/50 p-3 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <div className="text-xs text-amber-500 font-bold mb-1">
                    {action.type === 'HAZARD' && '⚠️ NEW HAZARD DRAFT'}
                    {action.type === 'UNIT_STATUS' && '🚒 UNIT STATUS OVERRIDE'}
                    {action.type === 'ALERT' && '📢 EVACUATION ALERT'}
                  </div>
                  <div className="text-sm mb-3">
                    {action.type === 'HAZARD' && `Draw ${action.data.name} at [${action.data.lat.toFixed(3)}, ${action.data.lng.toFixed(3)}]`}
                    {action.type === 'UNIT_STATUS' && `Set ${action.data.unit_id} to ${action.data.new_status}`}
                    {action.type === 'ALERT' && `Broadcast to ${action.data.sector}`}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveAction(action)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors">
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => rejectAction(action.id)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 p-4 bg-slate-950">
        <MapComponent units={units} hazards={hazards} />
      </div>

    </main>
  );
}