import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple, List, Optional
import logging

logger = logging.getLogger("gemini_agent")

MODELS_CASCADE = [
    "gemini-3.8-flash",
    "gemini-2.5-flash-lite",
    "gemma-4-26b-a4b-it",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
]

def transcribe_audio_with_gemini(
    audio_base64: str,
    mime_type: str = "audio/webm",
    lang: str = "ta",
    api_key_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transcribes spoken audio in Tamil or other regional Indian languages using multimodal Gemini/Gemma.
    Returns verbatim native script transcription.
    """
    api_key = api_key_override or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"success": False, "error": "No API key available"}

    lang_map = {
        "ta": "Tamil (தமிழ்)",
        "hi": "Hindi (हिन्दी)",
        "te": "Telugu (తెలుగు)",
        "kn": "Kannada (ಕನ್ನಡ)",
        "ml": "Malayalam (മലയാളം)",
        "bn": "Bengali (বাংলা)",
        "mr": "Marathi (मराठी)",
        "en": "English"
    }
    target_language = lang_map.get(lang, "Tamil (தமிழ்)")

    prompt = (
        f"You are a Speech-to-Text (STT) transcription system specialized in {target_language}.\n"
        f"Listen to the attached audio recording and transcribe verbatim in the authentic native script of {target_language}.\n"
        f"Do NOT translate into English. If the speech is in Tamil, write in Tamil script. If Hindi, write in Devanagari.\n"
        f"If the audio is silent or unintelligible, respond with an empty transcript.\n"
        f"Respond ONLY with valid JSON in this format: {{\"transcript\": \"transcribed text here\"}}"
    )

    # Clean mime_type
    clean_mime = mime_type.split(";")[0].strip() if ";" in mime_type else mime_type

    for model_name in ["gemini-2.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        body = {
            "contents": [{
                "parts": [
                    {"inlineData": {"mimeType": clean_mime, "data": audio_base64}},
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.0
            }
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode("utf-8"))
                text_part = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = json.loads(text_part)
                transcript = parsed.get("transcript", "").strip()
                return {"success": True, "transcript": transcript, "model": model_name, "lang": lang}
        except Exception as e:
            logger.warning(f"Audio STT model {model_name} error: {e}")
            continue

    return {"success": False, "error": "Transcription failed across models"}

def query_gemini_contextual_ai(
    text: str,
    lang: str,
    device_state: Any,
    api_key_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends the user voice/text query alongside deep device telemetry and ambient context
    to Google Gemini (targeting gemini-3.8-flash), parses actions, executes them on state,
    and returns localized spoken feedback with environmental reasoning.
    """
    api_key = api_key_override or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {
            "success": False,
            "error": "No Gemini API Key provided. Set GEMINI_API_KEY in environment.",
            "model_used": "none"
        }

    # Prepare detailed telemetry context
    temp = getattr(device_state, "ambient_temp", 28.0)
    humidity = getattr(device_state, "ambient_humidity", 60.0)
    lux = getattr(device_state, "ambient_lux", 400.0)
    grid_v = getattr(device_state, "grid_voltage", 230.0)
    # Simple Rothfusz heat index approximation
    heat_idx = round(temp + 0.33 * (humidity / 100.0 * 6.105 * 2.71828 ** (17.27 * temp / (237.7 + temp))) - 4.0, 1)

    total_watts = (
        device_state.fan.watts +
        device_state.light.watts +
        device_state.ac.watts +
        device_state.plug.watts
    )

    context_data = {
        "user_query": text,
        "target_language_code": lang,
        "room_telemetry": {
            "temperature_c": round(temp, 1),
            "humidity_pct": round(humidity, 1),
            "daylight_lux": round(lux, 0),
            "heat_index_c": round(heat_idx, 1),
            "grid_voltage": round(grid_v, 1)
        },
        "devices": {
            "fan": {
                "state": "ON" if device_state.fan.state else "OFF",
                "speed": device_state.fan.speed,
                "mode": device_state.fan.mode,
                "rpm": device_state.fan.rpm,
                "motor_temp_c": round(device_state.fan.motor_temp_c, 1),
                "bearing_health_pct": device_state.fan.bearing_health,
                "vibration_level": device_state.fan.vibration_level,
                "blade_clean_hours_left": round(device_state.fan.blade_clean_countdown_hours, 1)
            },
            "light": {
                "state": "ON" if device_state.light.state else "OFF",
                "brightness_pct": device_state.light.brightness,
                "color_temp_kelvin": device_state.light.color_temp,
                "mode": device_state.light.mode,
                "scene": device_state.light.scene,
                "ambient_lux": device_state.light.current_lux,
                "led_health_pct": device_state.light.led_health
            },
            "ac": {
                "state": "ON" if device_state.ac.state else "OFF",
                "set_temp_c": device_state.ac.set_temp,
                "room_temp_c": round(device_state.ac.room_temp, 1),
                "mode": device_state.ac.mode,
                "compressor_load_pct": device_state.ac.compressor_load_pct
            },
            "plug": {
                "state": "ON" if device_state.plug.state else "OFF",
                "current_watts": round(device_state.plug.watts, 1),
                "daily_kwh": device_state.plug.daily_kwh
            }
        },
        "energy_summary": {
            "total_instant_watts": round(total_watts, 1),
            "estimated_cost_today_inr": round((total_watts * 14.5 / 1000.0) * 8.5, 2)
        }
    }

    system_prompt = f"""You are AuraHome AI, a highly intelligent contextual home automation assistant powered by Gemini.
You receive:
1. The user's spoken voice command or text query.
2. The user's preferred regional language code (e.g., 'ta' for Tamil, 'hi' for Hindi, 'te' for Telugu, 'kn' for Kannada, 'ml' for Malayalam, 'bn' for Bengali, 'mr' for Marathi, 'en' for English).
3. The live environmental conditions (temperature, humidity, lux, heat index) and appliance telemetry (fan RPM, bearing health, motor temp, light Kelvin, AC status, wattage).

Your goal:
1. Understand the human intent with contextual reasoning:
   - If user says they are feeling hot or sweaty, analyze current temp/humidity, adjust fan speed and/or turn on AC.
   - If user says goodnight, turn off lights/appliances or engage sleep curve.
   - If user says dim or change light atmosphere, adjust brightness or scene.
   - If user asks about appliance health, bearing wear, or electricity consumption, answer factually using the provided telemetry numbers.
2. Produce a list of concrete device actions to execute.
3. Formulate a warm, natural, conversational spoken response IN THE TARGET REGIONAL LANGUAGE specified by `target_language_code` ({lang}). Use proper regional script (e.g. Tamil script for ta, Devanagari for hi, Telugu script for te, Kannada script for kn, Malayalam script for ml, Bengali script for bn, Marathi for mr, English for en).
4. Provide a brief explanation of the contextual reasoning in English.

Supported Actions:
- {{"device": "fan", "action": "set_state", "value": true/false}}
- {{"device": "fan", "action": "set_speed", "value": 1-5}}
- {{"device": "fan", "action": "set_mode", "value": "manual" | "natural_breeze" | "sleep_curve" | "auto_comfort"}}
- {{"device": "light", "action": "set_state", "value": true/false}}
- {{"device": "light", "action": "set_brightness", "value": 1-100}}
- {{"device": "light", "action": "set_color_temp", "value": 2000-6500}}
- {{"device": "light", "action": "set_mode", "value": "manual" | "circadian" | "daylight_harvest"}}
- {{"device": "light", "action": "set_scene", "value": "focus" | "reading" | "relax" | "movie" | "candle"}}
- {{"device": "ac", "action": "set_state", "value": true/false}}
- {{"device": "ac", "action": "set_temp", "value": 18-30}}
- {{"device": "plug", "action": "set_state", "value": true/false}}

Response Format:
You MUST respond with valid, parseable JSON matching this schema:
{{
  "actions": [
    {{"device": "fan", "action": "set_speed", "value": 4}}
  ],
  "spoken_response": "Localized spoken text in {lang}",
  "reasoning": "English explanation of why this was done given the environmental context"
}}
"""

    user_payload_text = json.dumps(context_data, ensure_ascii=False)

    last_error = ""
    for model_name in MODELS_CASCADE:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": f"{system_prompt}\n\nCurrent Home Context & User Query:\n{user_payload_text}"}
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                result = json.loads(response.read().decode("utf-8"))
                candidate = result.get("candidates", [{}])[0]
                content = candidate.get("content", {}).get("parts", [{}])[0].get("text", "")
                
                parsed = json.loads(content)
                actions = parsed.get("actions", [])
                spoken = parsed.get("spoken_response", "")
                reasoning = parsed.get("reasoning", "")

                # Execute actions on device state
                executed_descriptions = []
                for act in actions:
                    desc = apply_action_to_state(act, device_state)
                    if desc:
                        executed_descriptions.append(desc)

                return {
                    "success": True,
                    "model_used": model_name,
                    "spoken_response": spoken,
                    "reasoning": reasoning,
                    "actions_executed": executed_descriptions,
                    "raw_actions": actions
                }
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            logger.warning(f"Gemini model {model_name} HTTP {he.code}: {err_body[:200]}")
            last_error = f"{model_name}: HTTP {he.code}"
            if he.code == 429:
                # Quota exceeded for project; fallback immediately to local engine without delay
                break
            continue
        except Exception as e:
            logger.warning(f"Gemini model {model_name} error: {e}")
            last_error = f"{model_name}: {str(e)}"
            continue

    return {
        "success": False,
        "error": f"All Gemini models exhausted. Last error: {last_error}",
        "model_used": "none"
    }

def apply_action_to_state(act: Dict[str, Any], state: Any) -> Optional[str]:
    """Applies an action safely to the simulated/connected hardware state."""
    device = act.get("device")
    action = act.get("action")
    value = act.get("value")

    if device == "fan":
        if action == "set_state":
            state.fan.state = bool(value)
            return f"Fan turned {'ON' if value else 'OFF'}"
        elif action == "set_speed":
            state.fan.state = True
            state.fan.speed = max(1, min(5, int(value)))
            state.fan.mode = "manual"
            return f"Fan speed set to {state.fan.speed}"
        elif action == "set_mode":
            state.fan.state = True
            state.fan.mode = str(value)
            if value == "sleep_curve":
                state.fan.sleep_curve_remaining_mins = 120
            return f"Fan mode changed to {value}"

    elif device == "light":
        if action == "set_state":
            state.light.state = bool(value)
            return f"Light turned {'ON' if value else 'OFF'}"
        elif action == "set_brightness":
            state.light.state = True
            state.light.brightness = max(1, min(100, int(value)))
            return f"Light brightness set to {state.light.brightness}%"
        elif action == "set_color_temp":
            state.light.state = True
            state.light.color_temp = max(2000, min(6500, int(value)))
            return f"Light color temp set to {state.light.color_temp}K"
        elif action == "set_mode":
            state.light.state = True
            state.light.mode = str(value)
            return f"Light mode changed to {value}"
        elif action == "set_scene":
            state.light.state = True
            sc = str(value).lower()
            state.light.scene = sc
            scene_presets = {
                "focus": (90, 5500),
                "reading": (80, 4000),
                "relax": (60, 3000),
                "movie": (25, 2400),
                "candle": (15, 2000)
            }
            if sc in scene_presets:
                state.light.brightness, state.light.color_temp = scene_presets[sc]
            return f"Light scene applied: {value}"

    elif device == "ac":
        if action == "set_state":
            state.ac.state = bool(value)
            return f"AC turned {'ON' if value else 'OFF'}"
        elif action in ["set_temp", "turn_on"]:
            state.ac.state = True
            t = act.get("temp", value)
            if t is not None:
                state.ac.set_temp = max(18, min(30, int(t)))
                return f"AC turned ON at {state.ac.set_temp}°C"
            return "AC turned ON"

    elif device == "plug":
        if action == "set_state":
            state.plug.state = bool(value)
            return f"Smart Plug turned {'ON' if value else 'OFF'}"

    return None
