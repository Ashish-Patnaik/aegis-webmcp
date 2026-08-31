"use client";

import { ShieldAlert, Radio, CheckCircle2, XCircle, Truck } from 'lucide-react';

export default function Sidebar({ units, pendingActions, approveAction, rejectAction }: any) {
  return (
    // Mobile: takes bottom 50% of screen. Desktop: takes full height, 380px width.
    <div className="w-full lg:w-[380px] h-[50dvh] lg:h-full bg-white border-t lg:border-t-0 lg:border-r border-gray-200 flex flex-col z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:shadow-sm flex-shrink-0">
      
      {/* Header */}
      <div className="h-16 flex items-center gap-3 px-4 lg:px-6 border-b border-gray-100 flex-shrink-0">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
          <ShieldAlert className="text-white w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-gray-900">Aegis</h1>
        
        <div className="ml-auto flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">WebMCP</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        
        {/* 100% FUNCTIONAL: Live Unit Fleet Roster */}
        <div className="mb-8">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unit Fleet Roster</div>
            <div className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {units.length} Deployed
            </div>
          </div>
          
          <div className="space-y-2">
            {units.map((unit: any) => (
              <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shadow-sm ${unit.status === 'Code Red' ? 'bg-red-100 text-red-600' : 'bg-white text-blue-600 border border-gray-100'}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{unit.name}</div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID: {unit.id}</div>
                  </div>
                </div>
                {/* Status Badge */}
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
                  unit.status === 'Code Red' 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}>
                  {unit.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* AI Proposals */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-blue-500" /> AI Proposals
            </div>
            <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingActions.length}</div>
          </div>
          
          {pendingActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <ShieldAlert className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500 text-center">No pending actions.</p>
              <p className="text-xs text-gray-400 text-center mt-1">Awaiting agent orchestration.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingActions.map((action: any) => (
                <div key={action.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${action.type === 'HAZARD' ? 'bg-orange-500' : action.type === 'UNIT_STATUS' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {action.type === 'HAZARD' && 'Hazard Draft'}
                      {action.type === 'UNIT_STATUS' && 'Unit Status'}
                      {action.type === 'ALERT' && 'Evac Alert'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium">
                    {action.type === 'HAZARD' && `Draw "${action.data.name}" at [${action.data.lat.toFixed(3)}, ${action.data.lng.toFixed(3)}]`}
                    {action.type === 'UNIT_STATUS' && `Update ${action.data.unit_id} to ${action.data.new_status}`}
                    {action.type === 'ALERT' && `Broadcast to ${action.data.sector}`}
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => approveAction(action)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => rejectAction(action.id)} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95">
                      <XCircle className="w-3.5 h-3.5 text-gray-400" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}