import React from "react";
import type { Lap } from "../types/lap";

type Props = {
  laps: Lap[];
};

const TrackMap: React.FC<Props> = ({ laps }) => {
  if (laps.length === 0) {
    return (
      <div className="bg-gray-800 rounded-md flex items-center justify-center h-full">
        <span className="text-gray-400">Select laps to visualize</span>
      </div>
    );
  }

  const points = laps[0].telemetry;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="bg-gray-800 rounded-md p-4 h-full">
      <svg width="100%" height="100%" viewBox="-200 -200 400 400">
        <path
          d={path}
          fill="none"
          stroke="lime"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default TrackMap;