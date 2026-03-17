export type Tire = {
  temp: number;
  pressure: number;
  wear: number;
};

export type Brake = {
  temp: number;
};

export type TelemetrySample = {
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