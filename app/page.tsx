"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, Users, Bell, CheckCircle2, Crosshair } from 'lucide-react';
import '@mcp-b/webmcp-polyfill';
import Sidebar from '../components/Sidebar';

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

type PendingAction = { id: number; type: 'HAZARD' | 'UNIT_STATUS' | 'ALERT'; data: any; };
type Notification = { id: number; message: string; time: string };

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

  const [searchQuery, setSearchQuery] = useState("");
  const [focusedCenter, setFocusedCenter] = useState<[number, number] | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const foundUnit = units.find(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (foundUnit) setFocusedCenter([foundUnit.lat, foundUnit.lng]);
    }
  }, [searchQuery, units]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.modelContext) return;
    const controller = new AbortController();

    const dispatchDraft = (type: PendingAction['type'], data: any) => {
      window.dispatchEvent(new CustomEvent('aegis-agent-action', { detail: { type, data } }));
    };

    (async () => {
      try {
        await document.modelContext.registerTool({
            name: 'draft_hazard_zone',
            description: 'Draft a new hazard zone on the map.',
            inputSchema: { type: 'object', properties: { name: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, radius: { type: 'number' } }, required: ['name', 'lat', 'lng', 'radius'] },
            async execute(input: any) { dispatchDraft('HAZARD', input); return { content: [{ type: 'text', text: `Drafted hazard zone.` }] }; }
          }, { signal: controller.signal });

        await document.modelContext.registerTool({
            name: 'update_unit_status',
            description: 'Draft a status change for a unit.',
            inputSchema: { type: 'object', properties: { unit_id: { type: 'string' }, new_status: { type: 'string' } }, required: ['unit_id', 'new_status'] },
            async execute(input: any) { dispatchDraft('UNIT_STATUS', input); return { content: [{ type: 'text', text: `Drafted status change.` }] }; }
          }, { signal: controller.signal });

        await document.modelContext.registerTool({
            name: 'draft_evacuation_alert',
            description: 'Draft an emergency broadcast alert.',
            inputSchema: { type: 'object', properties: { sector: { type: 'string' }, message: { type: 'string' } }, required: ['sector', 'message'] },
            async execute(input: any) { dispatchDraft('ALERT', input); return { content: [{ type: 'text', text: `Drafted evacuation alert.` }] }; }
          }, { signal: controller.signal });
      } catch (err) {
        if (!controller.signal.aborted) console.error('WebMCP tool registration failed:', err);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleAgentAction = (e: Event) => {
      const { type, data } = (e as CustomEvent).detail;
      setPendingActions(prev => [...prev, { type, data, id: Date.now() }]);
    };
    window.addEventListener('aegis-agent-action', handleAgentAction);
    return () => window.removeEventListener('aegis-agent-action', handleAgentAction);
  }, []);

  const addNotification = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotifications(prev => [{ id: Date.now(), message: msg, time }, ...prev]);
  };

  const approveAction = (action: PendingAction) => {
    if (action.type === 'HAZARD') {
      setHazards(prev => [...prev, { id: `H${Date.now()}`, ...action.data }]);
      setFocusedCenter([action.data.lat, action.data.lng]);
      addNotification(`Hazard "${action.data.name}" added to map.`);
    }
    if (action.type === 'UNIT_STATUS') {
      setUnits(prev => prev.map(u => u.id === action.data.unit_id ? { ...u, status: action.data.new_status } : u));
      addNotification(`Unit ${action.data.unit_id} status updated to ${action.data.new_status}.`);
    }
    if (action.type === 'ALERT') {
      alert(`📢 Broadcast Sent to ${action.data.sector}: ${action.data.message}`);
      addNotification(`Evacuation alert broadcasted to ${action.data.sector}.`);
    }
    setPendingActions(prev => prev.filter(a => a.id !== action.id));
  };

  const rejectAction = (actionId: number) => setPendingActions(prev => prev.filter(a => a.id !== actionId));

  return (
    <main className="flex flex-col-reverse lg:flex-row h-[100dvh] w-full bg-[var(--color-paper)] font-[family-name:var(--font-body)] text-black overflow-hidden">

      <Sidebar
        units={units}
        pendingActions={pendingActions}
        approveAction={approveAction}
        rejectAction={rejectAction}
      />

      <div className="flex-1 w-full h-[48dvh] lg:h-full relative flex flex-col z-0">

        {/* Floating Top Bar */}
        <div className="absolute top-4 inset-x-4 z-10 hidden md:flex justify-between items-start pointer-events-none gap-3">

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border-3 border-black shadow-[5px_5px_0_0_#111] p-2.5 flex items-center gap-3 pointer-events-auto w-96 transition-transform focus-within:-translate-y-0.5">
            <div className="bg-[var(--color-hazard)] p-1.5 rounded-lg border-2 border-black flex-shrink-0">
              <Search className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unit (e.g. 'E4' or 'Engine')..."
              className="flex-1 text-sm outline-none text-black bg-transparent placeholder-black/40 font-medium"
            />
          </div>

          <div className="flex gap-3 pointer-events-auto relative">
            {/* Active Units button — resets map to LA center */}
            <button
              onClick={() => setFocusedCenter([34.0522, -118.2437])}
              className="bg-white rounded-2xl border-3 border-black shadow-[4px_4px_0_0_#111] px-4 py-2.5 flex items-center gap-3 brut-press"
              title="Recenter map"
            >
              <div className="bg-[var(--color-radio)] text-white p-1.5 rounded-lg border-2 border-black">
                <Crosshair className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-black/50 uppercase tracking-wider">Active Units</div>
                <div className="text-sm font-extrabold text-black">{units.length} Deployed</div>
              </div>
            </button>

            {/* Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-white rounded-2xl border-3 border-black shadow-[4px_4px_0_0_#111] p-2.5 flex items-center justify-center brut-press relative"
            >
              <Bell className="w-5 h-5 text-black" strokeWidth={2.5} />
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[var(--color-siren)] rounded-full border-2 border-black flex items-center justify-center text-[10px] font-extrabold text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute top-16 right-0 w-80 bg-white rounded-2xl border-3 border-black shadow-[6px_6px_0_0_#111] overflow-hidden z-50">
                <div className="bg-[var(--color-hazard)] px-4 py-3 border-b-3 border-black font-extrabold text-sm text-black flex justify-between items-center">
                  Action History
                  <span className="text-xs bg-black text-white font-extrabold px-2 py-0.5 rounded-full">{notifications.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2 brut-scroll">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm font-medium text-black/40">No recent actions.</div>
                  ) : (
                    notifications.map(note => (
                      <div key={note.id} className="p-3 hover:bg-[var(--color-paper)] rounded-xl flex gap-3 transition-colors">
                        <div className="bg-[var(--color-go)] p-1 rounded-md border-2 border-black flex-shrink-0 h-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-black">{note.message}</div>
                          <div className="text-[10px] text-black/40 mt-1 font-semibold uppercase tracking-wide">{note.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile-only compact top bar */}
        <div className="absolute top-3 inset-x-3 z-10 flex md:hidden justify-between items-center gap-2 pointer-events-none">
          <div className="bg-white rounded-xl border-3 border-black shadow-[3px_3px_0_0_#111] px-3 py-2 flex items-center gap-2 pointer-events-auto flex-1">
            <Search className="w-4 h-4 text-black/50 flex-shrink-0" strokeWidth={2.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unit..."
              className="flex-1 text-sm outline-none text-black bg-transparent placeholder-black/40 min-w-0"
            />
          </div>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="bg-white rounded-xl border-3 border-black shadow-[3px_3px_0_0_#111] p-2.5 flex-shrink-0 pointer-events-auto relative"
          >
            <Bell className="w-4 h-4 text-black" strokeWidth={2.5} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-siren)] rounded-full border-2 border-black flex items-center justify-center text-[8px] font-extrabold text-white">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Map */}
        <div className="w-full h-full relative z-0">
          <MapComponent units={units} hazards={hazards} focusedCenter={focusedCenter} />
        </div>
      </div>
    </main>
  );
}