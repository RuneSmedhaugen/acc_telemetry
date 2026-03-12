import React, { useEffect, useState } from "react";
import { saveApiKey, getApiKey, loadApiKey } from "../services/api";

type SettingsProps = {
  pushMessage: (msg: string) => void;
};

const Settings: React.FC<SettingsProps> = ({ pushMessage }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const API = "http://127.0.0.1:8000";

  const handleResetDatabase = async () => {
    const confirmReset = window.confirm("Delete ALL telemetry data from the database?");
    if (!confirmReset) return;
    try {
      await fetch(`${API}/reset`, { method: "DELETE", headers: { "x-api-key": apiKey! } });
      pushMessage("Database cleared");
    } catch {
      pushMessage("Database reset failed");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadKey = async () => {
      const hasKey = await loadApiKey();
      if (!isMounted) return;

      if (hasKey) {
        setApiKey(getApiKey());
        pushMessage("Loaded API key from localStorage.");
      } else {
        setApiKey(null);
        pushMessage("No API key found. Generate one below.");
      }
    };
    loadKey();
    return () => { isMounted = false; };
  }, [pushMessage]);

  const generateKey = async () => {
    try {
      const res = await fetch(`${API}/api/generate-key`, { method: "POST" });
      const data = await res.json();
      if (!data.api_key) throw new Error("No key returned from server");

      saveApiKey(data.api_key);
      setApiKey(data.api_key);
      pushMessage("API key generated and saved locally.");
    } catch {
      pushMessage("Failed to generate API key.");
    }
  };

  const resetKey = async () => {
    const confirmReset = window.confirm("Reset API key? External tools will stop working.");
    if (!confirmReset) return;

    try {
      await fetch(`${API}/api/reset-key`, { method: "DELETE", headers: { "x-api-key": apiKey! } });
      localStorage.removeItem("api_key");
      setApiKey(null);
      setRevealed(false);
      pushMessage("API key reset. Generate a new one to continue.");
    } catch {
      pushMessage("Failed to reset API key.");
    }
  };

  const copyKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    pushMessage("API key copied to clipboard.");
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 4) + "************************" + apiKey.slice(-4)
    : "";

  return (
    <div className="text-white space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className="bg-gray-800 p-4 rounded-md space-y-3">
        <h3 className="font-semibold text-lg">API Access</h3>

        {!apiKey && (
          <div className="space-y-3">
            <p className="text-gray-300">
              Generate an API key to allow external telemetry tools to access your data.
            </p>
            <button
              onClick={generateKey}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md"
            >
              Generate API Key
            </button>
          </div>
        )}

        {apiKey && (
          <div className="space-y-3">
            <p className="text-gray-300">Your API key:</p>
            <div className="bg-gray-900 p-3 rounded-md font-mono break-all">
              {revealed ? apiKey : maskedKey}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRevealed(!revealed)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md"
              >
                {revealed ? "Hide" : "Reveal"}
              </button>

              <button
                onClick={copyKey}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
              >
                Copy
              </button>

              <button
                onClick={resetKey}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
              >
                Reset API Key
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleResetDatabase}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
        >
          Purge Database
        </button>
      </div>
    </div>
  );
};

export default Settings;