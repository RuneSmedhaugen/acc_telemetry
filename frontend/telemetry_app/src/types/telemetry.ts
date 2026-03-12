
export type TireData = {
  temp: number;
  wear: number;
  pressure: number;
};

export type BrakeData = {
  temp: number;
};

export type WeatherData = {
  air_temp: number;
  track_temp: number;
  rain_density: number;
  weather_type: string;
};

export type FuelData = {
  tank: number;
  capacity: number;
  per_lap: number;
};

export type GForces = {
  lat: number;
  long: number;
  vert: number;
};

export type Position = {
  x: number;
  y: number;
  z: number;
};

export type TelemetrySample = {
  timestamp: number;
  car: string;
  track: string;
  speed: number;
  session_time: number;
  current_lap: number;
  lap_distance: number;
  speed_kmh: number;
  gear: number;
  rpm: number;
  throttle: number;
  brake: number;
  clutch: number;
  steering: number;
  prm: number;
  yaw: number;
  pitch: number;
  roll: number;
  gforces: GForces;
  fuel: FuelData;
  tires: Record<"FL" | "FR" | "RL" | "RR", TireData>;
  brakes: Record<"FL" | "FR" | "RL" | "RR", BrakeData>;
  weather: WeatherData;
  position: Position;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  gforce_x: number;
  gforce_y: number;
  gforce_z: number;
  // Optional / future fields
  sector?: number;
  lapDistance?: number;
};