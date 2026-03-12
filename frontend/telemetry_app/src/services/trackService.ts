import { apiFetch } from "./api";

export const fetchTracks = async () => {

  const res = await apiFetch("http://127.0.0.1:8000/tracks-with-laps");

  if (!res.ok) throw new Error("Failed to fetch tracks");

  const data = await res.json();

  return data.tracks || [];
};

export const fetchLaps = async (trackName: string) => {

  const res = await apiFetch(
    `http://127.0.0.1:8000/laps?track=${encodeURIComponent(trackName)}`
  );

  if (!res.ok) throw new Error("Failed to fetch laps");

  const data = await res.json();

  return data.laps || [];
};