import { apiFetch } from "./api";
import type { Lap } from "../types/lap";

const API = "http://127.0.0.1:8000";

export const getTracks = async (): Promise<string[]> => {
  const res = await apiFetch(`${API}/laps/tracks`);
  if (!res.ok) throw new Error("Failed to load tracks");
  return res.json();
};

export const getLapsForTrack = async (track: string): Promise<Lap[]> => {
  const res = await apiFetch(`${API}/laps/${track}`);
  if (!res.ok) throw new Error("Failed to load laps");
  return res.json();
};

export const getLapTelemetry = async (lapId: string): Promise<Lap> => {
  const res = await apiFetch(`${API}/laps/telemetry/${lapId}`);
  if (!res.ok) throw new Error("Failed to load telemetry");
  return res.json();
};