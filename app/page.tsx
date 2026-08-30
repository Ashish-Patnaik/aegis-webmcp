"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Radio, CheckCircle2, XCircle } from 'lucide-react';

// Real WebMCP polyfill. This installs document.modelContext per the
// webmachinelearning/webmcp spec (registerTool/getTools/executeTool),
// so ChatGPT's in-app browser and Chrome-with-WebMCP-enabled can actually
// discover and call these tools. The previous hand-rolled
// `document.modelContext = { tools: {}, registerTool: ... }` shim only
// wrote to a private object nothing else could see — that's why
// `document.modelContext` read back as undefined to any real WebMCP client.
import '@mcp-b/webmcp-polyfill';

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

type PendingAction = {
  id: number;
  type: 'HAZARD' | 'UNIT_STATUS' | 'ALERT';
  data: any;
};

export default function AegisDashboard() {
  const [units, setUnits] = useState([
    { id: 'E4', name: 'Engine 4', lat: 34.061, lng: -118.260, status: 'Active' },
    { id: 'E7', name: 'Engine 7', lat: 34.045, lng: -118.230, status: 'Active' },
    { id: 'M1', name: 'Medevac 1', lat: 34.070, lng: -118.210, status: 'Standby' }
  ]);

  const [hazards, setHazards] = useState([
    { id: 'H1', name: 'Highway 101 Brush Fire', lat: 34.055, lng: -118.245, radius: 800 }
  ]);

  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  // Register WebMCP tools using the real document.modelContext API.
  // Each tool's execute() just dispatches a DOM event with the drafted
  // action — the same human-in-the-loop approve/reject flow as before,
  // just wired through the actual spec instead of a fake object.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.modelContext) return;

    const controller = new AbortController();

    const dispatchDraft = (type: PendingAction['type'], data: any) => {
      window.dispatchEvent(new CustomEvent('aegis-agent-action', { detail: { type, data } }));
    };

    (async () => {
      try {
        await document.modelContext.registerTool(
          {
            name: 'draft_hazard_zone',
            description: 'Draft a new hazard zone on the map for human approval.',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Label for the hazard zone.' },
                lat: { type: 'number', description: 'Latitude of the hazard center.' },
                lng: { type: 'number', description: 'Longitude of the hazard center.' },
                radius: { type: 'number', description: 'Radius of the hazard zone in meters.' }
              },
              required: ['name', 'lat', 'lng', 'radius']
            },
            async execute(input: { name: string; lat: number; lng: number; radius: number }) {
              dispatchDraft('HAZARD', input);
              return {
                content: [
                  { type: 'text', text: `Drafted hazard zone "${input.name}" for dispatcher approval.` }
                ]
              };
            }
          },
          { signal: controller.signal }
        );

        await document.modelContext.registerTool(
          {
            name: 'update_unit_status',
            description: 'Draft a status change for a unit (e.g., Code Red) for human approval.',
            inputSchema: {
              type: 'object',
              properties: {
                unit_id: { type: 'string', description: 'ID of the unit to update, e.g. E4.' },
                new_status: { type: 'string', description: 'New status to apply, e.g. Code Red.' }
              },
              required: ['unit_id', 'new_status']
            },
            async execute(input: { unit_id: string; new_status: string }) {
              dispatchDraft('UNIT_STATUS', input);
              return {
                content: [
                  { type: 'text', text: `Drafted status change: ${input.unit_id} -> ${input.new_status}.` }
                ]
              };
            }
          },
          { signal: controller.signal }
        );

        await document.modelContext.registerTool(
          {
            name: 'draft_evacuation_alert',
            description: 'Draft an emergency broadcast alert for human approval.',
            inputSchema: {
              type: 'object',
              properties: {
                sector: { type: 'string', description: 'Target sector/zone for the broadcast.' },
                message: { type: 'string', description: 'Alert message text.' }
              },
              required: ['sector', 'message']
            },
            async execute(input: { sector: string; message: string }) {
              dispatchDraft('ALERT', input);
              return {
                content: [
                  { type: 'text', text: `Drafted evacuation alert for sector ${input.sector}.` }
                ]
              };
            }
          },
          { signal: controller.signal }
        );
      } catch (err) {
        // Expected: registerTool rejects when we abort mid-flight (React
        // strict-mode dev double-invokes effects). Check the signal itself
        // rather than the rejected error's shape/name, since aborting with
        // a custom reason means the rejection won't reliably be a
        // DOMException named "AbortError" — it may just be the reason value
        // we passed to abort(), or wrap it differently across runtimes.
        if (!controller.signal.aborted) {
          console.error('WebMCP tool registration failed:', err);
        }
      }
    })();

    // Unregistering on cleanup, per spec, is just aborting the signal.
    return () => controller.abort();
  }, []);

  // Listen for the tool-drafted actions and surface them for dispatcher approval.
  useEffect(() => {
    const handleAgentAction = (e: Event) => {
      const { type, data } = (e as CustomEvent).detail;
      setPendingActions(prev => [...prev, { type, data, id: Date.now() }]);
    };

    window.addEventListener('aegis-agent-action', handleAgentAction);
    return () => window.removeEventListener('aegis-agent-action', handleAgentAction);
  }, []);

  const approveAction = (action: PendingAction) => {
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
            <Radio className="w-4 h-4" /> Pending Actions ({pendingActions.length})
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
                    {action.type === 'HAZARD' && '⚠️ HAZARD DRAFT'}
                    {action.type === 'UNIT_STATUS' && '🚒 UNIT UPDATE'}
                    {action.type === 'ALERT' && '📢 EVAC ALERT'}
                  </div>
                  <div className="text-sm mb-3">
                    {action.type === 'HAZARD' && `Draw ${action.data.name} at [${action.data.lat.toFixed(3)}, ${action.data.lng.toFixed(3)}]`}
                    {action.type === 'UNIT_STATUS' && `Set ${action.data.unit_id} to ${action.data.new_status}`}
                    {action.type === 'ALERT' && `Broadcast to ${action.data.sector}`}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveAction(action)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => rejectAction(action.id)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1">
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