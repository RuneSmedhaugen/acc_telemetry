import React, { useState, useEffect } from "react";
import { Play, StopCircle, Database, Settings } from "lucide-react";
import TrackMap from "../components/TrackMap";
import TelemetryGraph from "../components/TelemetryGraph";
import type { TelemetrySample } from "../types/telemetry";
import LiveTelemetry from "../components/LiveTelemetry";

type Tab = "home" | "live" | "postSession" | "options";

type HomePageProps = { pushMessage: (msg: string) => void; };
type TrackSummary = { trackName: string; bestLapId: number; bestLapTime: number; };
type Lap = { id: number; lap_number: number; lap_time: number; car: string; session_date: string; };

const HomePage: React.FC<HomePageProps> = ({ pushMessage }) => {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isTelemetryRunning, setIsTelemetryRunning] = useState(false);

  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetrySample[]>([]);
  const [loadingLaps, setLoadingLaps] = useState(false);

  // ==============================
  // LOAD TRACKS ON START
  // ==============================

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/tracks-with-laps");
        const data = await res.json();
        setTracks(data.tracks || []);
        pushMessage(`Loaded ${data.tracks?.length || 0} tracks.`);
      } catch {
        pushMessage("Failed to load tracks.");
      }
    };

    fetchTracks();
  }, []);

  // ==============================
  // TELEMETRY CONTROL
  // ==============================

  const handleTelemetryToggle = async () => {
    try {
      const url = `http://127.0.0.1:8000/sessions/${isTelemetryRunning ? "stop" : "start"}`;
      const res = await fetch(url, { method: "POST" });

      if (res.ok) {
        const newState = !isTelemetryRunning;
        setIsTelemetryRunning(newState);

        pushMessage(`Telemetry ${newState ? "started" : "stopped"}.`);

        // refresh tracks after stopping telemetry
        if (!newState) {
          const tracksRes = await fetch("http://127.0.0.1:8000/tracks-with-laps");
          const data = await tracksRes.json();
          setTracks(data.tracks || []);
        }
      }
    } catch {
      pushMessage(`Failed to ${isTelemetryRunning ? "stop" : "start"} telemetry.`);
    }
  };

  // ==============================
  // TRACK SELECTION
  // ==============================

  const handleSelectTrack = async (trackName: string) => {
    setSelectedTrack(trackName);
    setLaps([]);
    setSelectedLap(null);
    setTelemetry([]);
    setLoadingLaps(true);

    try {
      pushMessage(`Fetching laps for ${trackName}...`);

      const res = await fetch(
        `http://127.0.0.1:8000/laps?track=${encodeURIComponent(trackName)}`
      );

      const data = await res.json();

      setLaps(data.laps || []);

      pushMessage(`Loaded ${data.laps.length} laps for ${trackName}`);
    } catch {
      pushMessage(`Error fetching laps for ${trackName}`);
    } finally {
      setLoadingLaps(false);
    }
  };

  // ==============================
  // LAP SELECTION
  // ==============================

  const handleSelectLap = async (lap: Lap) => {
    setSelectedLap(lap);
    setTelemetry([]);

    try {
      pushMessage(`Fetching telemetry for Lap ${lap.lap_number}...`);

      const res = await fetch(`http://127.0.0.1:8000/telemetry/${lap.id}`);

      const data = await res.json();

      setTelemetry(data.samples || []);

      pushMessage(`Loaded telemetry for Lap ${lap.lap_number}`);
    } catch {
      pushMessage(`Error fetching telemetry for Lap ${lap.lap_number}`);
    }
  };

  // ==============================
  // FORMAT LAP TIME
  // ==============================

  const formatLapTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
  };

  // ==============================
  // POST SESSION TAB
  // ==============================

  const renderPostSession = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">Post Session Analysis</h2>

      <div className="bg-gray-800 p-4 rounded-md shadow-md text-white">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Database size={18} /> Select Track
        </h3>

        <select
          value={selectedTrack || ""}
          onChange={(e) => handleSelectTrack(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded-md w-full"
        >
          <option value="" disabled>Select a track...</option>

          {tracks.map((track) => (
            <option key={track.trackName} value={track.trackName}>
              {track.trackName} — Best: {formatLapTime(track.bestLapTime)}
            </option>
          ))}
        </select>
      </div>

      {selectedTrack && (
        <div className="bg-gray-800 p-4 rounded-md shadow-md text-white space-y-4">
          <h4 className="font-semibold mb-2">{selectedTrack} — Laps</h4>

          {loadingLaps && <p className="text-gray-300">Loading laps...</p>}

          {!loadingLaps && laps.length === 0 && (
            <p className="text-gray-300">No laps found for this track.</p>
          )}

          {!loadingLaps && laps.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {laps.map((lap) => (
                <button
                  key={lap.id}
                  onClick={() => handleSelectLap(lap)}
                  className={`p-2 bg-gray-700 rounded-md text-left hover:bg-gray-600 transition ${
                    selectedLap?.id === lap.id ? "border-2 border-yellow-500" : ""
                  }`}
                >
                  Lap {lap.lap_number} — {lap.car} — {formatLapTime(lap.lap_time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedLap && telemetry.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">
            Lap {selectedLap.lap_number} Telemetry
          </h4>

          <div className="w-full h-80 md:h-96 bg-gray-900 rounded-lg p-2">
            <TelemetryGraph samples={telemetry} />
          </div>

          <div className="w-full h-80 md:h-96 bg-gray-900 rounded-lg p-2">
            <TrackMap samples={telemetry} />
          </div>
        </div>
      )}
    </div>
  );

  // ==============================
  // OPTIONS TAB
  // ==============================

  const renderOptions = () => (
    <div className="text-white space-y-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Settings size={18} /> Options
      </h2>

      <button
        onClick={async () => {
          if (!confirm("⚠️ This will delete all telemetry, laps, and sessions. Are you sure?"))
            return;

          try {
            const res = await fetch("http://127.0.0.1:8000/reset", { method: "DELETE" });

            if (res.ok) {
              setTracks([]);
              setSelectedTrack(null);
              setLaps([]);
              setSelectedLap(null);
              setTelemetry([]);

              pushMessage("Database cleared successfully.");
            }
          } catch {
            pushMessage("Error purging database.");
          }
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
      >
        Purge Database
      </button>
    </div>
  );

  // ==============================
  // HOME TAB
  // ==============================

  const renderHome = () => (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Session Control</h2>

        <button
          onClick={handleTelemetryToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${
            isTelemetryRunning
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isTelemetryRunning ? <StopCircle size={18} /> : <Play size={18} />}
          {isTelemetryRunning ? "Stop Telemetry" : "Start Telemetry"}
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded-md text-white">
        <h3 className="font-semibold mb-2">Overview</h3>
        <p>Your telemetry dashboard will display session info and lap analysis here.</p>
      </div>

      <div className="bg-gray-800 p-4 rounded-md text-white">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Database size={18} /> Leaderboard
        </h3>

        <select
          value={selectedTrack || ""}
          onChange={(e) => handleSelectTrack(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded-md w-full"
        >
          <option value="" disabled>Select a track...</option>

          {tracks.map((track) => (
            <option key={track.trackName} value={track.trackName}>
              {track.trackName} — Best: {formatLapTime(track.bestLapTime)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

const renderLive = () => <LiveTelemetry pushMessage={pushMessage} />;

  const renderTabContent = () => {
    switch (activeTab) {
      case "home": return renderHome();
      case "live": return renderLive();
      case "postSession": return renderPostSession();
      case "options": return renderOptions();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">

      <nav className="flex space-x-4 mb-6 border-b border-gray-700">
        {["home", "live", "postSession", "options"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as Tab)}
            className={`px-3 py-2 font-medium rounded-t-md ${
              activeTab === tab
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {renderTabContent()}

    </div>
  );
};

export default HomePage;