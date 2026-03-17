import React, { useState } from "react";
import type { Lap } from "../types/lap";

import LapList from "../components/LapList";
import TrackMap from "../components/TrackMap";
import TelemetryGraph from "../components/TelemetryGraph";

type Props = {
  pushMessage: (msg: string) => void;
};

const LapComparisonPage: React.FC<Props> = ({ pushMessage }) => {

  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLapIds, setSelectedLapIds] = useState<string[]>([]);

  const importLap = async () => {

    const json = prompt("Paste lap JSON");

    if (!json) return;

    try {

      const lap: Lap = JSON.parse(json);

      setLaps((prev) => [...prev, lap]);

      pushMessage("Lap imported");

    } catch {

      pushMessage("Invalid lap format");

    }
  };

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

      <div className="col-span-3 flex flex-col gap-4">

        <button
          onClick={importLap}
          className="bg-blue-600 hover:bg-blue-700 p-2 rounded-md"
        >
          Import Lap
        </button>

        <LapList
          laps={laps}
          selected={selectedLapIds}
          toggleLap={toggleLap}
        />

      </div>

      <div className="col-span-9 flex flex-col gap-4">

        <TelemetryGraph laps={selectedLaps} />

        <div className="flex-1">
          <TrackMap laps={selectedLaps} />
        </div>

      </div>

    </div>
  );
};

export default LapComparisonPage;