import React from 'react';
import { 
  Airplay, 
  Power, 
  ThermometerSnowflake, 
  Gauge, 
  CheckCircle2, 
  Leaf, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

export default function ClimateCard({ ac, onToggleState, onSetTemp }) {
  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-950/5 hover:border-emerald-200 transition-all p-6 sm:p-7 relative overflow-hidden">
      {/* Corner Glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            ac.state 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            <ThermometerSnowflake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">{ac.name}</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Dual Inverter
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {ac.room} • {ac.state ? `${ac.watts}W (${ac.compressor_load_pct}% load)` : 'Standby (1.2W)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleState(!ac.state)}
          className={`btn-tactile px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            ac.state
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{ac.state ? 'ACTIVE' : 'OFF'}</span>
        </button>
      </div>

      {/* Realistic Split AC Indoor Air Handler Visualizer Stage */}
      <div className="relative mb-6 rounded-2xl bg-gradient-to-b from-slate-100 via-emerald-50/40 to-slate-100 border border-emerald-100 p-5 flex flex-col items-center justify-center overflow-hidden shadow-xs">
        
        {/* Cold Frosty Airflow Particles (when running) */}
        {ac.state && (
          <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-50 z-0">
            <div className="w-1 h-8 bg-gradient-to-b from-cyan-300 to-transparent rounded-full animate-ac-mist" style={{ animationDelay: '0s' }} />
            <div className="w-1.5 h-12 bg-gradient-to-b from-teal-300 to-transparent rounded-full animate-ac-mist" style={{ animationDelay: '0.4s' }} />
            <div className="w-1 h-10 bg-gradient-to-b from-cyan-400 to-transparent rounded-full animate-ac-mist" style={{ animationDelay: '0.2s' }} />
            <div className="w-1 h-7 bg-gradient-to-b from-emerald-300 to-transparent rounded-full animate-ac-mist" style={{ animationDelay: '0.6s' }} />
          </div>
        )}

        {/* The AC Indoor Wall Unit */}
        <div className="relative z-10 w-full max-w-sm rounded-xl bg-white border border-slate-200 shadow-md p-3.5 flex flex-col">
          {/* Top Air Intake Grill */}
          <div className="flex justify-between items-center gap-1 mb-2 px-1 opacity-40">
            <div className="flex-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex-1 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Front Panel with Hidden Digital Segment Display */}
          <div className="flex items-center justify-between py-1 px-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">AURA INVERTER</span>
              <span className={`w-1.5 h-1.5 rounded-full ${ac.state ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
            </div>

            {/* Hidden LED Thermostat Readout */}
            <div className={`px-2.5 py-0.5 rounded-md font-mono text-sm font-black transition-all ${
              ac.state 
                ? 'bg-slate-900 text-cyan-400 shadow-inner' 
                : 'bg-slate-100 text-slate-300'
            }`}>
              {ac.state ? `${ac.set_temp}°C` : '--'}
            </div>
          </div>

          {/* Bottom Motorized Air Louver Flap */}
          <div className="mt-2 pt-1 border-t border-slate-100 relative">
            <div 
              className={`h-2 rounded-full transition-all duration-700 ${
                ac.state 
                  ? 'bg-cyan-100 border border-cyan-300 shadow-sm translate-y-1' 
                  : 'bg-slate-200'
              }`}
            />
          </div>
        </div>

        {/* Unit Status Bar */}
        <div className="relative z-10 w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-3 border-t border-emerald-100/60 mt-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${ac.state ? 'bg-cyan-500 animate-ping' : 'bg-slate-300'}`} />
            <span>{ac.state ? `Cooling @ ${ac.set_temp}°C` : 'Compressor Idle'}</span>
          </span>
          <span className="text-emerald-700 font-mono">
            {ac.state ? `Load: ${ac.compressor_load_pct}%` : '0%'}
          </span>
          <span className="text-slate-500 font-medium">
            Ambient: {ac.room_temp}°C
          </span>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 mb-6">
        <div className="text-center">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Set Temp</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{ac.set_temp}</span>
            <span className="text-xs font-semibold text-emerald-700">°C</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Room: {ac.room_temp}°C</span>
        </div>

        <div className="text-center border-x border-emerald-200/60">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Compressor</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{ac.state ? ac.compressor_load_pct : 0}</span>
            <span className="text-xs font-semibold text-emerald-700">%</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-0.5">
            <Leaf className="w-3 h-3 text-emerald-600" /> {ac.energy_saving_ratio}% eco saving
          </span>
        </div>

        <div className="text-center">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Air Filter</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-emerald-600">{ac.filter_health_pct}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Clean & Optimal</span>
        </div>
      </div>

      {/* Temperature Controls */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Target Thermostat</span>
          <span className="text-xs text-slate-500">Dual Inverter Variable Frequency</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSetTemp(Math.max(16, ac.set_temp - 1))}
            className="w-10 h-10 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-center text-slate-700 hover:text-emerald-700 font-bold shadow-2xs transition-all cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <span className="text-2xl font-black text-slate-900 w-12 text-center">
            {ac.set_temp}°
          </span>
          <button
            onClick={() => onSetTemp(Math.min(30, ac.set_temp + 1))}
            className="w-10 h-10 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-center text-slate-700 hover:text-emerald-700 font-bold shadow-2xs transition-all cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Compressor modulation & Eco status */}
      <div className="p-3.5 rounded-2xl bg-emerald-100/50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-700" />
          <span className="font-semibold">Inverter Frequency Modulation</span>
        </div>
        <span className="font-bold text-emerald-800">
          {ac.state ? `${ac.watts}W Active` : '0W Idle'}
        </span>
      </div>
    </div>
  );
}
