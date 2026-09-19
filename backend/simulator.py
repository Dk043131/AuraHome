import asyncio
import random
import time
from datetime import datetime
from devices import HomeState

class SimulatorEngine:
    def __init__(self, state: HomeState):
        self.state = state
        self.running = False
        self._task = None

    async def start(self):
        self.running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()

    async def _loop(self):
        while self.running:
            try:
                self.tick()
                await asyncio.sleep(1.5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Simulator loop error: {e}")
                await asyncio.sleep(1.5)

    def tick(self):
        # 1. Subtle natural environmental micro-fluctuations
        self.state.ambient_temp += (random.random() - 0.5) * 0.08
        self.state.ambient_temp = max(18.0, min(38.0, self.state.ambient_temp))

        self.state.ambient_humidity += (random.random() - 0.5) * 0.15
        self.state.ambient_humidity = max(30.0, min(90.0, self.state.ambient_humidity))

        self.state.grid_voltage += (random.random() - 0.5) * 0.4
        self.state.grid_voltage = max(220.0, min(242.0, self.state.grid_voltage))

        # Ambient lux variation based on time
        now = datetime.now()
        hr = now.hour + now.minute / 60.0
        if 6 <= hr <= 18:
            sun_factor = max(0.0, 1.0 - ((hr - 12.0) / 6.0) ** 2)
            self.state.ambient_lux = 120.0 + sun_factor * 650.0 + (random.random() - 0.5) * 20.0
        else:
            self.state.ambient_lux = 15.0 + (random.random() - 0.5) * 5.0

        # 2. Update Fan Device
        self.state.fan.calculate_metrics(self.state.ambient_temp, self.state.ambient_humidity)
        if self.state.fan.state and self.state.fan.speed > 0:
            # Advance runtime by simulated seconds (scaled)
            self.state.fan.total_runtime_hours += 0.0004
            self.state.fan.blade_clean_countdown_hours = max(0.0, self.state.fan.blade_clean_countdown_hours - 0.0004)
            # Sleep curve ramp down logic
            if self.state.fan.mode == "sleep_curve" and self.state.fan.sleep_curve_remaining_mins is not None:
                self.state.fan.sleep_curve_remaining_mins -= 1
                if self.state.fan.sleep_curve_remaining_mins <= 0:
                    if self.state.fan.speed > 1:
                        self.state.fan.speed -= 1
                        self.state.fan.sleep_curve_remaining_mins = 60
                        self.state.add_event("FAN", f"Sleep curve stepped fan speed down to Level {self.state.fan.speed}")
                    else:
                        self.state.add_event("FAN", "Sleep curve completed: Maintaining night whisper speed Level 1")

        # 3. Update Light Device
        self.state.light.calculate_metrics(self.state.ambient_lux)
        if self.state.light.state and self.state.light.brightness > 0:
            self.state.light.total_burn_hours += 0.0004

        # 4. Update AC Device
        self.state.ac.room_temp = self.state.ambient_temp
        self.state.ac.calculate_metrics()

        # 5. Update Plug Device
        if self.state.plug.state:
            self.state.plug.watts = round(135.0 + (random.random() - 0.5) * 12.0, 1)
            self.state.plug.voltage = round(self.state.grid_voltage, 1)
            self.state.plug.current_amp = round(self.state.plug.watts / self.state.plug.voltage, 2)
        else:
            self.state.plug.watts = 0.0
            self.state.plug.current_amp = 0.0
