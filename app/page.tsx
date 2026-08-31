"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, Users, Bell, CheckCircle2 } from 'lucide-react';
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
  
  // NEW FUNCTIONALITY STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedCenter, setFocusedCenter] = useState<[number, number] | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const isRegisteredRef = useRef(false);

  // SEARCH LOGIC: Watch the search bar and pan the map if a unit is found
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const foundUnit = units.find(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (foundUnit) setFocusedCenter([foundUnit.lat, foundUnit.lng]);
    }
  }, [searchQuery, units]);


  // WEBMCP REGISTRATION
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

  // STATE MANAGEMENT
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
      setFocusedCenter([action.data.lat, action.data.lng]); // Pan to new hazard!
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
    <main className="flex flex-col-reverse lg:flex-row h-[100dvh] w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      <Sidebar 
        units={units} 
        pendingActions={pendingActions} 
        approveAction={approveAction} 
        rejectAction={rejectAction} 
      />

      <div className="flex-1 w-full h-[50dvh] lg:h-full relative flex flex-col z-0">
        
        {/* Floating Top Bar */}
        <div className="absolute top-4 inset-x-4 z-10 hidden md:flex justify-between items-start pointer-events-none">
          
          {/* FUNCTIONAL SEARCH BAR */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 p-2.5 flex items-center gap-3 pointer-events-auto w-96 transition-all focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="w-4 h-4 text-gray-400 ml-2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unit (e.g. 'E4' or 'Engine')..." 
              className="flex-1 text-sm outline-none text-gray-700 bg-transparent placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3 pointer-events-auto relative">
            {/* CLICKABLE ACTIVE UNITS: Resets the map view to the center of LA */}
            <button 
              onClick={() => setFocusedCenter([34.0522, -118.2437])}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><Users className="w-4 h-4" /></div>
              <div className="text-left">
                <div className="text-[10px] font-semibold text-gray-400 uppercase">Active Units</div>
                <div className="text-sm font-bold text-gray-900">{units.length} Deployed</div>
              </div>
            </button>

            {/* FUNCTIONAL BELL ICON */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 p-2.5 flex items-center justify-center hover:bg-gray-50 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute top-14 right-0 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-sm text-gray-700 flex justify-between">
                  Action History
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{notifications.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No recent actions.</div>
                  ) : (
                    notifications.map(note => (
                      <div key={note.id} className="p-3 hover:bg-gray-50 rounded-lg flex gap-3 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-gray-800">{note.message}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{note.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Component Container */}
        <div className="w-full h-full relative z-0">
          <MapComponent units={units} hazards={hazards} focusedCenter={focusedCenter} />
        </div>
      </div>
    </main>
  );
}