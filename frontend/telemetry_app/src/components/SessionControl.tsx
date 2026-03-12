import React from "react";
import { Play, StopCircle } from "lucide-react";
import { startTelemetry, stopTelemetry } from "../services/sessionService";

type Props = {
  pushMessage: (msg: string) => void;
  running: boolean;
  setRunning: (v: boolean) => void;
};

const SessionControl: React.FC<Props> = ({
  pushMessage,
  running,
  setRunning,
}) => {
  const toggleTelemetry = async () => {
    try {
      if (running) {
        await stopTelemetry();
        pushMessage("Telemetry stopped");
        setRunning(false);
      } else {
        await startTelemetry();
        pushMessage("Telemetry started");
        setRunning(true);
      }
    } catch {
      pushMessage("Telemetry control failed");
    }
  };

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-white">
        Session Control
      </h2>

      <button
        onClick={toggleTelemetry}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${
          running
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {running ? <StopCircle size={18} /> : <Play size={18} />}

        {running ? "Stop Telemetry" : "Start Telemetry"}
      </button>
    </div>
  );
};

export default SessionControl;