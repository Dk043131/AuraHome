import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  Leaf, 
  ShieldAlert, 
  IndianRupee, 
  CheckCircle, 
  PieChart, 
  DollarSign 
} from 'lucide-react';

export default function EnergyAnalytics({ energy, events }) {
  const e = energy || {};
  const breakdown = e.breakdown || [
    { name: "Living Fan", watts: 32.5, pct: 18 },
    { name: "Living Light", watts: 11.2, pct: 6 },
    { name: "Bedroom AC", watts: 0.0, pct: 0 },
    { name: "Workstation Plug", watts: 142.5, pct: 76 }
  ];
  const evList = events || [];
  const totalWatts = e.total_instant_watts ?? 186.2;

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-950/5 p-6 sm:p-7 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Energy & Power Telemetry</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time Grid & Sub-metering Load</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
          <Leaf className="w-3.5 h-3.5" />
          <span>Eco Optimal</span>
        </div>
      </div>

      {/* Top 4 Metrics Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Instant Load
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalWatts}</span>
            <span className="text-xs font-bold text-emerald-700">Watts</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Live aggregated draw</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Daily Usage
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900">{e.daily_kwh ?? 2.5}</span>
            <span className="text-xs font-bold text-emerald-700">kWh</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Today's consumption</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Est. Daily Cost
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-slate-600">₹</span>
            <span className="text-2xl font-black text-emerald-700">{e.daily_cost_est ?? 21.25}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">@ ₹{e.rate_per_kwh ?? 8.5}/kWh</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Carbon Offset
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-600">{e.carbon_offset_kg ?? 2.05}</span>
            <span className="text-xs font-bold text-emerald-700">kg</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">CO₂ saved today</span>
        </div>
      </div>

      {/* Live Energy Current Flow Stage */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-inner overflow-hidden relative">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3 border-b border-slate-700/60 pb-2">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            Live Power Current Distribution Bus
          </span>
          <span className="text-[11px] font-mono text-slate-400">Grid: 230.5V • 50Hz</span>
        </div>

        {/* 4 Connected Lines */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {breakdown.map((item, idx) => {
            const isActive = item.watts > 2.0;
            return (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 flex flex-col justify-between relative overflow-hidden">
                {/* Flowing current indicator line */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse" />
                )}
                
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-300 truncate">{item.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                </div>
                
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-xs font-bold text-white">{item.watts}W</span>
                  <span className="text-[10px] font-semibold text-emerald-400">{item.pct}%</span>
                </div>

                {/* Animated wire current flow track */}
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden relative">
                  {isActive && (
                    <div className="h-full w-1/2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-current-flow" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appliance Load Breakdown */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Real-Time Appliance Distribution
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {breakdown.length} Monitored Endpoints
          </span>
        </div>

        <div className="space-y-3">
          {breakdown.map((item, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-800">{item.name}</span>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-slate-900">{item.watts} W</span>
                  <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px]">
                    {item.pct}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(3, item.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Activity & Hardware Event Log */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Live Telemetry Event Log
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Auto-updated via WebSocket</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {evList.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No recent events recorded.</p>
          ) : (
            evList.map((ev, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {ev.type}
                  </span>
                  <span className="text-slate-700 font-medium">{ev.msg}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">{ev.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
