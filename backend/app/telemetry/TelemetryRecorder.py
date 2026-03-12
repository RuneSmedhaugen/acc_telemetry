import threading
import time
from datetime import datetime
import duckdb

from pyaccsharedmemory import accSharedMemory, SharedMemoryTimeout


class TelemetryRecorder:

    def __init__(self):
        self.shm = accSharedMemory()
        self.running = False
        self.thread = None
        self.live_sample = None
        self.con = duckdb.connect("telemetry.db")
        self.current_lap = None
        self.lap_buffer = []
        self.session_id = None
        self.track = None
        self.car = None
        self.last_lap_time = None
        self.last_lap_number = None
        self.messages = []
        self.waiting_for_acc = False

    # =====================
    # HELPERS
    # =====================

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

    # =====================
    # PUBLIC API
    # =====================

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
            return
        self.push_message("Telemetry stopped")
        self.running = False
        if self.thread:
            self.thread.join()
        self.current_lap = None
        self.lap_buffer = []
        self.session_id = None
        self.track = None
        self.car = None

    # =====================
    # MAIN LOOP
    # =====================

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

            if not data:
                time.sleep(0.1)
                continue

            if self.waiting_for_acc:
                self.push_message("ACC telemetry detected")
                self.waiting_for_acc = False

            try:
                lap_number = getattr(data.Graphics, "completed_lap", 0)

                if self.session_id is None:
                    self._create_session(data)

                if self.current_lap is None:
                    self.current_lap = lap_number

                if lap_number != self.current_lap:
                    lap_time = self._safe_float(getattr(data.Graphics, "last_time", 0)) / 1000.0
                    is_valid = bool(getattr(data.Graphics, "is_valid_lap", True))
                    self._save_lap(self.current_lap, lap_time, is_valid)
                    self.lap_buffer = []
                    self.current_lap = lap_number

                coords = getattr(data.Graphics, "car_coordinates", None)
                pos_x = pos_y = pos_z = 0.0
                if coords and len(coords) > 0:
                    pos = coords[0]
                    pos_x = self._safe_float(getattr(pos, "x", 0))
                    pos_y = self._safe_float(getattr(pos, "y", 0))
                    pos_z = self._safe_float(getattr(pos, "z", 0))

                sample = {
                    "timestamp": time.time(),
                    "speed": self._safe_float(getattr(data.Physics, "speed_kmh", 0)),
                    "throttle": self._safe_float(getattr(data.Physics, "gas", 0)),
                    "brake": self._safe_float(getattr(data.Physics, "brake", 0)),
                    "steering": self._safe_float(getattr(data.Physics, "steer_angle", 0)),
                    "gear": self._safe_int(getattr(data.Physics, "gear", 0)),
                    "rpm": self._safe_int(getattr(data.Physics, "rpm", 0)),
                    "pos_x": pos_x,
                    "pos_y": pos_y,
                    "pos_z": pos_z,
                    "gforce_x": self._safe_float(getattr(data.Physics, "gForceLateral", 0)),
                    "gforce_y": self._safe_float(getattr(data.Physics, "gForceLongitudinal", 0)),
                    "gforce_z": self._safe_float(getattr(data.Physics, "gForceVertical", 0)),
                    "yaw": self._safe_float(getattr(data.Physics, "heading", 0)),
                }

                self.live_sample = sample
                self.lap_buffer.append(sample)
                time.sleep(0.01)
            except Exception as e:
                self.push_message(f"Telemetry processing error: {repr(e)}")
                time.sleep(0.2)

    # =====================
    # SESSION CREATION
    # =====================

    def _create_session(self, data):
        self.track = getattr(data.Static, "track", "").strip("\x00")
        self.car = getattr(data.Static, "car_model", "").strip("\x00")
        last_id = self.con.execute("SELECT MAX(id) FROM sessions").fetchone()[0]
        self.session_id = (last_id or 0) + 1
        self.con.execute(
            "INSERT INTO sessions (id, track, car, session_type, session_date) VALUES (?, ?, ?, ?, ?)",
            (self.session_id, self.track, self.car, "manual", datetime.now())
        )
        self.con.commit()
        self.push_message(f"Session created: {self.car} @ {self.track}")

    # =====================
    # SAVE LAP
    # =====================

    def _save_lap(self, lap_number, lap_time, is_valid):
        if len(self.lap_buffer) < 50:
            self.push_message(f"Skipped lap {lap_number} (not enough samples)")
            return

        last_id = self.con.execute("SELECT MAX(id) FROM laps").fetchone()[0]
        lap_id = (last_id or 0) + 1

        self.con.execute(
            "INSERT INTO laps (id, session_id, lap_number, lap_time, is_valid) VALUES (?, ?, ?, ?, ?)",
            (lap_id, self.session_id, lap_number, lap_time, is_valid)
        )

        rows = [
            (
                lap_id,
                s["timestamp"],
                s["speed"],
                s["throttle"],
                s["brake"],
                s["steering"],
                s["gear"],
                s["rpm"],
                s["pos_x"],
                s["pos_y"],
                s["pos_z"],
                s["gforce_x"],
                s["gforce_y"],
                s["gforce_z"],
                s["yaw"],
            )
            for s in self.lap_buffer
        ]

        self.con.executemany(
            "INSERT INTO telemetry_samples VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rows
        )

        self.con.commit()
        self.last_lap_number = lap_number
        self.last_lap_time = lap_time
        self.push_message(f"Saved lap {lap_number} ({lap_time:.3f}s)")