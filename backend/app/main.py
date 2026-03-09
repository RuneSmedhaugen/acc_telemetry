# uvicorn app.main:app --reload

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import duckdb
import asyncio

from app.telemetry.TelemetryRecorder import TelemetryRecorder

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

con = duckdb.connect("telemetry.db")

recorder = TelemetryRecorder()


@app.get("/")
def root():
    return {"status": "ACC Telemetry backend running"}


# -----------------------------
# TELEMETRY CONTROL
# -----------------------------

@app.post("/sessions/start")
def start_session():

    if recorder.running:
        return {"status": "already running"}

    recorder.start()
    return {"status": "telemetry started"}


@app.post("/sessions/stop")
def stop_session():

    if not recorder.running:
        return {"status": "not running"}

    recorder.stop()
    return {"status": "telemetry stopped"}


# -----------------------------
# SESSIONS
# -----------------------------

@app.get("/sessions")
def get_sessions():

    rows = con.execute(
        "SELECT * FROM sessions ORDER BY session_date DESC"
    ).fetchall()

    sessions = [
        {
            "id": r[0],
            "track": r[1],
            "car": r[2],
            "session_type": r[3],
            "session_date": r[4],
        }
        for r in rows
    ]

    return {"sessions": sessions}


# -----------------------------
# TRACKS
# -----------------------------

@app.get("/tracks-with-laps")
def get_tracks_with_laps():

    rows = con.execute(
        """
        SELECT
            sessions.track,
            MIN(laps.lap_time)
        FROM laps
        JOIN sessions ON laps.session_id = sessions.id
        GROUP BY sessions.track
        ORDER BY sessions.track
        """
    ).fetchall()

    tracks = [
        {
            "trackName": r[0],
            "bestLapTime": r[1]
        }
        for r in rows
    ]

    return {"tracks": tracks}


# -----------------------------
# LAPS
# -----------------------------

@app.get("/laps")
def get_laps(track: str):

    rows = con.execute(
        """
        SELECT
            laps.id,
            laps.lap_number,
            laps.lap_time,
            sessions.car,
            sessions.session_date
        FROM laps
        JOIN sessions ON laps.session_id = sessions.id
        WHERE sessions.track = ?
        ORDER BY sessions.session_date DESC
        """,
        (track,)
    ).fetchall()

    laps = [
        {
            "id": r[0],
            "lap_number": r[1],
            "lap_time": r[2],
            "car": r[3],
            "session_date": r[4],
        }
        for r in rows
    ]

    return {"laps": laps}


# -----------------------------
# TELEMETRY STATUS
# -----------------------------

@app.get("/telemetry/status")
def telemetry_status():

    return {
        "running": recorder.running,
        "track": recorder.track,
        "car": recorder.car,
        "last_lap_time": recorder.last_lap_time,
        "last_lap_number": recorder.last_lap_number,
        "messages": recorder.messages[-10:]
    }


@app.get("/telemetry/live")
def get_live():

    if not recorder.live_sample:
        return {"status": "no data"}

    return recorder.live_sample


@app.get("/telemetry/{lap_id}")
def get_telemetry(lap_id: int):

    rows = con.execute(
        """
        SELECT * FROM telemetry_samples
        WHERE lap_id=?
        ORDER BY timestamp
        """,
        (lap_id,)
    ).fetchall()

    samples = [
        {
            "lap_id": r[0],
            "timestamp": r[1],
            "speed": r[2],
            "throttle": r[3],
            "brake": r[4],
            "steering": r[5],
            "gear": r[6],
            "rpm": r[7],
            "pos_x": r[8],
            "pos_y": r[9],
            "pos_z": r[10],
            "gforce_x": r[11],
            "gforce_y": r[12],
            "gforce_z": r[13],
            "yaw": r[14],
        }
        for r in rows
    ]

    return {"samples": samples}


# -----------------------------
# LIVE WEBSOCKET
# -----------------------------

@app.websocket("/ws/live")
async def live_ws(ws: WebSocket):

    await ws.accept()

    try:
        while True:

            if recorder.live_sample:
                await ws.send_json(recorder.live_sample)

            await asyncio.sleep(0.02)

    except:
        pass


# -----------------------------
# RESET DATABASE
# -----------------------------

@app.delete("/reset")
def reset_db():

    con.execute("DELETE FROM telemetry_samples")
    con.execute("DELETE FROM laps")
    con.execute("DELETE FROM sessions")

    return {"status": "database cleared"}