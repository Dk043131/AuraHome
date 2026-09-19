import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Radio, 
  Sliders, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertTriangle, 
  Thermometer, 
  Sun, 
  Droplets,
  RotateCw,
  Power
} from 'lucide-react';

export default function VirtualHardwareLab({ 
  devices = {}, 
  env = {}, 
  hardware = {}, 
  onInject,
  onToggleFan,
  onToggleLight
}) {
  const fan = devices.fan || {};
  const light = devices.light || {};
  const ac = devices.ac || {};

  const [simTemp, setSimTemp] = useState(env.temp_c ?? 28.5);
  const [simHum, setSimHum] = useState(env.humidity_pct ?? 60);
  const [simLux, setSimLux] = useState(env.lux ?? 380);
  const [copied, setCopied] = useState(false);

  // Pin statuses derived from device states
  const pins = [
    {
      pin: "GPIO 18",
      name: "Fan Power Relay",
      type: "DIGITAL OUTPUT",
      active: fan.state,
      value: fan.state ? "HIGH (3.3V) -> 230V Relay CLOSED" : "LOW (0V) -> Relay OPEN",
      color: fan.state ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600",
      desc: "Switches main 230V AC line to ceiling fan"
    },
    {
      pin: "GPIO 19",
      name: "Fan Speed PWM / BLDC",
      type: "PWM OUTPUT (8-Bit)",
      active: fan.state && fan.speed > 0,
      value: fan.state ? `Duty: ${Math.round((fan.speed / 5) * 255)} / 255 (${fan.rpm} RPM)` : "Duty: 0 / 255 (0 RPM)",
      color: fan.state && fan.speed > 0 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600",
      desc: "Modulates BLDC motor driver speed"
    },
    {
      pin: "GPIO 22",
      name: "Light Relay",
      type: "DIGITAL OUTPUT",
      active: light.state,
      value: light.state ? "HIGH (3.3V) -> Relay CLOSED" : "LOW (0V) -> Relay OPEN",
      color: light.state ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600",
      desc: "Switches main power to lighting driver"
    },
    {
      pin: "GPIO 23",
      name: "Light Dimmer PWM",
      type: "PWM OUTPUT (8-Bit)",
      active: light.state && light.brightness > 0,
      value: light.state ? `Duty: ${Math.round((light.brightness / 100) * 255)} / 255 (${light.brightness}%)` : "Duty: 0 / 255",
      color: light.state && light.brightness > 0 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600",
      desc: "PWM dimming driver signal"
    },
    {
      pin: "GPIO 4",
      name: "DHT22 Climate Sensor",
      type: "1-WIRE BIDIRECTIONAL",
      active: true,
      value: `${env.temp_c ?? 28.2}°C • ${env.humidity_pct ?? 61}% RH`,
      color: "bg-emerald-500 text-white",
      desc: "Provides temperature & humidity for Thermal Comfort Index"
    },
    {
      pin: "GPIO 34",
      name: "LDR Daylight Photocell",
      type: "ANALOG INPUT (ADC1)",
      active: true,
      value: `${Math.round(env.lux ?? 350)} Lux (ADC: ${Math.round((env.lux / 1000) * 4095)})`,
      color: "bg-amber-500 text-white",
      desc: "Powers Daylight Harvesting Auto-Dimming"
    },
    {
      pin: "GPIO 35",
      name: "ACS712 / CT Current Clamp",
      type: "ANALOG INPUT (ADC1)",
      active: true,
      value: `${fan.watts ? (fan.watts / 230).toFixed(2) : 0.15}A (${fan.watts ?? 32.5}W)`,
      color: "bg-emerald-500 text-white",
      desc: "Real-time AC power measurement & bearing friction detection"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-7 shadow-sm shadow-emerald-950/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">100% Software-Integrated Hardware Lab</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Virtual ESP32 Node
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              All physical relays, PWM generators, ADC sensors, and motor controllers run right inside software.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Virtual MCU Loop Active (50Hz)</span>
        </div>
      </div>

      {/* Main Grid: Pin Inspector & Interactive Breadboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Virtual ESP32 MCU Pin Header (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-emerald-100 p-6 sm:p-7 shadow-sm shadow-emerald-950/5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Virtual GPIO Pin Header</h3>
              <p className="text-xs text-slate-500">Live logic levels, PWM duty cycles & ADC voltages</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">ESP32-WROOM-32D</span>
          </div>

          <div className="space-y-3">
            {pins.map((p, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  p.active 
                    ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs' 
                    : 'bg-slate-50/60 border-slate-200/80 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 font-mono text-[10px]">
                      {p.pin}
                    </span>
                    <span className="text-slate-800">{p.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.color}`}>
                    {p.active ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                  <span className="font-mono font-semibold text-emerald-900 text-[11px]">
                    {p.value}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.type}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Virtual Hardware Breadboard Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive Environmental Controls */}
          <div className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-7 shadow-sm shadow-emerald-950/5 space-y-5">
            <div>
              <h3 className="font-bold text-base text-slate-900">Virtual Environment Injector</h3>
              <p className="text-xs text-slate-500 font-medium">
                Simulate temperature, humidity, and daylight without physical sensors
              </p>
            </div>

            {/* Slider 1: Temp */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                  Room Temp (DHT22)
                </span>
                <span className="text-emerald-700">{simTemp}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="40"
                step="0.5"
                value={simTemp}
                onChange={(e) => {
                  setSimTemp(e.target.value);
                  onInject({ temp: Number(e.target.value) });
                }}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-[10px] text-slate-400 block">
                Adjusts Heat Index; fan Auto-Comfort will ramp up when hot.
              </span>
            </div>

            {/* Slider 2: Humidity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                  Humidity (DHT22)
                </span>
                <span className="text-emerald-700">{simHum}% RH</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="1"
                value={simHum}
                onChange={(e) => {
                  setSimHum(e.target.value);
                  onInject({ humidity: Number(e.target.value) });
                }}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Slider 3: Lux */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Daylight Sunlight (LDR)
                </span>
                <span className="text-emerald-700">{simLux} Lux</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={simLux}
                onChange={(e) => {
                  setSimLux(e.target.value);
                  onInject({ lux: Number(e.target.value) });
                }}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-[10px] text-slate-400 block">
                Light Daylight Harvesting auto-dims as sunlight increases.
              </span>
            </div>

            {/* Fault & Anomaly Injection */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Hardware Fault Simulators
              </span>
              
              <button
                onClick={() => onInject({ fan_bearing_degrade: true })}
                className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-left transition-all cursor-pointer flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-950 block">Inject Bearing Wear</span>
                  <span className="text-[10px] text-amber-800">
                    Increases motor vibration & wattage draw to trigger bearing alert
                  </span>
                </div>
              </button>

              <button
                onClick={() => onInject({ simulate_spike: true })}
                className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-left transition-all cursor-pointer flex items-center gap-3"
              >
                <Zap className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-rose-950 block">Grid Voltage Surge (252V)</span>
                  <span className="text-[10px] text-rose-800">
                    Spikes AC voltage to test protective surge cutoff warning
                  </span>
                </div>
              </button>
            </div>

          </div>

          {/* Quick Manual Relay Click Switches */}
          <div className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-7 shadow-sm shadow-emerald-950/5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Virtual Relay Coil Overrides
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onToggleFan(!fan.state)}
                className={`p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  fan.state
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>Fan Relay: {fan.state ? 'CLOSED' : 'OPEN'}</span>
              </button>

              <button
                onClick={() => onToggleLight(!light.state)}
                className={`p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  light.state
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>Light Relay: {light.state ? 'CLOSED' : 'OPEN'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
