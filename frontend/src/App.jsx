import React, { useState, useEffect, useRef, Component } from 'react';
import Navbar from './components/Navbar';
import VoiceHub from './components/VoiceHub';
import VirtualHardwareLab from './components/VirtualHardwareLab';
import FanCard from './components/FanCard';
import LightCard from './components/LightCard';
import ClimateCard from './components/ClimateCard';
import EnergyAnalytics from './components/EnergyAnalytics';
import GoogleHomeModal from './components/GoogleHomeModal';
import { 
  Sparkles, 
  Home, 
  Layers, 
  Activity, 
  RefreshCw,
  Cpu,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Zap,
  Mic
} from 'lucide-react';

const initialDevices = {
  fan: {
    id: "fan-living",
    name: "AeroBreeze Pro Smart Fan",
    room: "Living Room",
    state: true,
    speed: 3,
    mode: "manual",
    rpm: 235,
    target_rpm: 240,
    watts: 32.5,
    vibration_level: 0.82,
    bearing_health: 96.0,
    blade_clean_countdown_hours: 280.0,
    total_runtime_hours: 1420.5,
    reverse_direction: false,
    sleep_curve_remaining_mins: null,
    motor_temp_c: 38.2
  },
  light: {
    id: "light-living",
    name: "Lumina Aura Adaptive Lighting",
    room: "Living Room",
    state: true,
    brightness: 80,
    color_temp: 4000,
    rgb_color: "#FFAA55",
    mode: "circadian",
    scene: "focus",
    current_lux: 320.0,
    led_health: 94.5,
    total_burn_hours: 3850.0,
    watts: 11.2,
    baseline_incandescent_watts: 75.0,
    saved_kwh_total: 245.8,
    junction_temp_c: 46.2
  },
  ac: {
    id: "ac-master",
    name: "Dual-Inverter Smart AC",
    room: "Master Bedroom",
    state: false,
    set_temp: 24,
    room_temp: 27.8,
    room_humidity: 64.0,
    mode: "cool",
    fan_speed: "auto",
    watts: 1.2,
    compressor_load_pct: 0,
    filter_health_pct: 88.0,
    energy_saving_ratio: 34.0
  },
  plug: {
    id: "plug-workstation",
    name: "Smart Metering Plug",
    room: "Home Office",
    state: true,
    appliance_type: "Workstation PC & Peripherals",
    watts: 142.5,
    voltage: 231.4,
    current_amp: 0.62,
    power_factor: 0.96,
    daily_kwh: 1.84,
    vampire_draw_detected: false
  },
  environment: {
    temp_c: 28.2,
    humidity_pct: 61.5,
    lux: 380.0,
    grid_voltage: 230.5
  },
  hardware_bridge: {
    connected: true,
    ip: "Pure Software MCU (Integrated)",
    last_seen_epoch: 0,
    google_home_synced: true,
    latency_ms: 1
  },
  recent_events: [
    { time: "Live", type: "VOICE", msg: "AuraHome Voice AI Engine Ready" },
    { time: "Live", type: "SOFTWARE", msg: "100% Software Integrated MCU Loop Active" }
  ]
};

