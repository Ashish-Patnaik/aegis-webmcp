"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Radio, CheckCircle2, XCircle } from 'lucide-react';

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

// --- 1. THE WEBMCP POLYFILL & EVENT BRIDGE ---
if (typeof window !== 'undefined') {
  const win = window as any;
  const doc = document as any;
  
  win.__WEBMCP_EMITTER__ = win.__WEBMCP_EMITTER__ || new EventTarget();

  // POLYFILL: If the ChatGPT embedded browser doesn't have WebMCP enabled, we create it!
  if (!doc.modelContext) {
    doc.modelContext = {
      tools: {},
      registerTool: function(tool: any) {
        this.tools[tool.name] = tool;
      }
    };
  }
  
  const registerAgentTools = () => {
    if (doc.modelContext && !win.__WEBMCP_REGISTERED) {
      win.__WEBMCP_REGISTERED = true;
      const mc = doc.modelContext;
      
      try {
        mc.registerTool({
          name: "draft_hazard_zone",
          description: "Draft a new hazard zone on the map.",
          inputSchema: { type: "object", properties: { name: { type: "string" }, lat: { type: "number" }, lng: { type: "number" }, radius: { type: "number" } }, required: ["name", "lat", "lng", "radius"] },
          execute: async (input: any) => {
            win.__WEBMCP_EMITTER__.dispatchEvent(new CustomEvent('agentAction', { detail: { type: 'HAZARD', data: input } }));
            return { status: "success" };
          }
        });

        mc.registerTool({
          name: "update_unit_status",
          description: "Draft a status change for a unit (e.g., Code Red).",
          inputSchema: { type: "object", properties: { unit_id: { type: "string" }, new_status: { type: "string" } }, required: ["unit_id", "new_status"] },
          execute: async (input: any) => {
            win.__WEBMCP_EMITTER__.dispatchEvent(new CustomEvent('agentAction', { detail: { type: 'UNIT_STATUS', data: input } }));
            return { status: "success" };
          }
        });

        mc.registerTool({
          name: "draft_evacuation_alert",
          description: "Draft an emergency broadcast alert.",
          inputSchema: { type: "object", properties: { sector: { type: "string" }, message: { type: "string" } }, required: ["sector", "message"] },
          execute: async (input: any) => {
            win.__WEBMCP_EMITTER__.dispatchEvent(new CustomEvent('agentAction', { detail: { type: 'ALERT', data: input } }));
            return { status: "success" };
          }
        });
      } catch (e) {
        console.warn("Registration error", e);
      }
    }
  };

  // Run instantly
  registerAgentTools();
}


export default function AegisDashboard() {
  const [units, setUnits] = useState([
    { id: 'E4', name: 'Engine 4', lat: 34.061, lng: -118.260, status: 'Active' },
    { id: 'E7', name: 'Engine 7', lat: 34.045, lng: -118.230, status: 'Active' },
    { id: 'M1', name: 'Medevac 1', lat: 34.070, lng: -118.210, status: 'Standby' }
  ]);
  
  const [hazards, setHazards] = useState([
    { id: 'H1', name: 'Highway 101 Brush Fire', lat: 34.055, lng: -118.245, radius: 800 }
  ]);

  const [pendingActions, setPendingActions] = useState<any[]>([]);

  // React listens to the Event Bridge for Agent Actions
  useEffect(() => {
    const win = window as any;
    const handleAgentAction = (e: any) => {
      const { type, data } = e.detail;
      setPendingActions(prev => [...prev, { type, data, id: Date.now() }]);
    };

    if (win.__WEBMCP_EMITTER__) {
      win.__WEBMCP_EMITTER__.addEventListener('agentAction', handleAgentAction);
    }
    
    return () => {
      if (win.__WEBMCP_EMITTER__) {
        win.__WEBMCP_EMITTER__.removeEventListener('agentAction', handleAgentAction);
      }
    };
  }, []);

  const approveAction = (action: any) => {
    if (action.type === 'HAZARD') setHazards(prev => [...prev, { id: `H${Date.now()}`, ...action.data }]);
    if (action.type === 'UNIT_STATUS') setUnits(prev => prev.map(u => u.id === action.data.unit_id ? { ...u, status: action.data.new_status } : u));
    if (action.type === 'ALERT') alert(`BROADCASTING TO ${action.data.sector}: ${action.data.message}`);
    setPendingActions(prev => prev.filter(a => a.id !== action.id));
  };

  const rejectAction = (actionId: number) => setPendingActions(prev => prev.filter(a => a.id !== actionId));

  return (
    <main className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans">
      <div className="w-96 flex flex-col border-r border-slate-700 bg-slate-900/50 p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="text-red-500 w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">AEGIS COMMAND</h1>
        </div>

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

        <div className="flex-1">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4" /> Pending Agent Actions ({pendingActions.length})
          </h2>
          {pendingActions.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8 border border-dashed border-slate-700 rounded-lg">
              No actions pending. Awaiting AI assessment.
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
      <div className="flex-1 p-4 bg-slate-950">
        <MapComponent units={units} hazards={hazards} />
      </div>
    </main>
  );
}