import { useEffect, useState } from "react";
import type { TelemetrySample } from "../types/telemetry";

import SpeedDisplay from "../components/SpeedDisplay";
import PedalBars from "../components/PedalBars";
import GearDisplay from "../components/GearDisplay";

type LivePageProps = {
  pushMessage: (msg: string) => void;
  isTelemetryRunning: boolean;
};

export default function LivePage({
  pushMessage,
  isTelemetryRunning,
}: LivePageProps) {
  const [data, setData] = useState<TelemetrySample | null>(null);

  useEffect(() => {
    if (!isTelemetryRunning) return;

    const ws = new WebSocket("ws://localhost:8000/ws/live");

    ws.onopen = () => {
      pushMessage("Live telemetry connected");
    };

    ws.onmessage = (event) => {
      const sample: TelemetrySample = JSON.parse(event.data);
      setData(sample);
    };

    ws.onerror = () => {
      pushMessage("Live telemetry connection error");
    };

    ws.onclose = () => {
      pushMessage("Live telemetry disconnected");
    };

    return () => ws.close();
  }, [isTelemetryRunning]);

  if (!isTelemetryRunning) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Live Telemetry</h1>
        <p>Telemetry is not running.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Live Telemetry</h1>
        <p>Waiting for telemetry...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Live Telemetry</h1>

      <SpeedDisplay speed={data.speed} />

      <GearDisplay gear={data.gear} />

      <PedalBars throttle={data.throttle} brake={data.brake} />
    </div>
  );
}