const initialEnergy = {
  total_instant_watts: 187.4,
  daily_kwh: 2.7,
  daily_cost_est: 22.95,
  rate_per_kwh: 8.5,
  saved_kwh_today: 0.45,
  breakdown: [
    { name: "Living Fan", watts: 32.5, pct: 17.5 },
    { name: "Living Light", watts: 11.2, pct: 6.0 },
    { name: "Bedroom AC", watts: 1.2, pct: 0.6 },
    { name: "Workstation Plug", watts: 142.5, pct: 75.9 }
  ],
  carbon_offset_kg: 2.21,
  power_factor_avg: 0.95
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-50/40 p-6">
          <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-4">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [devices, setDevices] = useState(initialDevices);
  const [energy, setEnergy] = useState(initialEnergy);
  const [mainTab, setMainTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (['voice', 'appliances', 'hardware', 'energy'].includes(t)) return t;
    } catch (e) {}
    return 'voice';
  }); // 'voice', 'appliances', 'hardware', 'energy'
  const [roomFilter, setRoomFilter] = useState('all'); // 'all', 'living', 'bedroom'
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const wsRef = useRef(null);
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('aurahome_lang') || 'en';
  });

  const handleSelectLang = (code) => {
    setCurrentLang(code);
    localStorage.setItem('aurahome_lang', code);
  };

  const fetchState = async () => {
    try {
      const resDev = await fetch('/api/devices');
      if (resDev.ok) {
        const data = await resDev.json();
        if (data && data.fan) setDevices(data);
      }
      const resEnergy = await fetch('/api/energy/summary');
      if (resEnergy.ok) {
        const energyData = await resEnergy.json();
        if (energyData && energyData.total_instant_watts !== undefined) setEnergy(energyData);
      }
    } catch (e) {
      console.log('Using local fallback state:', e);
    }
  };

  useEffect(() => {
    fetchState();

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.devices) setDevices(data.devices);
            if (data.energy) setEnergy(data.energy);
          } catch (err) {
            console.error('Error parsing WS telemetry:', err);
          }
        };

        socket.onclose = () => {
          setTimeout(connectWs, 2000);
        };

        socket.onerror = () => {
          socket.close();
        };

        wsRef.current = socket;
      } catch (e) {
        console.error("WS error:", e);
      }
    };

    connectWs();
    const interval = setInterval(fetchState, 3000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // --- Handlers ---
  const handleToggleFan = async (newState) => {
    setDevices(prev => ({ ...prev, fan: { ...prev.fan, state: newState } }));
    try {
      await fetch('/api/devices/fan/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleSetFanSpeed = async (speed) => {
    setDevices(prev => ({ ...prev, fan: { ...prev.fan, speed, state: speed > 0 ? true : prev.fan.state } }));
    try {
      await fetch('/api/devices/fan/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleSetFanMode = async (mode) => {
    setDevices(prev => ({ ...prev, fan: { ...prev.fan, mode } }));
    try {
      await fetch('/api/devices/fan/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, sleep_timer_mins: 120 })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleToggleFanDirection = async () => {
    setDevices(prev => ({ ...prev, fan: { ...prev.fan, reverse_direction: !prev.fan.reverse_direction } }));
    try {
      await fetch('/api/devices/fan/direction', { method: 'POST' });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleResetFanCleaning = async () => {
    setDevices(prev => ({ ...prev, fan: { ...prev.fan, blade_clean_countdown_hours: 300 } }));
    try {
      await fetch('/api/devices/fan/reset_cleaning', { method: 'POST' });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleToggleLight = async (newState) => {
    setDevices(prev => ({ ...prev, light: { ...prev.light, state: newState } }));
    try {
      await fetch('/api/devices/light/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleSetLightBrightness = async (brightness) => {
    setDevices(prev => ({ ...prev, light: { ...prev.light, brightness, state: brightness > 0 ? true : prev.light.state } }));
    try {
      await fetch('/api/devices/light/brightness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brightness })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleSetLightColorTemp = async (color_temp) => {
    setDevices(prev => ({ ...prev, light: { ...prev.light, color_temp, mode: 'manual' } }));
    try {
      await fetch('/api/devices/light/colortemp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color_temp })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleSetLightMode = async (mode) => {
    setDevices(prev => ({ ...prev, light: { ...prev.light, mode } }));
    try {
      await fetch('/api/devices/light/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleSetLightScene = async (scene) => {
    setDevices(prev => ({ ...prev, light: { ...prev.light, mode: 'scene', scene } }));
    try {
      await fetch('/api/devices/light/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'scene', scene })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleToggleAC = async (newState) => {
    setDevices(prev => ({ ...prev, ac: { ...prev.ac, state: newState } }));
    try {
      await fetch('/api/devices/ac/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleSetACTemp = async (temp) => {
    setDevices(prev => ({ ...prev, ac: { ...prev.ac, set_temp: temp } }));
    try {
      await fetch('/api/devices/ac/temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp })
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleInjectSimulator = async (payload) => {
    try {
      await fetch('/api/simulator/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchState();
    } catch (e) { console.error(e); }
  };

  const handleVoiceCommandExecuted = (data) => {
    if (data.devices) setDevices(data.devices);
    if (data.energy) setEnergy(data.energy);
  };

  const { fan, light, ac, environment, hardware_bridge, recent_events } = devices;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/50 via-white to-green-50/30 font-sans">
      
      {/* Sticky Header with prominent Voice Tab navigation */}
      <Navbar 
        env={environment}
        hardware={hardware_bridge}
        activeTab={mainTab}
        onSelectTab={(t) => setMainTab(t)}
        onOpenGoogleModal={() => setGoogleModalOpen(true)}
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
      />

      {/* Main Content View based on activeTab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: THE BIG VOICE TAB */}
        {mainTab === 'voice' && (
          <VoiceHub 
            onExecuteCommand={handleVoiceCommandExecuted}
            currentLang={currentLang}
            onSelectLang={handleSelectLang}
          />
        )}

        {/* TAB 2: SMART APPLIANCES */}
        {mainTab === 'appliances' && (
          <div className="space-y-8 animate-fade-in">
            {/* Room Filter Pills */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Appliances' },
                  { id: 'living', label: 'Living Room' },
                  { id: 'bedroom', label: 'Master Bedroom' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRoomFilter(tab.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      roomFilter === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-emerald-50/60 text-slate-600 border border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMainTab('voice')}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open Voice AI</span>
              </button>
            </div>

            {/* Grid of Appliance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(roomFilter === 'all' || roomFilter === 'living') && fan && (
                <FanCard 
                  fan={fan}
                  onToggleState={handleToggleFan}
                  onSetSpeed={handleSetFanSpeed}
                  onSetMode={handleSetFanMode}
                  onToggleDirection={handleToggleFanDirection}
                  onResetCleaning={handleResetFanCleaning}
                />
              )}

              {(roomFilter === 'all' || roomFilter === 'living') && light && (
                <LightCard 
                  light={light}
                  ambientLux={environment?.lux ?? 350}
                  onToggleState={handleToggleLight}
                  onSetBrightness={handleSetLightBrightness}
                  onSetColorTemp={handleSetLightColorTemp}
                  onSetMode={handleSetLightMode}
                  onSetScene={handleSetLightScene}
                />
              )}

              {(roomFilter === 'all' || roomFilter === 'bedroom') && ac && (
                <ClimateCard 
                  ac={ac}
                  onToggleState={handleToggleAC}
                  onSetTemp={handleSetACTemp}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 100% SOFTWARE-INTEGRATED HARDWARE LAB */}
        {mainTab === 'hardware' && (
          <VirtualHardwareLab 
            devices={devices}
            env={environment}
            hardware={hardware_bridge}
            onInject={handleInjectSimulator}
            onToggleFan={handleToggleFan}
            onToggleLight={handleToggleLight}
          />
        )}

        {/* TAB 4: ENERGY TELEMETRY */}
        {mainTab === 'energy' && (
          <div className="space-y-8 animate-fade-in">
            <EnergyAnalytics 
              energy={energy}
              events={recent_events}
            />
          </div>
        )}

      </main>

      {/* Google Home Bridge Info Modal */}
      <GoogleHomeModal 
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 py-6 text-center text-xs text-slate-500 font-medium mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">AuraHome Voice & Software Hub</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">White & Light Green Edition</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>100% Software Integrated</span>
            <span>•</span>
            <span>Web Speech API Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
