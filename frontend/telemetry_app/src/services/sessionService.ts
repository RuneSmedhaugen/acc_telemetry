import { apiFetch } from "./api";

export const startTelemetry = async () => {

  const res = await apiFetch(
    "http://127.0.0.1:8000/sessions/start",
    { method: "POST" }
  );

  if (!res.ok) throw new Error("Failed to start telemetry");

  return res.json();
};

export const stopTelemetry = async () => {

  const res = await apiFetch(
    "http://127.0.0.1:8000/sessions/stop",
    { method: "POST" }
  );

  if (!res.ok) throw new Error("Failed to stop telemetry");

  return res.json();
};