import React, { useState, useEffect } from "react";
import SessionControl from "../components/SessionControl";
import TrackLeaderBoard from "../components/TrackLeaderBoard";
import PostSessionAnalysis from "../components/PostSessionAnalysis";
import OptionsPanel from "../components/Settings";
import LiveTelemetry from "../components/LiveTelemetry";
import { apiFetch } from "../services/api";

type Tab = "home" | "live" | "postSession" | "options";

type HomePageProps = {
  pushMessage: (msg: string) => void;
  isTelemetryRunning: boolean;
  setIsTelemetryRunning: (v: boolean) => void;
};

export type TrackSummary = {
  trackName: string;
  bestLapTime: number;
};

export type Lap = {
  id: number;
  lap_number: number;
  lap_time: number;
  car: string;
  session_date: string;
};

const HomePage: React.FC<HomePageProps> = ({
  pushMessage,
  isTelemetryRunning,
  setIsTelemetryRunning,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const res = await apiFetch("http://127.0.0.1:8000/tracks-with-laps");

        if (!res.ok) return;

        const data = await res.json();

        setTracks(data.tracks);
      } catch {
        pushMessage("Failed to load tracks");
      }
    };

    loadTracks();
  }, [pushMessage]);

  useEffect(() => {
    if (selectedTrack) {
      const loadLaps = async (track: string) => {
        try {
          const res = await apiFetch(
            `http://127.0.0.1:8000/laps?track=${encodeURIComponent(track)}`
          );

          if (!res.ok) return;

          const data = await res.json();

          setLaps(data.laps);
        } catch {
          pushMessage("Failed to load laps");
        }
      };
      loadLaps(selectedTrack);
    }
  }, [selectedTrack, pushMessage]);

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <>
            <SessionControl
              pushMessage={pushMessage}
              running={isTelemetryRunning}
              setRunning={setIsTelemetryRunning}
            />

            <TrackLeaderBoard
              tracks={tracks}
              selectedTrack={selectedTrack}
              setSelectedTrack={setSelectedTrack}
            />
          </>
        );

      case "live":
        return <LiveTelemetry pushMessage={pushMessage} />;

      case "postSession":
        return (
          <PostSessionAnalysis
            tracks={tracks}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            laps={laps}
            setLaps={setLaps}
            selectedLap={selectedLap}
            setSelectedLap={setSelectedLap}
            pushMessage={pushMessage}
          />
        );

      case "options":
        return <OptionsPanel pushMessage={pushMessage} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <nav className="flex space-x-4 mb-6 border-b border-gray-700">
        {["home", "live", "postSession", "options"].map((tab) => (
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

      {renderTab()}
    </div>
  );
};

export default HomePage;