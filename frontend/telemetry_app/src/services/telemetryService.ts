import { apiFetch } from "./api";

export const fetchLapTelemetry = async (lapId: number) => {

  const res = await apiFetch(
    `http://127.0.0.1:8000/telemetry/${lapId}`
  );

  if (!res.ok) throw new Error("Failed to fetch telemetry");

  const data = await res.json();

  return data.samples || [];
};

export const fetchLiveTelemetry = async () => {

  const res = await apiFetch(
    "http://127.0.0.1:8000/telemetry/live"
  );

  if (!res.ok) throw new Error("Failed to fetch live telemetry");

  return res.json();
};