import React, { useEffect, useState } from "react";
import TelemetryGraph from "../components/TelemetryGraph";
import TrackMap from "../components/TrackMap";
import LapComparisonPage from "./LapComparisonPage";
import type { TelemetrySample } from "../types/telemetry";

type Lap = {
  id: number;
  lap_number: number;
  lap_time: number;
  is_valid: boolean;
  session_date: string;
  car: string;
};

type SavedTelemetriesPageProps = {
  pushMessage: (msg: string) => void;
};

const SavedTelemetriesPage: React.FC<SavedTelemetriesPageProps> = ({ pushMessage }) => {
  const [tracks, setTracks] = useState<string[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetrySample[]>([]);
  const [selectedLapIds, setSelectedLapIds] = useState<number[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  const formatLapTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
  };

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/tracks-with-data");
        const data = await res.json();
        setTracks(data.tracks || []);
      } catch (err) {
        console.error(err);
        pushMessage("Failed to fetch tracks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [pushMessage]);

  const handleSelectTrack = async (track: string) => {
    setSelectedTrack(track);
    setSelectedLap(null);
    setTelemetry([]);
    setSelectedLapIds([]);

    try {
      const res = await fetch(`http://127.0.0.1:8000/laps-by-track/${track}`);
      const data = await res.json();
      setLaps(data.laps || []);
      pushMessage(`Track "${track}" loaded with ${data.laps?.length || 0} laps.`);
    } catch (err) {
      console.error(err);
      pushMessage(`Failed to fetch laps for track "${track}".`);
    }
  };

  const handleSelectLap = async (lap: Lap) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/telemetry/${lap.id}`);
      const data = await res.json();
      setTelemetry(data.samples || []);
      setSelectedLap(lap);
      pushMessage(`Lap ${lap.lap_number} telemetry loaded.`);
    } catch (err) {
      console.error(err);
      pushMessage("Failed to fetch telemetry.");
    }
  };

  const toggleLapSelection = (lapId: number) => {
    setSelectedLapIds((prev) =>
      prev.includes(lapId)
        ? prev.filter((id) => id !== lapId)
        : [...prev, lapId]
    );
  };

  const handleCompare = () => {
    if (selectedLapIds.length < 2) {
      alert("Select at least 2 laps to compare");
      return;
    }
    setCompareMode(true);
  };

  if (compareMode) {
    return (
      <LapComparisonPage lapIds={selectedLapIds} onClose={() => setCompareMode(false)} />
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Saved Telemetries</h1>

      <button onClick={() => {
        setSelectedTrack(null);
        setLaps([]);
        setSelectedLap(null);
        setTelemetry([]);
        setSelectedLapIds([]);
      }} style={{ marginBottom: 20 }}>
        Back to Home
      </button>

      {loading && <p>Loading tracks...</p>}
      {!loading && tracks.length === 0 && <p>No telemetry data saved yet.</p>}

      {/* Track Selection */}
      {!selectedTrack && tracks.length > 0 && (
        <div>
          <h2>Select Track</h2>
          <select onChange={(e) => handleSelectTrack(e.target.value)} defaultValue="">
            <option value="" disabled>Choose track</option>
            {tracks.map((track) => (
              <option key={track} value={track}>{track}</option>
            ))}
          </select>
        </div>
      )}

      {/* Lap List */}
      {selectedTrack && (
        <div style={{ marginTop: 20 }}>
          <h2>{selectedTrack} Laps</h2>

          {laps.length === 0 && <p>No laps found for this track.</p>}

          {laps.length > 0 && (
            <>
              <ul>
                {laps.map((lap) => (
                  <li key={lap.id} style={{ marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={selectedLapIds.includes(lap.id)}
                      onChange={() => toggleLapSelection(lap.id)}
                      style={{ marginRight: 8 }}
                    />
                    Lap {lap.lap_number} — {formatLapTime(lap.lap_time)} — {lap.car} —{" "}
                    {new Date(lap.session_date).toLocaleString()}
                    <button onClick={() => handleSelectLap(lap)} style={{ marginLeft: 10 }}>
                      View Telemetry
                    </button>
                  </li>
                ))}
              </ul>

              <button onClick={handleCompare} style={{ marginTop: 15 }}>
                Compare Selected Laps
              </button>
            </>
          )}
        </div>
      )}

      {/* Telemetry Viewer */}
      {selectedLap && telemetry.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3>Lap {selectedLap.lap_number} Telemetry</h3>
          <TelemetryGraph samples={telemetry} />
          <div style={{ width: 400, height: 400, cursor: "pointer", marginTop: 20 }}
               onClick={() => setFullscreen(true)}>
            <TrackMap samples={telemetry} />
          </div>

          {fullscreen && (
            <div onClick={() => setFullscreen(false)}
                 style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: "90vw", height: "90vh", background: "#111", padding: 20, borderRadius: 12 }}>
                <TrackMap samples={telemetry} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedTelemetriesPage;