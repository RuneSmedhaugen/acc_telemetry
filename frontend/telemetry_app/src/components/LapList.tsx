import React from "react";
import type { Lap } from "../types/lap";

type Props = {
  laps: Lap[];
  selected: string[];
  toggleLap: (id: string) => void;
};

const LapList: React.FC<Props> = ({ laps, selected, toggleLap }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-md h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-3">Laptimes</h2>

      {laps.map((lap) => (
        <div
          key={lap.id}
          className="flex items-center justify-between text-sm border-b border-gray-700 py-2"
        >
          <span>
            {lap.laptime.toFixed(3)} - {lap.driver} - {lap.car}
          </span>

          <input
            type="checkbox"
            checked={selected.includes(lap.id)}
            onChange={() => toggleLap(lap.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default LapList;