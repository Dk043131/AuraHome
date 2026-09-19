import asyncio
import json
import time
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

logger = logging.getLogger("aura_main")

from devices import HomeState
from simulator import SimulatorEngine

state = HomeState()
simulator = SimulatorEngine(state)

# Active WebSocket connections
connected_clients: List[WebSocket] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    await simulator.start()
    # Background broadcaster
    broadcast_task = asyncio.create_task(broadcast_telemetry_loop())
    yield
    broadcast_task.cancel()
    await simulator.stop()

app = FastAPI(title="Smart Home Hub & Telemetry Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def broadcast_telemetry_loop():
    while True:
        try:
            if connected_clients:
                payload = json.dumps({
                    "type": "TELEMETRY_UPDATE",
                    "timestamp": time.time(),
                    "devices": state.get_all_devices(),
                    "energy": state.get_energy_summary(),
                })
                # Send to all clients, prune dead sockets
                dead_sockets = []
                for client in connected_clients:
                    try:
                        await client.send_text(payload)
                    except Exception:
                        dead_sockets.append(client)
                for dead in dead_sockets:
                    if dead in connected_clients:
                        connected_clients.remove(dead)
            await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Broadcast error: {e}")
            await asyncio.sleep(1.0)

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        # Initial state send
        await websocket.send_text(json.dumps({
            "type": "INITIAL_STATE",
            "devices": state.get_all_devices(),
            "energy": state.get_energy_summary(),
        }))
        while True:
            # Client can send commands through WS as well
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                handle_client_ws_message(msg)
            except Exception as e:
                print(f"Failed to process WS message: {e}")
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

def handle_client_ws_message(msg: Dict[str, Any]):
    action = msg.get("action")
    if action == "TOGGLE_DEVICE":
        device_id = msg.get("device_id")
        target_state = msg.get("state")
        if device_id == "fan":
            state.fan.state = target_state
            state.add_event("USER", f"Toggled Fan {'ON' if target_state else 'OFF'}")
        elif device_id == "light":
            state.light.state = target_state
            state.add_event("USER", f"Toggled Light {'ON' if target_state else 'OFF'}")
        elif device_id == "ac":
            state.ac.state = target_state
            state.add_event("USER", f"Toggled AC {'ON' if target_state else 'OFF'}")
        elif device_id == "plug":
            state.plug.state = target_state
            state.add_event("USER", f"Toggled Workstation Plug {'ON' if target_state else 'OFF'}")

# ================= REST API ROUTES =================

@app.get("/api/devices")
def get_all_devices():
    return state.get_all_devices()

@app.get("/api/energy/summary")
def get_energy_summary():
    return state.get_energy_summary()

# --- Fan Endpoints ---
class FanSpeedRequest(BaseModel):
    speed: int

class FanModeRequest(BaseModel):
    mode: str
    sleep_timer_mins: Optional[int] = 120

@app.post("/api/devices/fan/state")
def toggle_fan(payload: Dict[str, bool]):
    new_state = payload.get("state", not state.fan.state)
    state.fan.state = new_state
    state.add_event("FAN", f"Fan turned {'ON' if new_state else 'OFF'}")
    return {"status": "success", "fan": state.fan.model_dump()}

@app.post("/api/devices/fan/speed")
def set_fan_speed(req: FanSpeedRequest):
    if not (0 <= req.speed <= 5):
        raise HTTPException(status_code=400, detail="Speed must be between 0 and 5")
    state.fan.speed = req.speed
    if req.speed > 0:
        state.fan.state = True
    state.add_event("FAN", f"Fan speed set to Level {req.speed}")
    return {"status": "success", "fan": state.fan.model_dump()}

@app.post("/api/devices/fan/mode")
def set_fan_mode(req: FanModeRequest):
    valid_modes = ["manual", "natural_breeze", "sleep_curve", "auto_comfort"]
    if req.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Mode must be one of {valid_modes}")
    state.fan.mode = req.mode
    if req.mode == "sleep_curve":
        state.fan.sleep_curve_remaining_mins = req.sleep_timer_mins
    else:
        state.fan.sleep_curve_remaining_mins = None
    state.add_event("FAN", f"Fan mode changed to {req.mode}")
    return {"status": "success", "fan": state.fan.model_dump()}

@app.post("/api/devices/fan/direction")
def toggle_fan_direction():
    state.fan.reverse_direction = not state.fan.reverse_direction
    dir_name = "Reverse (Updraft / Winter)" if state.fan.reverse_direction else "Forward (Downdraft / Summer)"
    state.add_event("FAN", f"Fan direction switched to {dir_name}")
    return {"status": "success", "reverse_direction": state.fan.reverse_direction}

@app.post("/api/devices/fan/reset_cleaning")
def reset_fan_cleaning():
    state.fan.blade_clean_countdown_hours = 300.0
    state.add_event("MAINTENANCE", "Fan blade cleaning timer reset to 300 hrs")
    return {"status": "success", "blade_clean_countdown_hours": 300.0}

# --- Light Endpoints ---
class LightBrightnessRequest(BaseModel):
    brightness: int

class LightColorTempRequest(BaseModel):
    color_temp: int

class LightModeRequest(BaseModel):
    mode: str
    scene: Optional[str] = None

@app.post("/api/devices/light/state")
def toggle_light(payload: Dict[str, bool]):
    new_state = payload.get("state", not state.light.state)
    state.light.state = new_state
    state.add_event("LIGHT", f"Light turned {'ON' if new_state else 'OFF'}")
    return {"status": "success", "light": state.light.model_dump()}

@app.post("/api/devices/light/brightness")
def set_light_brightness(req: LightBrightnessRequest):
    if not (0 <= req.brightness <= 100):
        raise HTTPException(status_code=400, detail="Brightness must be 0-100")
    state.light.brightness = req.brightness
    if req.brightness > 0:
        state.light.state = True
    state.add_event("LIGHT", f"Brightness set to {req.brightness}%")
    return {"status": "success", "light": state.light.model_dump()}

@app.post("/api/devices/light/colortemp")
def set_light_colortemp(req: LightColorTempRequest):
    if not (2000 <= req.color_temp <= 6500):
        raise HTTPException(status_code=400, detail="Color temperature must be between 2000K and 6500K")
    state.light.color_temp = req.color_temp
    state.light.mode = "manual"
    state.add_event("LIGHT", f"Color temperature set to {req.color_temp}K")
    return {"status": "success", "light": state.light.model_dump()}

@app.post("/api/devices/light/mode")
def set_light_mode(req: LightModeRequest):
    valid_modes = ["manual", "circadian", "daylight_harvesting", "scene"]
    if req.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Mode must be one of {valid_modes}")
    state.light.mode = req.mode
    if req.scene:
        state.light.scene = req.scene
        # Predefined scene color & brightness configs
        scenes = {
            "reading": {"brightness": 85, "color_temp": 4200},
            "movie": {"brightness": 20, "color_temp": 2400},
            "focus": {"brightness": 100, "color_temp": 5500},
            "relax": {"brightness": 45, "color_temp": 2800},
            "candlelight": {"brightness": 15, "color_temp": 2000},
        }
        if req.scene in scenes:
            state.light.brightness = scenes[req.scene]["brightness"]
            state.light.color_temp = scenes[req.scene]["color_temp"]
    state.add_event("LIGHT", f"Light set to mode: {req.mode}" + (f" ({req.scene})" if req.scene else ""))
    return {"status": "success", "light": state.light.model_dump()}

# --- AC Endpoints ---
class ACTempRequest(BaseModel):
    temp: int

@app.post("/api/devices/ac/state")
def toggle_ac(payload: Dict[str, bool]):
    new_state = payload.get("state", not state.ac.state)
    state.ac.state = new_state
    state.add_event("CLIMATE", f"AC turned {'ON' if new_state else 'OFF'}")
    return {"status": "success", "ac": state.ac.model_dump()}

@app.post("/api/devices/ac/temp")
def set_ac_temp(req: ACTempRequest):
    if not (16 <= req.temp <= 30):
        raise HTTPException(status_code=400, detail="Temperature must be between 16°C and 30°C")
    state.ac.set_temp = req.temp
    state.add_event("CLIMATE", f"AC target temperature set to {req.temp}°C")
    return {"status": "success", "ac": state.ac.model_dump()}

# --- Hardware Ingestion & Bridge API ---
class HardwareTelemetryPayload(BaseModel):
    device_id: str
    device_type: str  # "fan", "light", "sensor", "relay"
    pin_state: Optional[int] = None
    voltage: Optional[float] = None
    current_amp: Optional[float] = None
    watts: Optional[float] = None
    ambient_temp: Optional[float] = None
    ambient_humidity: Optional[float] = None
    ambient_lux: Optional[float] = None
    vibration: Optional[float] = None

@app.post("/api/hardware/bridge")
def hardware_ingest(payload: HardwareTelemetryPayload):
    """
    Called by physical hardware (e.g. ESP32 / Arduino / Raspberry Pi)
    via HTTP POST or WebSocket to report live pin readings & sensor metrics.
    """
    state.hardware_connected = True
    state.last_hardware_ping = time.time()
    
    if payload.ambient_temp is not None:
        state.ambient_temp = payload.ambient_temp
    if payload.ambient_humidity is not None:
        state.ambient_humidity = payload.ambient_humidity
    if payload.ambient_lux is not None:
        state.ambient_lux = payload.ambient_lux
    if payload.voltage is not None:
        state.grid_voltage = payload.voltage

    if payload.device_type == "fan":
        if payload.watts is not None:
            state.fan.watts = payload.watts
        if payload.vibration is not None:
            state.fan.vibration_level = payload.vibration
    elif payload.device_type == "light":
        if payload.watts is not None:
            state.light.watts = payload.watts

    state.add_event("HARDWARE", f"ESP32 Packet received from {payload.device_id} ({payload.device_type})")
    return {
        "status": "ACK",
        "server_time": time.time(),
        "fan_state": state.fan.state,
        "fan_speed": state.fan.speed,
        "fan_mode": state.fan.mode,
        "light_state": state.light.state,
        "light_brightness": state.light.brightness,
        "light_colortemp": state.light.color_temp,
    }

# --- Virtual Simulator Injection ---
class SimulatorInjectRequest(BaseModel):
    temp: Optional[float] = None
    humidity: Optional[float] = None
    lux: Optional[float] = None
    fan_bearing_degrade: Optional[bool] = False
    simulate_spike: Optional[bool] = False

@app.post("/api/simulator/inject")
def inject_simulator_values(req: SimulatorInjectRequest):
    if req.temp is not None:
        state.ambient_temp = req.temp
    if req.humidity is not None:
        state.ambient_humidity = req.humidity
    if req.lux is not None:
        state.ambient_lux = req.lux
    if req.fan_bearing_degrade:
        state.fan.bearing_health = max(40.0, state.fan.bearing_health - 15.0)
        state.add_event("DIAGNOSTIC", "Injected bearing friction anomaly: vibration increased")
    if req.simulate_spike:
        state.grid_voltage = 252.0
        state.add_event("ALERT", "Voltage surge detected: 252V (protective surge cutoff threshold: 250V)")
    return {"status": "injected", "state": state.get_all_devices()}

from nlp import get_localized_response
from gemini_agent import query_gemini_contextual_ai, transcribe_audio_with_gemini

# --- Voice AI Command Engine (Multilingual STT & Context Engine) ---
class VoiceCommandRequest(BaseModel):
    text: str
    lang: Optional[str] = "en"
    api_key: Optional[str] = None
    prefer_rule: Optional[bool] = False

class AudioTranscribeRequest(BaseModel):
    audio_base64: str
    mime_type: Optional[str] = "audio/webm"
    lang: Optional[str] = "ta"
    api_key: Optional[str] = None

@app.post("/api/voice/transcribe")
def transcribe_audio_endpoint(req: AudioTranscribeRequest):
    return transcribe_audio_with_gemini(
        audio_base64=req.audio_base64,
        mime_type=req.mime_type or "audio/webm",
        lang=req.lang or "ta",
        api_key_override=req.api_key
    )

@app.post("/api/voice/audio-command")
def execute_audio_command_endpoint(req: AudioTranscribeRequest):
    # 1. Transcribe speech using neural STT
    stt_res = transcribe_audio_with_gemini(
        audio_base64=req.audio_base64,
        mime_type=req.mime_type or "audio/webm",
        lang=req.lang or "ta",
        api_key_override=req.api_key
    )
    transcript = stt_res.get("transcript", "").strip()
    if not transcript:
        return {
            "status": "empty",
            "spoken_response": "பேச்சு கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும்." if req.lang == "ta" else "No speech detected. Please speak clearly.",
            "transcript": "",
            "devices": state.get_all_devices(),
            "energy": state.get_energy_summary()
        }

    # 2. Execute contextual intelligence on transcribed text
    cmd_req = VoiceCommandRequest(text=transcript, lang=req.lang, api_key=req.api_key)
    result = execute_voice_command(cmd_req)
    result["stt_transcript"] = transcript
    return result

@app.post("/api/voice/command")
def execute_voice_command(req: VoiceCommandRequest):
    text_clean = req.text.strip()
    text = text_clean.lower()
    lang = req.lang or "en"

    # 1. Attempt Real Gemini Contextual AI (targeting Gemini 3.8 Flash)
    if not req.prefer_rule:
        gemini_res = query_gemini_contextual_ai(
            text=text_clean,
            lang=lang,
            device_state=state,
            api_key_override=req.api_key
        )
        if gemini_res.get("success"):
            spoken = gemini_res.get("spoken_response", "")
            reasoning = gemini_res.get("reasoning", "")
            actions = gemini_res.get("actions_executed", [])
            act_summary = ", ".join(actions) if actions else "Context analysis"
            state.add_event("VOICE_AI", f"{text_clean[:35]} -> {act_summary}")
            return {
                "status": "success",
                "ai_engine": "Aura AI",
                "model": "Aura AI",
                "spoken_response": spoken,
                "reasoning": reasoning,
                "actions": actions,
                "query": text_clean,
                "lang": lang,
                "devices": state.get_all_devices(),
                "energy": state.get_energy_summary()
            }
        else:
            logger.warning(f"Gemini fallback triggered: {gemini_res.get('error')}")

    # 2. Local Fallback Pattern Engine (Zero-latency fallback)
    intent = "UNKNOWN"
    args = {"query": text_clean}

    # Helper stems
    has_fan = any(k in text for k in ["fan", "पंखा", "पंख", "ஃபே", "விசிறி", "ఫ్యాన్", "ఫ్యా", "ಫ್ಯಾನ್", "ಫ್ಯಾ", "ഫാൻ", "ഫാ", "পাখা", "পাখ"])
    has_light = any(k in text for k in ["light", "लाइट", "லைட்", "விளக்", "లైట్", "దీపం", "ದೀಪ", "ಲೈಟ್", "ലൈറ്റ്", "লাইট", "বাতি", "लाईट"])
    has_ac = any(k in text for k in ["ac", "cool", "एसी", "ஏசி", "ஏ.சி", "ఏసీ", "ಎಸಿ", "എസി"])
    is_on = any(k in text for k in ["on", "start", "चालू", "चला", "போடு", "இயக்கு", "ஆன்", "ஆக்கு", "ఆన్", "వెలిగించు", "వేయి", "చేయి", "ಆನ್", "ಹಾಕಿ", "ಮಾಡು", "ഓൺ", "ഇടുക", "ചെയ്യുക", "জ্বালাও", "চালু", "सुरू", "करा"])
    is_off = any(k in text for k in ["off", "stop", "बंद", "அணை", "நிறுத்து", "ஆப்", "முடி", "ఆఫ్", "ఆపు", "ಆಫ್", "ಆಪು", "ಓಫ್", "നിർത്തുക", "ഓף", "বন্ধ", "निभ"])

    # 1. Global / All Off / Goodnight
    if any(k in text for k in ["all off", "everything off", "goodnight", "sleep time", "सब बंद", "সব বন্ধ", "அனைத்தும் அணை", "அனைத்தையும்", "అన్నీ ఆఫ్", "ಎಲ್ಲವೂ ಆಫ್", "എല്ലാം ഓഫ്", "सर्व बंद", "sab band"]):
        state.fan.state = False
        state.light.state = False
        state.ac.state = False
        intent = "ALL_OFF"
        state.add_event("VOICE", f"Voice Command ({lang}): All appliances powered OFF")

    # 2. Eco Mode
    elif any(k in text for k in ["eco", "save power", "green mode", "इको", "சிக்கனம்", "எகோ", "ఎకో", "ಇಕೋ", "ഇക്കോ", "ইকো"]):
        state.fan.mode = "auto_comfort"
        state.light.mode = "circadian"
        intent = "ECO_MODE"
        state.add_event("VOICE", f"Voice Command ({lang}): Full Eco Mode activated")

    # 3. Fan Breeze
    elif any(k in text for k in ["breeze", "natural wind", "हवा", "இயற்கை காற்று", "சஹஜ", "సహజ గాలి", "ನೈಸರ್ಗಿಕ ಗಾಳಿ", "കാറ്റ്", "বাতাস", "वारा"]):
        state.fan.state = True
        state.fan.mode = "natural_breeze"
        intent = "FAN_BREEZE"
        state.add_event("VOICE", f"Voice Command ({lang}): Fan set to Natural Breeze")

    # 4. Fan Sleep Curve
    elif any(k in text for k in ["sleep curve", "sleep fan", "स्लीप", "தூக்கம்", "நித்திரை", "నిద్ర", "ನಿದ್ರೆ", "ഉറക്കം", "ঘুম", "झोप"]):
        state.fan.state = True
        state.fan.mode = "sleep_curve"
        state.fan.sleep_curve_remaining_mins = 120
        intent = "FAN_SLEEP_CURVE"
        state.add_event("VOICE", f"Voice Command ({lang}): Sleep Wind Curve started")

    # 5. Fan Speed
    elif (has_fan or "speed" in text or "गति" in text or "வேகம்" in text or "స్పీడ్" in text or "ವೇಗ" in text or "വേഗത" in text) and any(c in text for c in ["1", "2", "3", "4", "5", "१", "२", "३", "४", "५", "एक", "दो", "तीन", "चार", "पाँच", "ஒன்று", "இரண்டு", "மூன்று", "நான்கு", "ஐந்து", "ఒకటి", "రెండు", "మూడు", "నాలుగు", "ఐదు", "ಒಂದು", "ಎರಡು", "ಮೂರು", "ನಾಲ್ಕು", "ಐದು"]):
        chosen_speed = 3
        digit_map = {
            "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
            "१": 1, "२": 2, "३": 3, "४": 4, "५": 5,
            "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5,
            "ஒன்று": 1, "இரண்டு": 2, "மூன்று": 3, "நான்கு": 4, "ஐந்து": 5,
            "ఒకటి": 1, "రెండు": 2, "మూడు": 3, "నాలుగు": 4, "ఐదు": 5,
            "ಒಂದು": 1, "ಎರಡು": 2, "ಮೂರು": 3, "ನಾಲ್ಕು": 4, "ಐದು": 5
        }
        for token, num in digit_map.items():
            if token in text:
                chosen_speed = num
                break
        state.fan.speed = chosen_speed
        state.fan.state = True
        intent = "FAN_SPEED"
        args = {"speed": chosen_speed}
        state.add_event("VOICE", f"Voice Command ({lang}): Fan speed set to {chosen_speed}")

    # 6. Fan Off
    elif has_fan and (is_off or "stop" in text):
        state.fan.state = False
        intent = "FAN_OFF"
        state.add_event("VOICE", f"Voice Command ({lang}): Fan turned OFF")

    # 7. Fan On
    elif has_fan and (is_on or "fan on" in text):
        state.fan.state = True
        intent = "FAN_ON"
        args = {"speed": state.fan.speed, "rpm": state.fan.rpm}
        state.add_event("VOICE", f"Voice Command ({lang}): Fan turned ON")

    # 8. Light Off
    elif has_light and is_off:
        state.light.state = False
        intent = "LIGHT_OFF"
        state.add_event("VOICE", f"Voice Command ({lang}): Light turned OFF")

    # 9. Light Circadian
    elif (has_light or "circadian" in text) and any(k in text for k in ["circadian", "सूर्य", "சூரிய", "సూర్య", "ಸೂರ್ಯ", "സൂര്യ", "সৌর", "solar"]):
        state.light.state = True
        state.light.mode = "circadian"
        intent = "LIGHT_CIRCADIAN"
        state.add_event("VOICE", f"Voice Command ({lang}): Light switched to Circadian Mode")

    # 10. Light On
    elif has_light and is_on:
        state.light.state = True
        intent = "LIGHT_ON"
        args = {"brightness": state.light.brightness}
        state.add_event("VOICE", f"Voice Command ({lang}): Light turned ON")

    # 9. Light Off
    elif any(k in text for k in ["turn off light", "lights off", "light off", "लाइट बंद", "लाइट ऑफ", "light band", "விளக்கு அணை", "லைட் அணை", "లైట్ ఆఫ్", "లైట్ ఆపు", "ಲೈಟ್ ಆಫ್", "ലൈറ്റ് ഓഫ്", "ലൈറ്റ് അണയ്ക്കുക", "লাইট বন্ধ", "लाईट बंद"]):
        state.light.state = False
        intent = "LIGHT_OFF"
        state.add_event("VOICE", f"Voice Command ({lang}): Light turned OFF")

    # 10. Circadian
    elif any(k in text for k in ["circadian", "सूर्य", "இயற்கை ஒளி", "சூர்ய", "సూర్య", "ಬೆಳಕು", "সূর্য", "रवि"]):
        state.light.state = True
        state.light.mode = "circadian"
        intent = "LIGHT_CIRCADIAN"
        state.add_event("VOICE", f"Voice Command ({lang}): Light Circadian Mode")

    # 11. Energy Query
    elif any(k in text for k in ["power", "watt", "electricity", "energy", "cost", "बिजली", "खर्च", "மின்சாரம்", "வாட்ஸ்", "கரెంట్", "విద్యుత్", "ವಿದ್ಯುತ್", "വൈദ്യുതി", "বিদ্যুৎ", "वीज"]):
        energy_sum = state.get_energy_summary()
        intent = "QUERY_ENERGY"
        args = {"watts": energy_sum['total_instant_watts'], "kwh": energy_sum['daily_kwh'], "cost": energy_sum['daily_cost_est']}
        state.add_event("VOICE", f"Voice Query ({lang}): Energy report")

    else:
        intent = "UNKNOWN"
        args = {"query": req.text}

    spoken = get_localized_response(intent, lang, **args)

    return {
        "status": "success",
        "intent": intent,
        "spoken_response": spoken,
        "query": req.text,
        "lang": lang,
        "devices": state.get_all_devices(),
        "energy": state.get_energy_summary()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import os
from fastapi.staticfiles import StaticFiles

# Mount built frontend if available
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
