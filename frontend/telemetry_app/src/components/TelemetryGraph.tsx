import React from "react";
import type { Lap } from "../types/lap";

type Props = {
  laps: Lap[];
};

const TelemetryGraph: React.FC<Props> = () => {
  return (
    <div className="bg-gray-800 rounded-md p-4 h-48 flex items-center justify-center">
      <span className="text-gray-400">
        Telemetry graph (speed / throttle / brake comparison)
      </span>
    </div>
  );
};

export default TelemetryGraph;