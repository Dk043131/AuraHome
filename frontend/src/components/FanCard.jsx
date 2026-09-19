import React, { useState } from 'react';
import { 
  Fan, 
  Wind, 
  Moon, 
  Sparkles, 
  Activity, 
  RotateCw, 
  AlertCircle, 
  CheckCircle, 
  Wrench, 
  Power,
  TrendingDown,
  Gauge,
  HelpCircle
} from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export default function FanCard({ 
  fan, 
  onToggleState, 
  onSetSpeed, 
  onSetMode, 
  onToggleDirection, 
  onResetCleaning,
  currentLang = 'en'
}) {
  const [showHealthDetails, setShowHealthDetails] = useState(false);
  const t = (key) => getTranslation(currentLang, key);

  const animDuration = fan.state && fan.rpm > 0 ? `${Math.max(0.2, (60 / fan.rpm)).toFixed(2)}s` : '0s';

  const modes = [
    { id: 'manual', label: t('manual'), icon: Gauge, desc: 'Fixed speed' },
    { id: 'natural_breeze', label: t('natural_breeze'), icon: Wind, desc: 'Fluid gust simulation' },
    { id: 'sleep_curve', label: t('sleep_curve'), icon: Moon, desc: 'Steps down overnight' },
    { id: 'auto_comfort', label: t('auto_comfort'), icon: Sparkles, desc: 'Heat index auto-tune' },
  ];

  const getBearingColor = (health) => {
    if (health >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (health >= 65) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-950/5 hover:border-emerald-200 transition-all p-6 sm:p-7 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title & Power Toggle */}
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            fan.state 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            <Fan 
              className={`w-6 h-6 transition-transform ${fan.state ? 'animate-fan-spin' : ''}`}
              style={{ '--fan-duration': animDuration }} 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">{fan.name}</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t('bldc_motor')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {fan.room} • {fan.state ? `${fan.rpm} RPM (${fan.watts}W)` : 'Standby (0.8W)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleState(!fan.state)}
          className={`btn-tactile px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            fan.state
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{fan.state ? t('active') : t('off')}</span>
        </button>
      </div>

      {/* Realistic Interactive Ceiling Fan Visualizer Stage */}
      <div className="relative mb-6 rounded-2xl bg-gradient-to-b from-slate-50 via-emerald-50/30 to-slate-50 border border-emerald-100/80 p-5 flex flex-col items-center justify-center overflow-hidden">
        {/* Soft shadow vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-200/20 pointer-events-none" />

        {/* Dynamic Airflow Wind Particles (shown when running) */}
        {fan.state && fan.rpm > 0 && (
          <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-40">
            <div className="w-0.5 h-10 bg-emerald-400 rounded-full animate-airflow" style={{ animationDelay: '0s' }} />
            <div className="w-0.5 h-14 bg-emerald-500 rounded-full animate-airflow" style={{ animationDelay: '0.3s' }} />
            <div className="w-0.5 h-8 bg-emerald-400 rounded-full animate-airflow" style={{ animationDelay: '0.6s' }} />
            <div className="w-0.5 h-12 bg-emerald-500 rounded-full animate-airflow" style={{ animationDelay: '0.15s' }} />
            <div className="w-0.5 h-9 bg-emerald-400 rounded-full animate-airflow" style={{ animationDelay: '0.45s' }} />
          </div>
        )}

        {/* The 3D Rotating Aerodynamic Ceiling Fan */}
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          {/* Motor Mounting Housing & Drop Rod Ring */}
          <div className="absolute w-20 h-20 rounded-full border border-emerald-200/60 bg-white/80 shadow-inner pointer-events-none" />
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-emerald-200/40 pointer-events-none animate-pulse-subtle" />

          {/* SVG 3-Blade Aerofoil Rotor */}
          <svg 
            viewBox="0 0 200 200" 
            className={`w-32 h-32 transition-transform drop-shadow-md ${fan.state ? 'animate-fan-spin' : ''}`}
            style={{ 
              '--fan-duration': animDuration,
              animationDirection: fan.reverse_direction ? 'reverse' : 'normal'
            }}
          >
            {/* Blade 1 (0 deg) */}
            <g transform="rotate(0 100 100)">
              <path 
                d="M 100,100 L 93,45 C 92,20 108,12 113,35 L 105,100 Z" 
                fill="url(#bladeGradient)" 
                stroke="#059669" 
                strokeWidth="1"
              />
            </g>
            {/* Blade 2 (120 deg) */}
            <g transform="rotate(120 100 100)">
              <path 
                d="M 100,100 L 93,45 C 92,20 108,12 113,35 L 105,100 Z" 
                fill="url(#bladeGradient)" 
                stroke="#059669" 
                strokeWidth="1"
              />
            </g>
            {/* Blade 3 (240 deg) */}
            <g transform="rotate(240 100 100)">
              <path 
                d="M 100,100 L 93,45 C 92,20 108,12 113,35 L 105,100 Z" 
                fill="url(#bladeGradient)" 
                stroke="#059669" 
                strokeWidth="1"
              />
            </g>

            {/* Central Motor Brushed Cap */}
            <circle cx="100" cy="100" r="22" fill="url(#hubGradient)" stroke="#10b981" strokeWidth="2" />
            <circle cx="100" cy="100" r="12" fill="#047857" />
            <circle cx="97" cy="97" r="3" fill="#6ee7b7" opacity="0.8" />

            {/* Gradients */}
            <defs>
              <linearGradient id="bladeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <radialGradient id="hubGradient" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ecfdf5" />
                <stop offset="70%" stopColor="#a7f3d0" />
                <stop offset="100%" stopColor="#34d399" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Live Status Bar Under Fan Visualizer */}
        <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-2 border-t border-emerald-100/60 mt-1">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${fan.state ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
            <span>{fan.state ? `${fan.rpm} RPM (${fan.speed === 0 ? 'OFF' : `Speed ${fan.speed}`})` : 'Motor Idle'}</span>
          </span>
          <span className="text-emerald-700 font-mono">
            {fan.reverse_direction ? '⬆ Winter Updraft' : '⬇ Summer Downdraft'}
          </span>
          <span className="text-slate-500 font-medium">
            Temp: {fan.motor_temp_c}°C
          </span>
        </div>
      </div>

      {/* Primary Telemetry Metrics Row */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 mb-6">
        <div className="text-center">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Speed / RPM</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{fan.state ? fan.rpm : 0}</span>
            <span className="text-xs font-semibold text-emerald-700">RPM</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Level {fan.speed} of 5</span>
        </div>

        <div className="text-center border-x border-emerald-200/60">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">{t('power_draw')}</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{fan.state ? fan.watts : 0.8}</span>
            <span className="text-xs font-semibold text-emerald-700">Watts</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">~₹0.36 / day</span>
        </div>

        <div className="text-center">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">{t('motor_health')}</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-emerald-600">{fan.bearing_health}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Vibe: {fan.vibration_level} mm/s</span>
        </div>
      </div>

      {/* Speed Selector (0 - 5) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t('speed_intensity')}
          </label>
          <span className="text-xs font-semibold text-emerald-700">
            {fan.speed === 0 ? 'Stopped' : `Speed ${fan.speed} (${fan.rpm} RPM)`}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((lvl) => {
            const isSelected = fan.speed === lvl && fan.state;
            return (
              <button
                key={lvl}
                onClick={() => onSetSpeed(lvl)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-200'
                }`}
              >
                {lvl === 0 ? t('off') : `L${lvl}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Unique Smart Modes Grid */}
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          {t('unique_smart_modes')}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = fan.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSetMode(m.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                    : 'bg-white hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    {m.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {fan.mode === 'natural_breeze' && fan.state && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span className="font-semibold">{t('natural_breeze')} Active</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-800">
              Modulating ±25% airflow
            </span>
          </div>
        )}

        {fan.mode === 'sleep_curve' && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold">{t('sleep_curve')} Scheduled</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800">
              Next step down in {fan.sleep_curve_remaining_mins ?? 60}m
            </span>
          </div>
        )}
      </div>

      {/* Advanced Telemetry & Maintenance Accordion */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowHealthDetails(!showHealthDetails)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('diagnostics_maintenance')}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              {showHealthDetails ? 'Hide' : 'Show Details'}
            </span>
          </button>

          <button
            onClick={onToggleDirection}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
            title="Switch direction"
          >
            <RotateCw className="w-3 h-3" />
            <span>{fan.reverse_direction ? t('updraft') : t('downdraft')}</span>
          </button>
        </div>

        {showHealthDetails && (
          <div className="mt-4 space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  {t('motor_health')}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${getBearingColor(fan.bearing_health)}`}>
                  {fan.bearing_health > 90 ? 'Optimal' : 'Warning'} ({fan.bearing_health}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${fan.bearing_health}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Blade Dust Clean Alert</span>
                <span className="font-bold text-emerald-700 text-xs">
                  {Math.round(fan.blade_clean_countdown_hours)} hrs left
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${(fan.blade_clean_countdown_hours / 300) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-500">
                  Total motor runtime: {Math.round(fan.total_runtime_hours)}h
                </span>
                <button
                  onClick={onResetCleaning}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[10px] font-bold text-slate-700 hover:text-emerald-700 cursor-pointer shadow-2xs"
                >
                  Reset Clean Timer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
