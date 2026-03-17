import React, { useEffect, useRef, useState } from "react";

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

const LivePage: React.FC<{ pushMessage: (msg: string) => void }> = ({
  pushMessage,
}) => {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetrySample | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const toggleConnection = () => {
    if (connected) {
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
      pushMessage("Telemetry disconnected");
      return;
    }

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

      if (data.message) {
        pushMessage(data.message);
      }
    };

    ws.onerror = () => {
      pushMessage("Telemetry websocket error");
    };

    ws.onclose = () => {
      setConnected(false);
      pushMessage("Telemetry disconnected");
    };
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
    telemetry && telemetry.fuel.capacity > 0
      ? (telemetry.fuel.tank / telemetry.fuel.capacity) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      {/* Connect Button */}
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

      {telemetry && (
        <div className="grid grid-cols-12 gap-6">
          {/* Throttle / Brake */}
          <div className="col-span-1 flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-sm mb-2">Throttle</span>
              <div className="h-64 w-6 bg-gray-800 rounded relative">
                <div
                  className="absolute bottom-0 w-full bg-green-500"
                  style={{ height: `${telemetry.throttle * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-sm mb-2">Brake</span>
              <div className="h-64 w-6 bg-gray-800 rounded relative">
                <div
                  className="absolute bottom-0 w-full bg-red-500"
                  style={{ height: `${telemetry.brake * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tires */}
          <div className="col-span-6 grid grid-cols-2 gap-6">
            {["FL", "FR", "RL", "RR"].map((wheel) => {
              const tire = telemetry.tires[wheel];
              return (
                <div
                  key={wheel}
                  className="bg-gray-800 rounded-md p-3 text-sm space-y-1"
                >
                  <div className="font-semibold">{wheel}</div>
                  <div className={tireTempColor(tire.temp)}>
                    Temp: {tire.temp.toFixed(1)}°C
                  </div>
                  <div>Pressure: {tire.pressure.toFixed(1)} PSI</div>
                  <div>Wear: {tire.wear.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>

          {/* Brakes */}
          <div className="col-span-2 bg-gray-800 rounded-md p-3 space-y-1">
            <div className="font-semibold mb-2">Brakes</div>
            {["FL", "FR", "RL", "RR"].map((wheel) => {
              const brake = telemetry.brakes[wheel];
              return (
                <div key={wheel} className="text-sm">
                  {wheel}: {brake.temp.toFixed(0)}°C
                </div>
              );
            })}
          </div>

          {/* Fuel */}
          <div className="col-span-1 flex flex-col items-center">
            <span className="text-sm mb-2">Fuel</span>

            <div className="h-40 w-8 bg-gray-800 rounded relative">
              <div
                className="absolute bottom-0 w-full bg-yellow-500"
                style={{ height: `${fuelPercent}%` }}
              />
            </div>

            <div className="text-xs mt-2 text-center">
              {telemetry.fuel.tank.toFixed(1)} L
            </div>
          </div>

          {/* Car Info */}
          <div className="col-span-2 bg-gray-800 rounded-md p-3 space-y-1">
            <div className="text-lg font-semibold">
              {telemetry.speed_kmh.toFixed(0)} km/h
            </div>
            <div>Gear: {telemetry.display_gear}</div>
            <div>RPM: {telemetry.rpm}</div>
            <div>Lap: {telemetry.current_lap}</div>
            <div>Track: {telemetry.track}</div>
            <div>Car: {telemetry.car}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePage;