import React, { useState, useEffect, useRef } from "react";
import type { TelemetrySample } from "../types/telemetry";

type LiveTelemetryProps = {
  pushMessage: (msg: string) => void;
};

const LiveTelemetry: React.FC<LiveTelemetryProps> = ({ pushMessage }) => {
  const [liveData, setLiveData] = useState<TelemetrySample | null>(null);
  const messagesSent = useRef<{ error: boolean; disconnect: boolean }>({
    error: false,
    disconnect: false,
  });

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/live");

    ws.onmessage = (event) => {
      const sample: TelemetrySample = JSON.parse(event.data);
      setLiveData(sample);
    };

    ws.onerror = () => {
      if (!messagesSent.current.error) {
        pushMessage("Live telemetry connection error");
        messagesSent.current.error = true;
      }
    };

    ws.onclose = () => {
      if (!messagesSent.current.disconnect) {
        pushMessage("Live telemetry disconnected");
        messagesSent.current.disconnect = true;
      }
    };

    return () => ws.close();
  }, [pushMessage]);

  if (!liveData) {
    return <div className="text-white">Waiting for live telemetry...</div>;
  }

  const tires = liveData.tires ?? {};
  const brakes = liveData.brakes ?? {};
  const weather = liveData.weather ?? {};
  const fuel = liveData.fuel ?? {};
  const g = liveData.gforces ?? {};

  const tireNames: ("FL" | "FR" | "RL" | "RR")[] = ["FL", "FR", "RL", "RR"];

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-xl font-semibold">Live Telemetry</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-md text-center">
          <div className="text-gray-400 text-sm">Speed</div>
          <div className="text-4xl font-bold">
            {Math.round(liveData.speed_kmh ?? 0)} km/h
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-md text-center">
          <div className="text-gray-400 text-sm">Gear</div>
          <div className="text-4xl font-bold">{liveData.gear ?? 0}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-md text-center">
          <div className="text-gray-400 text-sm">RPM</div>
          <div className="text-2xl font-bold">{liveData.rpm ?? 0}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-md text-center">
          <div className="text-gray-400 text-sm">Lap</div>
          <div className="text-2xl font-bold">{liveData.current_lap ?? 0}</div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md space-y-3">
        <h3 className="font-semibold">Inputs</h3>

        {["throttle", "brake", "clutch"].map((control) => {
          const value = (liveData[control as keyof TelemetrySample] ?? 0) as number;
          const color =
            control === "throttle"
              ? "green"
              : control === "brake"
              ? "red"
              : "yellow";
          return (
            <div key={control}>
              <div className="text-sm">{control.charAt(0).toUpperCase() + control.slice(1)}</div>
              <div className="bg-gray-700 h-4 rounded">
                <div
                  className={`bg-${color}-500 h-4 rounded`}
                  style={{ width: `${value * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-md text-center">
          <div className="text-gray-400 text-sm">Lat G</div>
          <div className="text-xl font-bold">{g.lat?.toFixed(2) ?? 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-md text-center">
          <div className="text-gray-400 text-sm">Long G</div>
          <div className="text-xl font-bold">{g.long?.toFixed(2) ?? 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-md text-center">
          <div className="text-gray-400 text-sm">Vert G</div>
          <div className="text-xl font-bold">{g.vert?.toFixed(2) ?? 0}</div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="font-semibold mb-2">Fuel</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-gray-400 text-sm">Tank</div>
            <div>{fuel.tank?.toFixed(1) ?? 0} L</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Capacity</div>
            <div>{fuel.capacity?.toFixed(1) ?? 0} L</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Per Lap</div>
            <div>{fuel.per_lap?.toFixed(2) ?? 0} L</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="font-semibold mb-3">Tyres</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tireNames.map((tire) => {
            const t = tires[tire] ?? {};
            const b = brakes[tire] ?? {};
            return (
              <div key={tire} className="bg-gray-700 p-3 rounded text-center">
                <div className="font-semibold">{tire}</div>
                <div className="text-sm">Temp: {t.temp?.toFixed(1) ?? 0}°C</div>
                <div className="text-sm">PSI: {t.pressure?.toFixed(2) ?? 0}</div>
                <div className="text-sm">Wear: {t.wear?.toFixed(1) ?? 0}%</div>
                <div className="text-sm">Brake: {b.temp?.toFixed(1) ?? 0}°C</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="font-semibold mb-2">Weather</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-gray-400 text-sm">Air</div>
            <div>{weather.air_temp ?? 0}°C</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Track</div>
            <div>{weather.track_temp ?? 0}°C</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Rain</div>
            <div>{weather.rain_density ?? 0}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Weather</div>
            <div>{weather.weather_type ?? "Unknown"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTelemetry;