import time
import math
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class FanDevice(BaseModel):
    id: str = "fan-living"
    name: str = "AeroBreeze Pro Smart Fan"
    room: str = "Living Room"
    state: bool = True
    speed: int = 3  # 0 to 5
    mode: str = "manual"  # manual, natural_breeze, sleep_curve, auto_comfort
    rpm: int = 240
    target_rpm: int = 240
    watts: float = 42.5
    vibration_level: float = 0.8  # mm/s (normal < 1.8 mm/s)
    bearing_health: float = 96.0  # percentage
    blade_clean_countdown_hours: float = 280.0  # target 300 hrs between cleaning
    total_runtime_hours: float = 1420.5
    reverse_direction: bool = False  # summer downward, winter upward
    sleep_curve_remaining_mins: Optional[int] = None
    motor_temp_c: float = 38.2
    
    def calculate_metrics(self, room_temp: float = 28.5, room_humidity: float = 62.0):
        if not self.state or self.speed == 0:
            self.rpm = 0
            self.watts = 0.8  # standby vampire draw
            self.vibration_level = 0.0
            return

        # Base RPM & Watts by speed level (BLDC motor profile)
        speed_profiles = {
            1: {"rpm": 110, "watts": 8.5},
            2: {"rpm": 170, "watts": 18.0},
            3: {"rpm": 235, "watts": 32.5},
            4: {"rpm": 290, "watts": 48.0},
            5: {"rpm": 350, "watts": 68.0},
        }
        profile = speed_profiles.get(self.speed, {"rpm": 220, "watts": 30.0})
        
        # Natural breeze mode variation
        if self.mode == "natural_breeze":
            t = time.time()
            # Multi-wave sinusoidal variation mimicking gusty outdoor breeze
            breeze_factor = 0.82 + 0.18 * math.sin(t * 0.4) + 0.09 * math.cos(t * 0.9)
            self.rpm = int(profile["rpm"] * max(0.6, min(1.25, breeze_factor)))
            self.watts = round(profile["watts"] * (self.rpm / profile["rpm"]) ** 1.8, 1)
        elif self.mode == "auto_comfort":
            # Heat index calculation
            hi = -8.784 + 1.611 * room_temp + 2.338 * (room_humidity / 100 * room_temp)
            if hi < 26:
                recommended_speed = 1
            elif hi < 29:
                recommended_speed = 2
            elif hi < 32:
                recommended_speed = 3
            elif hi < 35:
                recommended_speed = 4
            else:
                recommended_speed = 5
            self.speed = recommended_speed
            self.rpm = profile["rpm"]
            self.watts = profile["watts"]
        else:
            self.rpm = profile["rpm"]
            self.watts = profile["watts"]

        # Motor health & vibration estimation
        wear_factor = max(0.0, (100 - self.bearing_health) / 100)
        self.vibration_level = round(0.6 + (self.speed * 0.22) + (wear_factor * 1.5), 2)
        self.watts = round(self.watts * (1.0 + (wear_factor * 0.12)), 1)
        self.motor_temp_c = round(32.0 + (self.watts * 0.18), 1)


class LightDevice(BaseModel):
    id: str = "light-living"
    name: str = "Lumina Aura Adaptive Lighting"
    room: str = "Living Room"
    state: bool = True
    brightness: int = 80  # 0 - 100%
    color_temp: int = 4000  # 2000K (candle/warm) to 6500K (cool daylight)
    rgb_color: str = "#FFAA55"
    mode: str = "circadian"  # manual, circadian, daylight_harvesting, scene
    scene: Optional[str] = "focus"  # reading, movie, focus, relax, party, candlelight
    current_lux: float = 320.0
    led_health: float = 94.5  # remaining life %
    total_burn_hours: float = 3850.0
    watts: float = 11.2
    baseline_incandescent_watts: float = 75.0
    saved_kwh_total: float = 245.8
    junction_temp_c: float = 46.2

    def calculate_metrics(self, ambient_lux: float = 350.0):
        if not self.state or self.brightness == 0:
            self.watts = 0.3  # standby
            self.current_lux = 0
            return

        # Circadian Rhythm calculation based on current hour
        if self.mode == "circadian":
            now = datetime.now()
            hour = now.hour + now.minute / 60.0
            
            if hour < 6:
                self.color_temp = 2000
                self.brightness = 15
            elif hour < 9:
                ratio = (hour - 6) / 3
                self.color_temp = int(2400 + ratio * 2400)
                self.brightness = int(40 + ratio * 45)
            elif hour < 14:
                ratio = (hour - 9) / 5
                self.color_temp = int(4800 + ratio * 1400)
                self.brightness = int(85 + ratio * 15)
            elif hour < 19:
                ratio = (hour - 14) / 5
                self.color_temp = int(6200 - ratio * 2800)
                self.brightness = int(100 - ratio * 35)
            elif hour < 22:
                ratio = (hour - 19) / 3
                self.color_temp = int(3400 - ratio * 1200)
                self.brightness = int(65 - ratio * 35)
            else:
                ratio = (hour - 22) / 2
                self.color_temp = int(2200 - ratio * 200)
                self.brightness = int(30 - ratio * 15)

        elif self.mode == "daylight_harvesting":
            target_lux = 500.0
            needed_lux = max(0.0, target_lux - ambient_lux)
            calculated_brightness = int(min(100, max(10, (needed_lux / target_lux) * 100)))
            self.brightness = calculated_brightness

        # Dynamic Wattage: Max 14W smart LED bulb
        max_wattage = 14.0
        self.watts = round(0.5 + (self.brightness / 100.0) * max_wattage, 1)
        self.current_lux = round((self.brightness / 100.0) * 800.0, 0)
        self.junction_temp_c = round(35.0 + (self.watts * 1.1), 1)


