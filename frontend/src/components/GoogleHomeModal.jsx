import React from 'react';
import { 
  X, 
  CheckCircle2, 
  HelpCircle, 
  Mic, 
  Smartphone, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function GoogleHomeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-white to-green-50/50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Google Home & Assistant Bridge</h2>
              <p className="text-xs text-slate-500 font-medium">
                How your hardware connects with Google Home and this Telemetry Hub
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Architecture diagram cards */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Mic className="w-4 h-4 text-emerald-700" />
              <span>Google Home Voice / App</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 hidden sm:block" />
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>Your Hardware (ESP32)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 hidden sm:block" />
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <Zap className="w-4 h-4 text-emerald-700" />
              <span>AuraHome Telemetry Hub</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Why use this software alongside Google Home?
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Google Home Role</span>
                <p className="text-slate-500 leading-relaxed">
                  Excellent for instant voice activation ("Hey Google, turn on Living Room Fan") and basic speed/brightness switches.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <span className="font-bold text-emerald-950 block mb-1">AuraHome Hub Role</span>
                <p className="text-emerald-900 leading-relaxed">
                  Delivers everything Google Home lacks: RPM gauges, motor bearing health, sleep wind curves, circadian 24h lighting, and exact wattage & electricity bill analytics.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-800">How to sync them:</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                <li>
                  <strong>Direct ESP32 Dual-Reporting:</strong> Your ESP32 firmware connects to your local Wi-Fi and pushes telemetry to AuraHome via HTTP/WebSockets while registering with Google Home via Sinric Pro or Blynk/Matter.
                </li>
                <li>
                  <strong>Zero-Delay Bidirectional Sync:</strong> When you tell Google Home to change fan speed, the ESP32 acts immediately and reports the new RPM and wattage to this software hub within 14ms!
                </li>
              </ol>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
