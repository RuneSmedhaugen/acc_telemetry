# uvicorn main:app --reload

from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import duckdb
import asyncio
import secrets
from datetime import datetime

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

# =============================
# DATABASE SCHEMA
# =============================

con.execute("""
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    track TEXT,
    car TEXT,
    session_type TEXT,
    session_date TIMESTAMP
)
""")

con.execute("""
CREATE TABLE IF NOT EXISTS laps (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    lap_number INTEGER,
    lap_time DOUBLE,
    is_valid BOOLEAN
)
""")

con.execute("""
CREATE TABLE IF NOT EXISTS telemetry_samples (
    lap_id INTEGER,
    timestamp DOUBLE,
    speed DOUBLE,
    throttle DOUBLE,
    brake DOUBLE,
    steering DOUBLE,
    gear INTEGER,
    rpm INTEGER,
    pos_x DOUBLE,
    pos_y DOUBLE,
    pos_z DOUBLE,
    gforce_x DOUBLE,
    gforce_y DOUBLE,
    gforce_z DOUBLE,
    yaw DOUBLE
)
""")

con.execute("""
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY,
    api_key TEXT UNIQUE,
    created_at TIMESTAMP
)
""")

recorder = TelemetryRecorder()

# =============================
# API KEY UTILITIES
# =============================

def generate_api_key():
    return "sk_" + secrets.token_urlsafe(32)

def verify_api_key(request: Request):
    key = request.headers.get("x-api-key")

    if not key:
        raise HTTPException(status_code=401, detail="Missing API key")

    row = con.execute(
        "SELECT id FROM api_keys WHERE api_key = ?",
        (key,)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid API key")

# =============================
# API ENDPOINTS
# =============================

@app.get("/api/validate-key")
def validate_key(request: Request):
    verify_api_key(request)
    return {"valid": True}


@app.post("/api/generate-key")
def create_api_key():

    last_id = con.execute(
        "SELECT MAX(id) FROM api_keys"
    ).fetchone()[0]

    new_id = (last_id or 0) + 1

    key = generate_api_key()

    con.execute(
        "INSERT INTO api_keys VALUES (?, ?, ?)",
        (new_id, key, datetime.now())
    )

    con.commit()

    return {"api_key": key}


@app.delete("/api/reset-key")
def reset_key(request: Request):

    verify_api_key(request)

    key_to_delete = request.headers.get("x-api-key")

    con.execute(
        "DELETE FROM api_keys WHERE api_key = ?",
        (key_to_delete,)
    )

    con.commit()

    return {"status": "deleted"}

# =============================
# TELEMETRY CONTROL
# =============================

@app.post("/sessions/start")
def start_session(request: Request):

    verify_api_key(request)

    if recorder.running:
        return {"status": "already running"}

    recorder.start()

    return {"status": "telemetry started"}


@app.post("/sessions/stop")
def stop_session(request: Request):

    verify_api_key(request)

    if not recorder.running:
        return {"status": "not running"}

    recorder.stop()

    return {"status": "telemetry stopped"}

# =============================
# SESSIONS / LAPS / TRACKS
# =============================

@app.get("/sessions")
def get_sessions(request: Request):

    verify_api_key(request)

    rows = con.execute(
        "SELECT * FROM sessions ORDER BY session_date DESC"
    ).fetchall()

    return {
        "sessions": [
            {
                "id": r[0],
                "track": r[1],
                "car": r[2],
                "session_type": r[3],
                "session_date": r[4],
            }
            for r in rows
        ]
    }


@app.get("/tracks-with-laps")
def get_tracks_with_laps(request: Request):

    verify_api_key(request)

    rows = con.execute("""
        SELECT sessions.track, MIN(laps.lap_time)
        FROM laps
        JOIN sessions ON laps.session_id = sessions.id
        GROUP BY sessions.track
        ORDER BY sessions.track
    """).fetchall()

    return {
        "tracks": [
            {
                "trackName": r[0],
                "bestLapTime": r[1]
            }
            for r in rows
        ]
    }


@app.get("/laps")
def get_laps(track: str, request: Request):

    verify_api_key(request)

    rows = con.execute("""
        SELECT laps.id, laps.lap_number, laps.lap_time, sessions.car, sessions.session_date
        FROM laps
        JOIN sessions ON laps.session_id = sessions.id
        WHERE sessions.track = ?
        ORDER BY sessions.session_date DESC
    """, (track,)).fetchall()

    return {
        "laps": [
            {
                "id": r[0],
                "lap_number": r[1],
                "lap_time": r[2],
                "car": r[3],
                "session_date": r[4],
            }
            for r in rows
        ]
    }


@app.get("/telemetry/{lap_id}")
def get_telemetry(lap_id: int, request: Request):

    verify_api_key(request)

    rows = con.execute(
        "SELECT * FROM telemetry_samples WHERE lap_id=? ORDER BY timestamp",
        (lap_id,),
    ).fetchall()

    return {
        "samples": [
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
    }

# =============================
# WEBSOCKET
# =============================

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

# =============================
# RESET DATABASE
# =============================

@app.delete("/reset")
def reset_db(request: Request):

    verify_api_key(request)

    con.execute("DELETE FROM telemetry_samples")
    con.execute("DELETE FROM laps")
    con.execute("DELETE FROM sessions")

    return {"status": "database cleared"}