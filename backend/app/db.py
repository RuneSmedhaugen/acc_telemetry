# TelemetryRecorder fixed with rpm, gear mapping, live telemetry, DB insert

import threading
import time
from datetime import datetime
import duckdb
from pyaccsharedmemory import accSharedMemory

class TelemetryRecorder:

    def __init__(self):
        self.shm = accSharedMemory()
        self.live_sample = None
        self.running = False
        self.thread = None
        self.con = duckdb.connect("telemetry.db")

        self.current_lap = None
        self.lap_buffer = []
        self.session_id = None
        self.track = None
        self.car = None

        self.last_lap_time = None
        self.last_lap_number = None
        self.messages = []

    def push_message(self, msg: str):
        timestamped = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
        self.messages.append(timestamped)
        print(timestamped)

    def _safe_float(self, val, default=0.0):
        try: return float(val)
        except: return default

    def _safe_int(self, val, default=0):
        try: return int(val)
        except: return default

    def start(self):
        if self.running:
            self.push_message("Telemetry already running")
            return
        self.push_message("Connecting to ACC telemetry...")
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self):
        if not self.running:
            return
        self.push_message("Disconnecting telemetry...")
        self.running = False
        if self.thread: self.thread.join()
        self.lap_buffer = []
        self.current_lap = None
        self.session_id = None
        self.track = None
        self.car = None

    def _loop(self):
        while self.running:
            try:
                self.shm.read_shared_memory()
                data = self.shm.get_shared_memory_data()
                if not data:
                    time.sleep(0.1)
                    continue

                lap_number = getattr(data.Graphics, "completed_lap", 0)

                if self.session_id is None:
                    self._create_session(data)

                if self.current_lap is None:
                    self.current_lap = lap_number

                # save completed lap
                if lap_number != self.current_lap:
                    self._save_lap(
                        lap_number=self.current_lap,
                        lap_time=self._safe_float(getattr(data.Graphics, "last_time", 0)) / 1000.0,
                        is_valid=bool(getattr(data.Graphics, "is_valid_lap", True))
                    )
                    self.lap_buffer = []
                    self.current_lap = lap_number

                # coordinates
                coords = getattr(data.Graphics, "car_coordinates", None)
                if coords and len(coords) > 0:
                    pos = coords[0]
                    pos_x = self._safe_float(getattr(pos, "x", 0))
                    pos_y = self._safe_float(getattr(pos, "y", 0))
                    pos_z = self._safe_float(getattr(pos, "z", 0))
                else:
                    pos_x = pos_y = pos_z = 0.0

                # g-forces
                gforce_x = self._safe_float(getattr(data.Physics, "gForceLateral", 0))
                gforce_y = self._safe_float(getattr(data.Physics, "gForceLongitudinal", 0))
                gforce_z = self._safe_float(getattr(data.Physics, "gForceVertical", 0))

                # tires & brakes
                tires = {}
                brakes = {}
                for i, name in enumerate(["FL", "FR", "RL", "RR"]):
                    tires[name] = {
                        "temp": self._safe_float(getattr(data.Physics, "tyre_temp", [0]*4)[i]),
                        "wear": self._safe_float(getattr(data.Physics, "tyre_wear", [0]*4)[i]),
                        "pressure": self._safe_float(getattr(data.Physics, "tyre_pressure", [0]*4)[i]),
                    }
                    brakes[name] = {"temp": self._safe_float(getattr(data.Physics, "brake_temp", [0]*4)[i])}

                # session/weather
                weather = {
                    "air_temp": self._safe_float(getattr(data.Graphics, "air_temperature", 0)),
                    "track_temp": self._safe_float(getattr(data.Graphics, "track_temperature", 0)),
                    "rain_density": self._safe_float(getattr(data.Graphics, "rain_density", 0)),
                    "weather_type": getattr(data.Graphics, "weather", "Unknown")
                }

                # sample
                raw_gear = self._safe_int(getattr(data.Physics, "gear", 0))
                display_gear = "N" if raw_gear == 0 else ("R" if raw_gear == -1 else raw_gear)

                sample = {
                    "timestamp": time.time(),
                    "car": self.car,
                    "track": self.track,
                    "session_time": self._safe_float(getattr(data.Graphics, "session_time", 0)),
                    "current_lap": lap_number,
                    "lap_distance": self._safe_float(getattr(data.Graphics, "lap_distance", 0)),
                    "speed_kmh": self._safe_float(getattr(data.Physics, "speed_kmh", 0)),
                    "gear": raw_gear,
                    "display_gear": display_gear,
                    "rpm": self._safe_int(getattr(data.Physics, "rpm", 0)),
                    "throttle": self._safe_float(getattr(data.Physics, "gas", 0)),
                    "brake": self._safe_float(getattr(data.Physics, "brake", 0)),
                    "steering": self._safe_float(getattr(data.Physics, "steer_angle", 0)),
                    "clutch": self._safe_float(getattr(data.Physics, "clutch", 0)),
                    "yaw": self._safe_float(getattr(data.Physics, "heading", 0)),
                    "pitch": self._safe_float(getattr(data.Physics, "pitch", 0)),
                    "roll": self._safe_float(getattr(data.Physics, "roll", 0)),
                    "gforces": {"lat": gforce_x, "long": gforce_y, "vert": gforce_z},
                    "fuel": {
                        "tank": self._safe_float(getattr(data.Physics, "fuel", 0)),
                        "capacity": self._safe_float(getattr(data.Physics, "fuel_capacity", 0)),
                        "per_lap": self._safe_float(getattr(data.Physics, "fuel_per_lap", 0))
                    },
                    "tires": tires,
                    "brakes": brakes,
                    "weather": weather,
                    "position": {"x": pos_x, "y": pos_y, "z": pos_z}
                }

                self.live_sample = sample
                self.lap_buffer.append(sample)

                time.sleep(0.01)

            except Exception as e:
                self.push_message(f"Telemetry error: {repr(e)}")
                time.sleep(1)

    def _create_session(self, data):
        self.track = getattr(data.Static, "track", "").strip("\x00")
        self.car = getattr(data.Static, "car_model", "").strip("\x00")

        last_id = self.con.execute("SELECT MAX(id) FROM sessions").fetchone()[0]
        self.session_id = (last_id or 0) + 1

        self.con.execute(
            """
            INSERT INTO sessions (id, track, car, session_type, session_date)
            VALUES (?, ?, ?, ?, ?)
            """,
            (self.session_id, self.track, self.car, "manual", datetime.now())
        )
        self.con.commit()
        self.push_message(f"Session created: {self.car} @ {self.track}")

    def _save_lap(self, lap_number, lap_time, is_valid):
        if len(self.lap_buffer) < 100:
            self.push_message(f"Skipped saving lap {lap_number}: insufficient data")
            return

        last_id = self.con.execute("SELECT MAX(id) FROM laps").fetchone()[0]
        lap_id = (last_id or 0) + 1

        self.con.execute(
            "INSERT INTO laps (id, session_id, lap_number, lap_time, is_valid) VALUES (?, ?, ?, ?, ?)",
            (lap_id, self.session_id, lap_number, lap_time, is_valid)
        )

        rows = []
        for s in self.lap_buffer:
            row = (
                lap_id, s["timestamp"], s["speed_kmh"], s["throttle"], s["brake"],
                s["steering"], s["gear"], s["rpm"],
                s["position"]["x"], s["position"]["y"], s["position"]["z"],
                s["gforces"]["lat"], s["gforces"]["long"], s["gforces"]["vert"],
                s["yaw"]
            )
            rows.append(row)

        self.con.executemany("""
            INSERT INTO telemetry_samples
            (lap_id, timestamp, speed, throttle, brake, steering, gear, rpm,
             pos_x, pos_y, pos_z, gforce_x, gforce_y, gforce_z, yaw)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows)

        self.con.commit()
        self.last_lap_number = lap_number
        self.last_lap_time = lap_time
        self.push_message(f"Saved lap {lap_number} ({lap_time:.3f}s)")