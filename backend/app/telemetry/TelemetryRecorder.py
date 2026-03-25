# app/telemetry/TelemetryRecorder.py

import threading
import time
from datetime import datetime
import duckdb
from pyaccsharedmemory import accSharedMemory, SharedMemoryTimeout


class TelemetryRecorder:
    def __init__(self, db_path: str):
        self.shm = accSharedMemory()
        self.running = False
        self.thread = None
        self.live_sample = None
        self.con = duckdb.connect(db_path)
        self.current_lap = None
        self.lap_buffer = []
        self.session_id = None
        self.track = None
        self.car = None
        self.messages = []
        self.waiting_for_acc = False

    # ------------------ Helpers ------------------
    def push_message(self, msg: str):
        timestamped = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
        self.messages.append(timestamped)
        print(timestamped)

    def _safe_float(self, val, default=0.0):
        try:
            return float(val)
        except:
            return default

    def _safe_int(self, val, default=0):
        try:
            return int(val)
        except:
            return default

    # 🔥 NEW: universal wheel extractor (handles list OR Wheels object)
    def _extract_wheels(self, source):
        names = ["FL", "FR", "RL", "RR"]
        result = {}

        for i, name in enumerate(names):
            try:
                value = source[i]  # list case
            except:
                try:
                    value = getattr(source, name)  # object case
                except:
                    value = 0.0

            result[name] = self._safe_float(value)

        return result

    # ------------------ Public API ------------------
    def start(self):
        if self.running:
            self.push_message("Telemetry already running")
            return
        self.push_message("Telemetry started — waiting for ACC...")
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self):
        if not self.running:
            self.push_message("Telemetry stopped")
            return
        self.running = False
        if self.thread:
            self.thread.join()
        self.current_lap = None
        self.lap_buffer = []
        self.session_id = None
        self.track = None
        self.car = None

    # ------------------ Main Loop ------------------
    def _loop(self):
        while self.running:
            try:
                self.shm.read_shared_memory()
                data = self.shm.get_shared_memory_data()
            except SharedMemoryTimeout:
                if not self.waiting_for_acc:
                    self.push_message("Waiting for ACC telemetry...")
                    self.waiting_for_acc = True
                time.sleep(0.5)
                continue
            except Exception as e:
                self.push_message(f"Telemetry read error: {repr(e)}")
                time.sleep(1)
                continue

            if not data or not data.Static or not data.Graphics or not data.Physics:
                time.sleep(0.05)
                continue

            if self.waiting_for_acc:
                self.push_message("ACC telemetry detected")
                self.waiting_for_acc = False

            # ------------------ Extract telemetry ------------------
            track = getattr(data.Static, "track", "").strip("\x00")
            car = getattr(data.Static, "car_model", "").strip("\x00")
            lap_number = getattr(data.Graphics, "completed_lap", 0)

            speed = self._safe_float(getattr(data.Physics, "speed_kmh", 0))
            throttle = self._safe_float(getattr(data.Physics, "gas", 0))
            brake = self._safe_float(getattr(data.Physics, "brake", 0))
            gear = self._safe_int(getattr(data.Physics, "gear", 0))
            rpm = self._safe_int(getattr(data.Physics, "rpm", 0))

            # ------------------ Wheels (SAFE NOW 🔥) ------------------
            tire_temp_raw = getattr(data.Physics, "tyre_temp", [0, 0, 0, 0])
            tire_pressure_raw = getattr(data.Physics, "tyre_pressure", [0, 0, 0, 0])
            brake_temp_raw = getattr(data.Physics, "brake_temp", [0, 0, 0, 0])

            tire_temp = self._extract_wheels(tire_temp_raw)
            tire_pressure = self._extract_wheels(tire_pressure_raw)
            brake_temp = self._extract_wheels(brake_temp_raw)

            # ------------------ Coordinates ------------------
            coords = getattr(data.Graphics, "car_coordinates", [])
            pos_x = pos_y = pos_z = 0.0
            if coords and len(coords) > 0:
                pos = coords[0]
                pos_x = self._safe_float(getattr(pos, "x", 0))
                pos_y = self._safe_float(getattr(pos, "y", 0))
                pos_z = self._safe_float(getattr(pos, "z", 0))

            fuel = self._safe_float(getattr(data.Physics, "fuel", 0))
            fuel_capacity = self._safe_float(getattr(data.Static, "max_fuel", 0))

            # ------------------ Session creation ------------------
            if not self.session_id and track and car:
                self._create_session(track, car)

            # ------------------ Build live sample ------------------
            sample = {
                "timestamp": time.time(),
                "speed_kmh": speed,
                "throttle": throttle,
                "brake": brake,
                "gear": gear,
                "display_gear": str(gear),
                "rpm": rpm,
                "tires": {
                    "FL": {"temp": tire_temp["FL"], "pressure": tire_pressure["FL"], "wear": 0},
                    "FR": {"temp": tire_temp["FR"], "pressure": tire_pressure["FR"], "wear": 0},
                    "RL": {"temp": tire_temp["RL"], "pressure": tire_pressure["RL"], "wear": 0},
                    "RR": {"temp": tire_temp["RR"], "pressure": tire_pressure["RR"], "wear": 0},
                },
                "brakes": {
                    "FL": {"temp": brake_temp["FL"]},
                    "FR": {"temp": brake_temp["FR"]},
                    "RL": {"temp": brake_temp["RL"]},
                    "RR": {"temp": brake_temp["RR"]},
                },
                "fuel": {"tank": fuel, "capacity": fuel_capacity, "per_lap": 0},
                "position": {"x": pos_x, "y": pos_y, "z": pos_z},
                "current_lap": lap_number,
                "track": track,
                "car": car,
            }

            self.live_sample = sample
            self.lap_buffer.append(sample)

            time.sleep(0.01)

    # ------------------ Session ------------------
    def _create_session(self, track, car):
        self.track = track
        self.car = car
        last_id = self.con.execute("SELECT MAX(id) FROM sessions").fetchone()[0]
        self.session_id = (last_id or 0) + 1

        self.con.execute(
            "INSERT INTO sessions VALUES (?, ?, ?, ?, ?)",
            (self.session_id, self.track, self.car, "manual", datetime.now()),
        )
        self.con.commit()

        self.push_message(f"Session created: {self.car} @ {self.track}")