class ACDevice(BaseModel):
    id: str = "ac-master"
    name: str = "Dual-Inverter Smart AC"
    room: str = "Master Bedroom"
    state: bool = False
    set_temp: int = 24
    room_temp: float = 27.8
    room_humidity: float = 64.0
    mode: str = "cool"  # cool, eco, dry, fan
    fan_speed: str = "auto"  # low, med, high, auto
    watts: float = 0.0
    compressor_load_pct: int = 0
    filter_health_pct: float = 88.0
    energy_saving_ratio: float = 34.0

    def calculate_metrics(self):
        if not self.state:
            self.watts = 1.2
            self.compressor_load_pct = 0
            return
        
        delta = max(0.0, self.room_temp - self.set_temp)
        if delta > 3.0:
            self.compressor_load_pct = 95
            self.watts = 1450.0
        elif delta > 1.0:
            self.compressor_load_pct = 65
            self.watts = 880.0
        elif delta > 0.1:
            self.compressor_load_pct = 35
            self.watts = 480.0
        else:
            self.compressor_load_pct = 15
            self.watts = 220.0


class SmartPlugDevice(BaseModel):
    id: str = "plug-workstation"
    name: str = "Smart Metering Plug"
    room: str = "Home Office"
    state: bool = True
    appliance_type: str = "Workstation PC & Peripherals"
    watts: float = 142.5
    voltage: float = 231.4
    current_amp: float = 0.62
    power_factor: float = 0.96
    daily_kwh: float = 1.84
    vampire_draw_detected: bool = False


class HomeState:
    def __init__(self):
        self.fan = FanDevice()
        self.light = LightDevice()
        self.ac = ACDevice()
        self.plug = SmartPlugDevice()
        self.ambient_temp = 28.2
        self.ambient_humidity = 61.5
        self.ambient_lux = 380.0
        self.grid_voltage = 230.5
        self.electricity_rate_per_kwh = 8.50
        self.hardware_connected = True
        self.last_hardware_ping = time.time()
        self.hardware_ip = "192.168.1.145 (ESP32-WROOM)"
        self.google_home_synced = True
        self.recent_events: List[Dict[str, Any]] = [
            {"time": "20:25:10", "type": "INFO", "msg": "Hardware Bridge connected via WebSocket"},
            {"time": "20:26:00", "type": "SYNC", "msg": "Google Home state synced for 4 devices"},
            {"time": "20:28:15", "type": "ENERGY", "msg": "Circadian sync adjusted light to 4000K"}
        ]

    def add_event(self, event_type: str, msg: str):
        now_str = datetime.now().strftime("%H:%M:%S")
        self.recent_events.insert(0, {"time": now_str, "type": event_type, "msg": msg})
        if len(self.recent_events) > 30:
            self.recent_events.pop()

    def get_all_devices(self) -> Dict[str, Any]:
        return {
            "fan": self.fan.model_dump(),
            "light": self.light.model_dump(),
            "ac": self.ac.model_dump(),
            "plug": self.plug.model_dump(),
            "environment": {
                "temp_c": round(self.ambient_temp, 1),
                "humidity_pct": round(self.ambient_humidity, 1),
                "lux": round(self.ambient_lux, 0),
                "grid_voltage": round(self.grid_voltage, 1),
            },
            "hardware_bridge": {
                "connected": self.hardware_connected,
                "ip": self.hardware_ip,
                "last_seen_epoch": self.last_hardware_ping,
                "google_home_synced": self.google_home_synced,
                "latency_ms": 14,
            },
            "recent_events": self.recent_events[:10],
        }

    def get_energy_summary(self) -> Dict[str, Any]:
        total_watts = (
            self.fan.watts +
            self.light.watts +
            self.ac.watts +
            self.plug.watts
        )
        daily_kwh = round((total_watts * 14.5) / 1000.0, 2)
        daily_cost = round(daily_kwh * self.electricity_rate_per_kwh, 2)
        saved_kwh_today = round(((self.light.baseline_incandescent_watts - self.light.watts) * 6.0) / 1000.0, 2)
        
        breakdown = [
            {"name": "Living Fan", "watts": round(self.fan.watts, 1), "pct": round((self.fan.watts / max(1, total_watts)) * 100, 1)},
            {"name": "Living Light", "watts": round(self.light.watts, 1), "pct": round((self.light.watts / max(1, total_watts)) * 100, 1)},
            {"name": "Bedroom AC", "watts": round(self.ac.watts, 1), "pct": round((self.ac.watts / max(1, total_watts)) * 100, 1)},
            {"name": "Workstation Plug", "watts": round(self.plug.watts, 1), "pct": round((self.plug.watts / max(1, total_watts)) * 100, 1)},
        ]
        
        return {
            "total_instant_watts": round(total_watts, 1),
            "daily_kwh": daily_kwh,
            "daily_cost_est": daily_cost,
            "rate_per_kwh": self.electricity_rate_per_kwh,
            "saved_kwh_today": max(0.0, saved_kwh_today),
            "breakdown": breakdown,
            "carbon_offset_kg": round(daily_kwh * 0.82, 2),
            "power_factor_avg": 0.95,
        }
