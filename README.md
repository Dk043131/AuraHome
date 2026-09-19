# 🌿 AuraHome — Multilingual Voice AI Smart Home Studio

> **Voice AI & Hardware Integrated 100% in Software.**
> A next-generation smart home platform combining real-time contextual voice intelligence, multilingual regional Speech-to-Text (STT) and Text-to-Speech (TTS), deep appliance health telemetry, and virtual/physical ESP32 microcontroller synchronization.
>
> Designed with a clean, modern **White and Light Green** eco-aesthetic.

---

## 🌟 Key Capabilities

### 🎙️ 1. Multilingual Voice AI Studio
- **Dual-Engine Speech Recognition**: Primary real-time Web Speech API with automatic HTML5 `MediaRecorder` fallback (`getUserMedia`), guaranteeing 100% compatibility across Safari, Chrome, Firefox, and mobile browsers.
- **8 Regional Indian Languages Supported**:
  - English (`en-IN`)
  - Tamil (`ta-IN` / தமிழ்)
  - Hindi (`hi-IN` / हिन्दी)
  - Telugu (`te-IN` / తెలుగు)
  - Kannada (`kn-IN` / ಕನ್ನಡ)
  - Malayalam (`ml-IN` / മലയാളം)
  - Bengali (`bn-IN` / বাংলা)
  - Marathi (`mr-IN` / मराठी)
- **Voice Output (TTS)**: Authentic native speech feedback in all 8 languages with mute/unmute control.
- **1-Click Instant Voice Test Chips**: Test voice commands instantly with zero microphone friction.
- **Contextual Intent Engine**: Interprets complex natural language queries (e.g., *"turn fan to natural breeze"*, *"ஃபேன் போடு"*, *"மின் பயன்பாடு எவ்வளவு"*).

### 💨 2. Smart Fan Intelligence (AeroBreeze Pro)
- **3D Aerodynamic Physics Animation**: Real-time rotating blades, dynamic wind streaks, and status halos synced to motor RPM.
- **Fluid Natural Breeze Mode**: Algorithmic fluid air velocity simulation mimicking outdoor gusty wind airflow.
- **Overnight Sleep Wind Curve**: Automatically steps down fan speed in stages through the night aligned with human body temperature drops.
- **Thermal Comfort Auto-Regulation**: Calculates the **Perceived Heat Index** (temperature + humidity) and auto-tunes fan speed.
- **Bearing Health & Vibration Diagnostics**: Detects mechanical bearing wear via high-frequency wattage oscillation and accelerometer vibration (mm/s).
- **Blade Cleaning Alert**: Tracks cumulative motor runtime hours to remind you when dust buildup reduces aerodynamic efficiency.
- **Reversible Winter/Summer Flow**: Instant toggle between downdraft cooling and updraft heat destratification.

### 💡 3. Adaptive Lighting Intelligence (Lumina Aura)
- **Interactive Light Canvas**: Realistic glowing pendant lamp with real-time Kelvin temperature bloom and brightness intensity.
- **Circadian Rhythm Synchronization**: Transitions color temperature and brightness dynamically across the 24-hour solar cycle (2200K Candlelight $\rightarrow$ 6200K Midday Peak Focus $\rightarrow$ 2700K Evening Amber).
- **Daylight Harvesting (Adaptive Lux Auto-Dimming)**: Reads ambient photocell/LDR sensor and dims artificial bulbs as natural sunlight enters the room to save energy.
- **LED Health & Lifespan Tracker**: Estimates junction temperature ($T_j$) and operating hours to project remaining diode life.
- **Direct Power Savings Comparison**: Computes instantaneous watts saved compared to conventional 60W incandescent bulbs.
- **Ambiance Scenes**: Quick presets for Deep Focus, Reading, Relaxation, Movie Night, and Candlelight.

### ❄️ 4. Climate & Dual-Inverter AC
- **Frosty Mist Cooling Effect**: Visual cold air particle simulation when compressor is active.
- **Compressor Modulation**: Dynamic load percentage and auto-fan speed tuning based on target set temperature.
- **Filter Health Monitoring**: Tracks airflow resistance and air filter clean hours.

### ⚡ 5. Energy & Power Analytics
- **Live Aggregated Wattage Meter** & Daily kWh tracking.
- **Real-Time Cost Estimation** with configurable tariff rates.
- **Appliance Load Breakdown** with relative share percentages.
- **Carbon Footprint Offset** counter (kg $CO_2$ saved).

### 🛠️ 6. Pure Software Virtual MCU & Physical ESP32 Bridge
- **Virtual Hardware Breadboard**: Slide ambient temperature, humidity, and lux to test automated controls right in your browser without any physical hardware.
- **Anomaly Injection**: Simulate bearing friction spikes and 252V grid voltage surges.
- **Physical ESP32 Firmware**: Ready-to-flash Arduino sketch in `firmware/esp32_smart_home/esp32_smart_home.ino`.
- **Google Home Bridge**: Voice commands via Google Assistant seamlessly sync with AuraHome within 14ms.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+ (optional, frontend comes pre-built in `frontend/dist`)

### 1. Clone & Run
```bash
git clone https://github.com/Dk043131/AuraHome.git
cd AuraHome

# Make start script executable and run
chmod +x start.sh
./start.sh
```

### 2. Manual Setup (Alternative)
```bash
# Backend
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser at **[http://localhost:8000](http://localhost:8000)**.

---

## 🔌 Hardware Wiring & Pin Mapping (ESP32)

| ESP32 Pin | Connected Component | Description |
| :--- | :--- | :--- |
| **GPIO 18** | Fan Relay | Main power switching |
| **GPIO 19** | Fan PWM / Tap | Speed modulation (Levels 1-5) |
| **GPIO 22** | Light Relay / Dimmer | Smart bulb power & dimming |
| **GPIO 34 (ADC)** | LDR Photodiode | Ambient daylight harvesting (Lux) |
| **GPIO 35 (ADC)** | ACS712 / CT Clamp | AC Current & Real-time Wattage |
| **GPIO 4 (1-Wire)**| DHT11 / DHT22 | Ambient Room Temp & Humidity |

Physical firmware sketch: [`firmware/esp32_smart_home/esp32_smart_home.ino`](firmware/esp32_smart_home/esp32_smart_home.ino).

---

## 📡 REST API & Telemetry Endpoints

- `GET /api/devices`: Returns full state of all connected appliances & sensors.
- `POST /api/devices/fan/speed`: Sets speed (`{"speed": 1-5}`).
- `POST /api/devices/fan/mode`: Sets mode (`"manual"`, `"natural_breeze"`, `"sleep_curve"`, `"auto_comfort"`).
- `POST /api/devices/light/brightness`: Sets brightness (`{"brightness": 0-100}`).
- `POST /api/devices/light/colortemp`: Sets Kelvin (`{"color_temp": 2000-6500}`).
- `POST /api/devices/light/mode`: Sets mode (`"circadian"`, `"daylight_harvesting"`, `"scene"`).
- `POST /api/voice/command`: Multilingual natural language command processor.
- `POST /api/voice/audio-command`: Direct audio base64 recording ingestion and neural transcription.
- `POST /api/hardware/bridge`: ESP32 telemetry ingestion endpoint.
- `WS /ws/telemetry`: High-speed bi-directional WebSocket telemetry stream.

---

## 📄 License
MIT License. Created by [Dk043131](https://github.com/Dk043131).
