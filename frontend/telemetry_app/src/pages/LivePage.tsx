import React, { useEffect, useRef, useState } from "react";
import { startTelemetry, stopTelemetry } from "../services/sessionService";

type Tire = {
  temp: number;
  pressure: number;
  wear: number;
};

type Brake = {
  temp: number;
};

type TelemetrySample = {
  timestamp: number;
  speed_kmh: number;
  throttle: number;
  brake: number;
  gear: number;
  display_gear: string;
  rpm: number;

  tires: Record<string, Tire>;
  brakes: Record<string, Brake>;

  fuel: {
    tank: number;
    capacity: number;
    per_lap: number;
  };

  gforces: {
    lat: number;
    long: number;
    vert: number;
  };

  position: {
    x: number;
    y: number;
    z: number;
  };

  session_time: number;
  current_lap: number;
  lap_distance: number;

  track: string;
  car: string;
};

const defaultTelemetry: TelemetrySample = {
  timestamp: 0,
  speed_kmh: 0,
  throttle: 0,
  brake: 0,
  gear: 0,
  display_gear: "N",
  rpm: 0,
  tires: {
    FL: { temp: 0, pressure: 0, wear: 0 },
    FR: { temp: 0, pressure: 0, wear: 0 },
    RL: { temp: 0, pressure: 0, wear: 0 },
    RR: { temp: 0, pressure: 0, wear: 0 },
  },
  brakes: {
    FL: { temp: 0 },
    FR: { temp: 0 },
    RL: { temp: 0 },
    RR: { temp: 0 },
  },
  fuel: { tank: 0, capacity: 0, per_lap: 0 },
  gforces: { lat: 0, long: 0, vert: 0 },
  position: { x: 0, y: 0, z: 0 },
  session_time: 0,
  current_lap: 0,
  lap_distance: 0,
  track: "-",
  car: "-",
};

const LivePage: React.FC<{ pushMessage: (msg: string) => void }> = ({
  pushMessage,
}) => {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetrySample>(
    defaultTelemetry
  );

  const wsRef = useRef<WebSocket | null>(null);

  const toggleConnection = async () => {
    // 🔴 DISCONNECT
    if (connected) {
      wsRef.current?.close();
      wsRef.current = null;

      await stopTelemetry(); // 🔥 IMPORTANT

      setConnected(false);
      pushMessage("Telemetry disconnected");
      return;
    }

    try {
      // 🟢 START TELEMETRY FIRST
      await startTelemetry();
      pushMessage("Telemetry started");

      // 🟢 THEN CONNECT WS
      const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        pushMessage("Telemetry connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }

        if (data.messages) {
          data.messages.forEach((msg: string) => pushMessage(msg));
        }
      };

      ws.onerror = () => {
        pushMessage("Telemetry websocket error");
      };

      ws.onclose = () => {
        setConnected(false);
        pushMessage("Telemetry disconnected");
      };
    } catch (err) {
      pushMessage("Failed to start telemetry");
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const tireTempColor = (temp: number) => {
    if (temp < 50) return "text-blue-400";
    if (temp < 90) return "text-green-400";
    if (temp < 110) return "text-yellow-400";
    return "text-red-500";
  };

  const fuelPercent =
    telemetry.fuel.capacity > 0
      ? (telemetry.fuel.tank / telemetry.fuel.capacity) * 100
      : 0;

  return (
    <div className="w-full h-full bg-gray-900 text-white p-4 flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={toggleConnection}
          className={`px-4 py-2 rounded-md font-semibold ${
            connected
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>

        <div className="text-lg font-semibold">
          {telemetry.speed_kmh.toFixed(0)} km/h
        </div>
        <div>Gear: {telemetry.display_gear}</div>
        <div>RPM: {telemetry.rpm}</div>
        <div>Lap: {telemetry.current_lap}</div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex flex-col justify-center gap-4">
          {["Throttle", "Brake"].map((label, i) => {
            const value = i === 0 ? telemetry.throttle : telemetry.brake;
            const color = i === 0 ? "bg-green-500" : "bg-red-500";

            return (
              <div key={label} className="flex flex-col items-center">
                <span className="text-xs mb-1">{label}</span>
                <div className="h-40 w-5 bg-gray-800 rounded relative">
                  <div
                    className={`absolute bottom-0 w-full ${color}`}
                    style={{ height: `${value * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 place-content-center">
          {["FL", "FR", "RL", "RR"].map((wheel) => {
            const tire = telemetry.tires[wheel];
            return (
              <div
                key={wheel}
                className="w-24 h-20 bg-gray-800 rounded-md p-2 text-xs flex flex-col justify-between"
              >
                <div className="font-semibold text-center">{wheel}</div>
                <div className={`text-center ${tireTempColor(tire.temp)}`}>
                  {tire.temp.toFixed(0)}°
                </div>
                <div className="text-center">
                  {tire.pressure.toFixed(1)} PSI
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col justify-center gap-2 text-xs">
          <div className="font-semibold text-sm mb-1">Brakes</div>
          {["FL", "FR", "RL", "RR"].map((wheel) => {
            const brake = telemetry.brakes[wheel];
            return (
              <div key={wheel}>
                {wheel}: {brake.temp.toFixed(0)}°
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="text-xs mb-2">Fuel</span>
          <div className="h-32 w-6 bg-gray-800 rounded relative">
            <div
              className="absolute bottom-0 w-full bg-yellow-500"
              style={{ height: `${fuelPercent}%` }}
            />
          </div>
          <div className="text-xs mt-1">
            {telemetry.fuel.tank.toFixed(1)}L
          </div>
        </div>

        <div className="flex-1 bg-gray-800 rounded-md p-3 text-sm flex flex-col justify-between">
          <div>
            <div className="font-semibold mb-2">Session</div>
            <div>Track: {telemetry.track}</div>
            <div>Car: {telemetry.car}</div>
          </div>

          <div>
            <div className="font-semibold mt-2">Lap Info</div>
            <div>Lap Distance: {telemetry.lap_distance.toFixed(0)} m</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;