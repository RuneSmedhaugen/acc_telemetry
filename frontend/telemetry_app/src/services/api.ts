let API_KEY: string | null = null;

export const loadApiKey = async (): Promise<boolean> => {
  const storedKey = localStorage.getItem("api_key");
  if (!storedKey) {
    API_KEY = null;
    return false;
  }

  const res = await fetch("http://127.0.0.1:8000/api/validate-key", {
    headers: { "x-api-key": storedKey }
  });

  if (!res.ok) {
    localStorage.removeItem("api_key");
    API_KEY = null;
    return false;
  }

  API_KEY = storedKey;
  return true;
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  if (!API_KEY) {
    const valid = await loadApiKey();
    if (!valid) throw new Error("No valid API key");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("api_key");
    API_KEY = null;
    const valid = await loadApiKey();
    if (!valid) throw new Error("API key invalid after reload");

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY!,
        ...(options.headers || {}),
      },
    });
  }

  return res;
};

export const getApiKey = () => localStorage.getItem("api_key");
export const saveApiKey = (key: string) => {
  localStorage.setItem("api_key", key);
  API_KEY = key;
};