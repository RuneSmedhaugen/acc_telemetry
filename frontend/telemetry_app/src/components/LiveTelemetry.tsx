// components/LiveTelemetry.tsx
import React, { useState, useEffect } from "react";
import type { TelemetrySample } from "../types/telemetry";

type LiveTelemetryProps = {
  pushMessage: (msg: string) => void;
};

const LiveTelemetry: React.FC<LiveTelemetryProps> = ({ pushMessage }) => {
  const [liveData, setLiveData] = useState<TelemetrySample | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/live");

    ws.onmessage = (event) => {
      const sample: TelemetrySample = JSON.parse(event.data);
      setLiveData(sample);
    };

    ws.onerror = () => {
      pushMessage("Live telemetry connection error");
    };

    ws.onclose = () => {
      pushMessage("Live telemetry disconnected");
    };

    return () => ws.close();
  }, []);

  if (!liveData) {
    return <div className="text-white">Waiting for live telemetry...</div>;
  }

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-xl font-semibold mb-4">Live Telemetry</h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Speed */}
        <div className="flex-1 bg-gray-800 p-4 rounded-md shadow-md flex flex-col items-center">
          <h3 className="mb-2 font-semibold">Speed</h3>
          <div className="text-6xl font-bold">{Math.round(liveData.speed)} km/h</div>
        </div>

        {/* Gear */}
        <div className="flex-1 bg-gray-800 p-4 rounded-md shadow-md flex flex-col items-center">
          <h3 className="mb-2 font-semibold">Gear</h3>
          <div className="text-5xl font-bold">{liveData.gear}</div>
        </div>

        {/* Pedals */}
        <div className="flex-1 bg-gray-800 p-4 rounded-md shadow-md">
          <h3 className="mb-2 font-semibold">Pedals</h3>

          <div className="mb-2">
            <span>Throttle</span>
            <div className="bg-gray-700 h-4 rounded mt-1">
              <div
                className="bg-green-500 h-4 rounded"
                style={{ width: `${liveData.throttle * 100}%` }}
              />
            </div>
          </div>

          <div>
            <span>Brake</span>
            <div className="bg-gray-700 h-4 rounded mt-1">
              <div
                className="bg-red-500 h-4 rounded"
                style={{ width: `${liveData.brake * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTelemetry;