import { apiFetch, saveApiKey } from "./api";
import type { ApiKeyResponse } from "../types/settings";

const API = "http://127.0.0.1:8000";

export const generateApiKey = async (): Promise<string> => {
  const res = await fetch(`${API}/api/generate-key`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to generate API key");
  }

  const data: ApiKeyResponse = await res.json();

  saveApiKey(data.api_key);

  return data.api_key;
};

export const resetApiKey = async (): Promise<void> => {
  const res = await apiFetch(`${API}/api/reset-key`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to reset API key");
  }

  localStorage.removeItem("api_key");
};

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem("api_key");
};