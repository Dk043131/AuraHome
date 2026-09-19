import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Sliders, 
  Zap, 
  Terminal, 
  Copy, 
  Check, 
  AlertTriangle, 
  Wifi, 
  ArrowRight,
  Sparkles,
  Play
} from 'lucide-react';

export default function HardwareSimulatorModal({ 
  isOpen, 
  onClose, 
  env = {}, 
  hardware = {}, 
  onInject 
}) {
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator', 'wiring', 'payload'
  const [copied, setCopied] = useState(false);
  
  const [simTemp, setSimTemp] = useState(env.temp_c || 28.5);
  const [simHum, setSimHum] = useState(env.humidity_pct || 62);
  const [simLux, setSimLux] = useState(env.lux || 350);

  if (!isOpen) return null;

  const handleApplySliders = () => {
    onInject({ temp: Number(simTemp), humidity: Number(simHum), lux: Number(simLux) });
  };

  const sampleArduinoCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* SERVER_URL = "http://192.168.1.100:8000/api/hardware/bridge";

void sendTelemetry() {
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["device_id"] = "esp32-node-01";
  doc["device_type"] = "fan";
  doc["watts"] = 32.5;
  doc["ambient_lux"] = 420;
  doc["ambient_temp"] = 28.2;

  String body;
  serializeJson(doc, body);
  int code = http.POST(body);
  http.end();
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-white to-green-50/50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hardware Bridge & Sensor Simulator</h2>
              <p className="text-xs text-slate-500 font-medium">
                Bridge physical ESP32 / Arduino hardware or inject live virtual telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-white px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Virtual Sensor Injection</span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'wiring'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Physical Hardware & Pins</span>
          </button>

          <button
            onClick={() => setActiveTab('payload')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'payload'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API & JSON Spec</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Interactive Sensor Breadboard</span>
                  <span className="text-slate-600">
                    Slide values below to watch how the Smart Fan Auto-Comfort and Light Daylight-Harvesting react instantly.
                  </span>
                </div>
                <button
                  onClick={handleApplySliders}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>Push Values</span>
                </button>
              </div>

              {/* Slider 1: Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Room Ambient Temperature</span>
                  <span className="text-emerald-700">{simTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="40"
                  step="0.5"
                  value={simTemp}
                  onChange={(e) => {
                    setSimTemp(e.target.value);
                    onInject({ temp: Number(e.target.value) });
                  }}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-[10px] text-slate-400">
                  Try setting &gt; 32°C: The Fan Auto-Comfort mode will automatically ramp up to Speed 5!
                </span>
              </div>

              {/* Slider 2: Humidity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Room Relative Humidity</span>
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
                <span className="text-[10px] text-slate-400">
                  Higher humidity increases the Perceived Heat Index.
                </span>
              </div>

              {/* Slider 3: Ambient Lux */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Ambient Natural Daylight (Lux)</span>
                  <span className="text-emerald-700">{simLux} Lux</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="20"
                  value={simLux}
                  onChange={(e) => {
                    setSimLux(e.target.value);
                    onInject({ lux: Number(e.target.value) });
                  }}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-[10px] text-slate-400">
                  Try sliding to 600+ Lux: Smart Light Daylight-Harvesting will automatically dim to save power!
                </span>
              </div>

              {/* Anomaly Injection Buttons */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
                  Simulate Real-World Hardware Faults & Anomaly Tests
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => onInject({ fan_bearing_degrade: true })}
                    className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-left transition-all cursor-pointer flex items-center gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-950 block">Inject Bearing Friction</span>
                      <span className="text-[10px] text-amber-800">
                        Increases motor vibration & wattage draw to test health warning
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => onInject({ simulate_spike: true })}
                    className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-left transition-all cursor-pointer flex items-center gap-3"
                  >
                    <Zap className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-rose-950 block">Simulate Grid Voltage Surge</span>
                      <span className="text-[10px] text-rose-800">
                        Pikes grid to 252V to verify surge warning notification
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wiring' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-bold text-slate-900 block">ESP32 Hardware Bridge Online</span>
                    <span className="text-slate-600">IP: {hardware.ip || '192.168.1.145'} • Latency: {hardware.latency_ms || 14}ms</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  HTTP & WebSocket Sync
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Recommended ESP32 Pin Assignment
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">GPIO 18</span>
                    <span className="font-bold text-slate-800">Fan Main Relay</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">GPIO 19</span>
                    <span className="font-bold text-slate-800">Fan Speed PWM / Tap</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">GPIO 22</span>
                    <span className="font-bold text-slate-800">Light Dimmer / Relay</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">GPIO 34 (ADC)</span>
                    <span className="font-bold text-slate-800">LDR Ambient Lux</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">GPIO 35 (ADC)</span>
                    <span className="font-bold text-slate-800">ACS712 / CT Clamp</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">GPIO 4 (1-Wire)</span>
                    <span className="font-bold text-slate-800">DHT22 Temp & Humidity</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Arduino / ESP32 Starter Sketch
                  </span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-44 border border-slate-800">
                  {sampleArduinoCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'payload' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Any hardware device (ESP32, ESP8266, Raspberry Pi, Python script, or Home Assistant) can push telemetry to this software hub at:
              </p>
              <div className="p-3 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800 border border-slate-200">
                POST /api/hardware/bridge
              </div>
              <span className="font-bold text-slate-800 block">Example JSON Payload:</span>
              <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`{
  "device_id": "esp32-node-01",
  "device_type": "fan",
  "voltage": 230.5,
  "watts": 32.5,
  "ambient_temp": 28.5,
  "ambient_humidity": 62.0,
  "ambient_lux": 420.0,
  "vibration": 0.82
}`}
              </pre>
              <p className="text-[11px] text-slate-500">
                The hub acknowledges receipt with current target pin states (<code>fan_state</code>, <code>light_state</code>) to actuate your relays!
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
