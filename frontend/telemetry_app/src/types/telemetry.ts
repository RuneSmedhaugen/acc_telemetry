export type TelemetrySample = {
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  steering: number;
  prm: number;
  gear: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  yaw: number;
  gforce_x: number;
  gforce_y: number;
  gforce_z: number;

  // Optional for now (so nothing breaks)
  lapDistance?: number;
  sector?: number;
};