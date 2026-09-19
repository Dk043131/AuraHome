import React, { useState } from 'react';
import { 
  Lightbulb, 
  Sun, 
  Sunrise, 
  Moon, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  Power,
  Leaf,
  Eye,
  Flame,
  Tv,
  BookOpen
} from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export default function LightCard({ 
  light, 
  ambientLux = 350, 
  onToggleState, 
  onSetBrightness, 
  onSetColorTemp, 
  onSetMode, 
  onSetScene,
  currentLang = 'en'
}) {
  const [showLedDiagnostics, setShowLedDiagnostics] = useState(false);
  const t = (key) => getTranslation(currentLang, key);

  const scenes = [
    { id: 'focus', label: t('deep_focus'), icon: Eye, temp: 5500, bright: 100 },
    { id: 'reading', label: t('reading'), icon: BookOpen, temp: 4200, bright: 85 },
    { id: 'relax', label: t('relaxation'), icon: Sun, temp: 2800, bright: 45 },
    { id: 'movie', label: t('cinema_mode'), icon: Tv, temp: 2400, bright: 20 },
    { id: 'candlelight', label: t('candlelight'), icon: Flame, temp: 2000, bright: 15 },
  ];

  const getKelvinColorStyle = (kelvin) => {
    if (kelvin < 2500) return '#ff8c3b';
    if (kelvin < 3200) return '#ffa959';
    if (kelvin < 4200) return '#ffd299';
    if (kelvin < 5200) return '#f4f5f8';
    return '#cce3ff';
  };

  const wattsSavedNow = light.state ? (light.baseline_incandescent_watts - light.watts).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-950/5 hover:border-emerald-200 transition-all p-6 sm:p-7 relative overflow-hidden">
      <div 
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-30"
        style={{ backgroundColor: light.state ? getKelvinColorStyle(light.color_temp) : 'transparent' }}
      />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="flex items-center gap-3.5">
          <div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              light.state 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">{light.name}</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Aura LED
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {light.room} • {light.state ? `${light.brightness}% (${light.color_temp}K)` : 'Standby (0.3W)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleState(!light.state)}
          className={`btn-tactile px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            light.state
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{light.state ? t('active') : t('off')}</span>
        </button>
      </div>

      {/* Realistic Smart Pendant Lamp Visualizer Stage */}
      <div className="relative mb-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border border-slate-700/60 p-5 flex flex-col items-center justify-center overflow-hidden min-h-[160px] shadow-inner">
        
        {/* Dynamic Diffuse Light Bloom Cone (Kelvin & Brightness Dependent) */}
        {light.state && (
          <div 
            className="absolute top-4 w-72 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-700 animate-light-bloom"
            style={{ 
              backgroundColor: getKelvinColorStyle(light.color_temp),
              opacity: Math.max(0.2, (light.brightness / 100) * 0.75)
            }}
          />
        )}

        {/* Hanging Cord */}
        <div className="w-0.5 h-6 bg-slate-600 relative z-10" />

        {/* Lamp Fixture & Bulb */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Metallic Socket Cap */}
          <div className="w-8 h-3 rounded-t-sm bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 border border-slate-500 shadow-sm" />
          
          {/* Glass / Polycarbonate Diffuser Bulb */}
          <div 
            className={`w-14 h-16 rounded-b-full transition-all duration-500 flex items-center justify-center relative shadow-lg ${
              light.state ? 'ring-4' : 'bg-slate-700/80 border border-slate-600'
            }`}
            style={{
              backgroundColor: light.state ? getKelvinColorStyle(light.color_temp) : '#334155',
              boxShadow: light.state 
                ? `0 0 ${light.brightness * 0.5}px ${getKelvinColorStyle(light.color_temp)}, 0 10px 30px rgba(0,0,0,0.5)`
                : 'none',
              borderColor: light.state ? getKelvinColorStyle(light.color_temp) : '#475569'
            }}
          >
            {/* Glowing Internal Filament / Core */}
            {light.state ? (
              <div 
                className="w-3 h-5 rounded-full blur-[1px] bg-white opacity-90 animate-pulse-subtle"
                style={{
                  boxShadow: `0 0 12px #ffffff`
                }}
              />
            ) : (
              <div className="w-2 h-4 rounded-full border border-slate-500/40" />
            )}
          </div>
        </div>

        {/* Illuminated Floor / Surface Projection Bar */}
        <div className="relative z-10 w-full flex items-center justify-between text-[11px] font-semibold text-slate-300 pt-3 border-t border-slate-700/50 mt-4">
          <span className="flex items-center gap-1.5">
            <span 
              className={`w-2 h-2 rounded-full ${light.state ? 'animate-ping' : 'bg-slate-600'}`}
              style={{ backgroundColor: light.state ? getKelvinColorStyle(light.color_temp) : '#475569' }}
            />
            <span>{light.state ? `${light.color_temp}K (${light.brightness}% Glow)` : 'LED Standby'}</span>
          </span>
          <span className="text-emerald-400 font-mono">
            {light.state ? `${light.current_lux} Lux` : '0 Lux'}
          </span>
          <span className="text-slate-400 font-medium">
            Diode: {light.junction_temp_c}°C
          </span>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 mb-6">
        <div className="text-center">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">{t('color_temp')}</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{light.state ? light.color_temp : 0}</span>
            <span className="text-xs font-semibold text-emerald-700">K</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {light.color_temp < 3000 ? 'Warm Amber' : light.color_temp < 5000 ? 'Neutral Day' : 'Cool Daylight'}
          </span>
        </div>

        <div className="text-center border-x border-emerald-200/60">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">{t('power_draw')}</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{light.state ? light.watts : 0.3}</span>
            <span className="text-xs font-semibold text-emerald-700">Watts</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-0.5">
            <Leaf className="w-3 h-3 text-emerald-600" /> -{wattsSavedNow}W saved
          </span>
        </div>

        <div className="text-center">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Illumination</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-emerald-600">{light.state ? light.current_lux : 0}</span>
            <span className="text-xs font-semibold text-emerald-700">Lux</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Target: 500 Lux</span>
        </div>
      </div>

      {/* Autonomous Light Modes */}
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Autonomous Light Modes
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSetMode('circadian')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              light.mode === 'circadian'
                ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                : 'bg-white hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Sunrise className={`w-4 h-4 ${light.mode === 'circadian' ? 'text-emerald-700' : 'text-slate-500'}`} />
              {light.mode === 'circadian' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">{t('circadian_sync')}</span>
              <span className="text-[10px] text-slate-500 leading-tight block">Follows Sun Arc</span>
            </div>
          </button>

          <button
            onClick={() => onSetMode('daylight_harvesting')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              light.mode === 'daylight_harvesting'
                ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                : 'bg-white hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Sun className={`w-4 h-4 ${light.mode === 'daylight_harvesting' ? 'text-emerald-700' : 'text-slate-500'}`} />
              {light.mode === 'daylight_harvesting' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">{t('daylight_auto')}</span>
              <span className="text-[10px] text-slate-500 leading-tight block">Harvests Sun Lux</span>
            </div>
          </button>

          <button
            onClick={() => onSetMode('manual')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              light.mode === 'manual' || light.mode === 'scene'
                ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                : 'bg-white hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Sliders className={`w-4 h-4 ${light.mode === 'manual' ? 'text-emerald-700' : 'text-slate-500'}`} />
              {(light.mode === 'manual' || light.mode === 'scene') && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">{t('custom_studio')}</span>
              <span className="text-[10px] text-slate-500 leading-tight block">Manual & Scenes</span>
            </div>
          </button>
        </div>

        {light.mode === 'circadian' && (
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-100/50 border border-emerald-200 text-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-emerald-700" /> {t('circadian_sync')} Active
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                Current: {light.color_temp}K ({light.brightness}%)
              </span>
            </div>
            <div className="h-2 rounded-full w-full bg-gradient-to-r from-amber-600 via-amber-200 via-blue-200 to-amber-700 relative">
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-600 shadow-sm"
                style={{ left: `${Math.min(95, Math.max(5, ((light.color_temp - 2000) / 4500) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold mt-1">
              <span>Dawn (2200K)</span>
              <span>Midday (6200K)</span>
              <span>Dusk (2700K)</span>
              <span>Sleep (2000K)</span>
            </div>
          </div>
        )}

        {light.mode === 'daylight_harvesting' && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-100/50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <span className="font-semibold">Ambient Light: {Math.round(ambientLux)} Lux</span>
            <span className="font-bold text-emerald-800">
              Auto-dimmed to {light.brightness}% to conserve power
            </span>
          </div>
        )}
      </div>

      {/* Sliders for Brightness and Kelvin */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700 uppercase tracking-wider">{t('brightness_intensity')}</span>
            <span className="text-emerald-700">{light.brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={light.brightness}
            onChange={(e) => onSetBrightness(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700 uppercase tracking-wider">{t('color_temp')}</span>
            <span className="text-emerald-700">{light.color_temp}K</span>
          </div>
          <input
            type="range"
            min="2000"
            max="6500"
            step="50"
            value={light.color_temp}
            onChange={(e) => onSetColorTemp(Number(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-amber-500 via-amber-200 via-blue-100 to-sky-300 rounded-lg appearance-none cursor-pointer accent-emerald-700"
          />
        </div>
      </div>

      {/* Ambiance Scene Presets */}
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          {t('quick_ambiance')}
        </label>
        <div className="flex flex-wrap gap-2">
          {scenes.map((sc) => {
            const Icon = sc.icon;
            const isSelected = light.scene === sc.id && light.mode === 'scene';
            return (
              <button
                key={sc.id}
                onClick={() => onSetScene(sc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LED Health & Energy Diagnostics Accordion */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={() => setShowLedDiagnostics(!showLedDiagnostics)}
          className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>LED Diode Lifespan & Thermal Guard</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
            {showLedDiagnostics ? 'Hide' : `${light.led_health}% Life`}
          </span>
        </button>

        {showLedDiagnostics && (
          <div className="mt-4 space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700">Remaining Diode Health</span>
                <span className="font-bold text-emerald-700">{light.led_health}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${light.led_health}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-slate-600">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Burn Hours</span>
                <span className="text-sm font-bold text-slate-800">{Math.round(light.total_burn_hours)} hrs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Junction Temp</span>
                <span className="text-sm font-bold text-emerald-700">{light.junction_temp_c}°C (Cool)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-100/50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2 font-medium">
              <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Cumulative lifetime energy savings: <strong>{light.saved_kwh_total} kWh</strong> compared to standard bulbs.
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
