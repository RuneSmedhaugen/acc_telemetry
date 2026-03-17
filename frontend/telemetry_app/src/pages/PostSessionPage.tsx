import React, { useEffect, useState } from "react";
import type { Lap } from "../types/lap";
import { getTracks, getLapsForTrack } from "../services/lapService";

import LapList from "../components/LapList";
import TelemetryGraph from "../components/TelemetryGraph";
import TrackMap from "../components/TrackMap";

type Props = {
  pushMessage: (msg: string) => void;
};

const PostSessionPage: React.FC<Props> = ({ pushMessage }) => {
  const [tracks, setTracks] = useState<string[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>("");

  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLapIds, setSelectedLapIds] = useState<string[]>([]);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const data = await getTracks();
        setTracks(data);
      } catch {
        pushMessage("Failed to load tracks");
      }
    };

    loadTracks();
  }, [pushMessage]);

  useEffect(() => {
    if (!selectedTrack) return;

    const loadLaps = async () => {
      try {
        const data = await getLapsForTrack(selectedTrack);
        setLaps(data);
      } catch {
        pushMessage("Failed to load laps");
      }
    };

    loadLaps();
  }, [selectedTrack, pushMessage]);

  const toggleLap = (id: string) => {
    setSelectedLapIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const selectedLaps = laps.filter((l) => selectedLapIds.includes(l.id));

  return (
    <div className="p-6 grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">

      {/* LEFT PANEL */}
      <div className="col-span-3 flex flex-col gap-4">

        <select
          className="bg-gray-800 p-2 rounded-md"
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
        >
          <option value="">Select Track</option>

          {tracks.map((track) => (
            <option key={track} value={track}>
              {track}
            </option>
          ))}
        </select>

        <LapList
          laps={laps}
          selected={selectedLapIds}
          toggleLap={toggleLap}
        />
      </div>

      {/* RIGHT PANEL */}
      <div className="col-span-9 flex flex-col gap-4">

        <TelemetryGraph laps={selectedLaps} />

        <div className="flex-1">
          <TrackMap laps={selectedLaps} />
        </div>

      </div>
    </div>
  );
};

export default PostSessionPage;