"use client";

import { ShieldAlert, Radio, CheckCircle2, XCircle, Truck, Flame, Megaphone } from 'lucide-react';

export default function Sidebar({ units, pendingActions, approveAction, rejectAction }: any) {
  return (
    <div className="w-full lg:w-[400px] h-[52dvh] lg:h-full bg-[var(--color-paper)] border-t-4 lg:border-t-0 lg:border-r-4 border-black flex flex-col z-20 flex-shrink-0">

      {/* Header */}
      <div className="h-[72px] flex items-center gap-3 px-4 lg:px-5 border-b-4 border-black flex-shrink-0 bg-[var(--color-hazard)]">
        <div className="bg-[var(--color-ink)] p-2 rounded-xl border-2 border-black shadow-[3px_3px_0_0_#111] rotate-[-4deg]">
          <ShieldAlert className="text-[var(--color-hazard)] w-5 h-5" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-black font-[family-name:var(--font-display)]">
          Aegis
        </h1>

        <div className="ml-auto flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0_0_#111]">
          <div className="w-2 h-2 rounded-full bg-[var(--color-go)] pulse-dot"></div>
          <span className="text-[10px] font-extrabold text-black uppercase tracking-wider">WebMCP</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-5 brut-scroll">

        {/* Unit Fleet Roster */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-black font-[family-name:var(--font-display)]">Unit Fleet</div>
            <div className="bg-[var(--color-radio)] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0_0_#111]">
              {units.length} deployed
            </div>
          </div>

          <div className="space-y-2.5">
            {units.map((unit: any) => {
              const isHot = unit.status === 'Code Red' || unit.status === 'Trapped';
              return (
                <div
                  key={unit.id}
                  className={`flex items-center justify-between p-3 rounded-xl border-3 border-black brut-sm brut-press ${
                    isHot ? 'bg-[#FF5A36]/15' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border-2 border-black ${
                      isHot ? 'bg-[var(--color-siren)] text-white' : 'bg-[var(--color-radio)] text-white'
                    }`}>
                      <Truck className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-black leading-tight">{unit.name}</div>
                      <div className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">{unit.id}</div>
                    </div>
                  </div>
                  <div className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border-2 border-black uppercase tracking-wide ${
                    isHot ? 'bg-[var(--color-siren)] text-white pulse-dot' : 'bg-[var(--color-hazard)] text-black'
                  }`}>
                    {unit.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t-3 border-dashed border-black/20 mb-6" />

        {/* AI Proposals */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-black flex items-center gap-2 font-[family-name:var(--font-display)]">
              <div className="bg-[var(--color-radio)] p-1 rounded-md border-2 border-black">
                <Radio className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              AI Proposals
            </div>
            <div className="bg-black text-white text-xs font-extrabold px-2.5 py-1 rounded-full border-2 border-black">
              {pendingActions.length}
            </div>
          </div>

          {pendingActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl bg-white border-3 border-dashed border-black/30">
              <ShieldAlert className="w-9 h-9 text-black/20 mb-3" strokeWidth={2} />
              <p className="text-sm font-bold text-black/60 text-center">No pending actions</p>
              <p className="text-xs text-black/40 text-center mt-1">Awaiting agent orchestration</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingActions.map((action: any) => {
                const meta = {
                  HAZARD: { icon: Flame, color: 'var(--color-siren)', label: 'Hazard Draft' },
                  UNIT_STATUS: { icon: Truck, color: 'var(--color-radio)', label: 'Unit Status' },
                  ALERT: { icon: Megaphone, color: '#8B5CF6', label: 'Evac Alert' },
                }[action.type as 'HAZARD' | 'UNIT_STATUS' | 'ALERT'];
                const Icon = meta.icon;
                return (
                  <div key={action.id} className="bg-white rounded-2xl p-4 border-3 border-black shadow-[5px_5px_0_0_#111]">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="p-1.5 rounded-md border-2 border-black"
                        style={{ background: meta.color }}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-xs font-extrabold text-black uppercase tracking-wide">
                        {meta.label}
                      </span>
                    </div>

                    <div className="text-sm text-black/80 mb-4 bg-[var(--color-paper)] p-3 rounded-lg border-2 border-black/10 font-medium">
                      {action.type === 'HAZARD' && `Draw "${action.data.name}" at [${action.data.lat.toFixed(3)}, ${action.data.lng.toFixed(3)}]`}
                      {action.type === 'UNIT_STATUS' && `Update ${action.data.unit_id} to ${action.data.new_status}`}
                      {action.type === 'ALERT' && `Broadcast to ${action.data.sector}`}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => approveAction(action)}
                        className="flex-1 bg-[var(--color-go)] text-white text-xs font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-1.5 border-2 border-black shadow-[3px_3px_0_0_#111] brut-press uppercase tracking-wide"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Approve
                      </button>
                      <button
                        onClick={() => rejectAction(action.id)}
                        className="flex-1 bg-white text-black text-xs font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-1.5 border-2 border-black shadow-[3px_3px_0_0_#111] brut-press uppercase tracking-wide"
                      >
                        <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}