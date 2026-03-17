export type TelemetryPoint = {
  x: number;
  y: number;

  speed: number;
  throttle: number;
  brake: number;
  gear: number;

  time: number;
  distance: number;
};

export type Lap = {
  id: string;
  driver: string;
  car: string;
  track: string;

  laptime: number;
  date: string;

  telemetry: TelemetryPoint[];
};