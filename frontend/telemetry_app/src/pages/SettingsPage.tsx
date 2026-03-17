import React, { useState } from "react";
import {
  generateApiKey,
  resetApiKey,
  getStoredApiKey,
} from "../services/settingsService";

type Props = {
  pushMessage: (msg: string) => void;
};

const SettingsPage: React.FC<Props> = ({ pushMessage }) => {

  const [apiKey, setApiKey] = useState<string | null>(() => getStoredApiKey());
  const [revealed, setRevealed] = useState(false);

  const handleGenerate = async () => {
    try {
      const key = await generateApiKey();
      setApiKey(key);
      pushMessage("API key generated");
    } catch {
      pushMessage("Failed to generate API key");
    }
  };

  const handleReset = async () => {
    const confirm = window.confirm("Reset API key?");
    if (!confirm) return;

    try {
      await resetApiKey();
      setApiKey(null);
      setRevealed(false);
      pushMessage("API key reset");
    } catch {
      pushMessage("Failed to reset API key");
    }
  };

  const copyKey = async () => {
    if (!apiKey) return;

    await navigator.clipboard.writeText(apiKey);
    pushMessage("API key copied");
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 4) + "************************" + apiKey.slice(-4)
    : "No API key generated";

  return (
    <div className="p-6 space-y-6">

      {/* API KEY DISPLAY */}
      <div className="bg-gray-800 p-4 rounded-md font-mono break-all">
        {apiKey ? (revealed ? apiKey : maskedKey) : "No API key generated"}
      </div>

      {/* BUTTON ROW */}
      <div className="flex gap-4 flex-wrap">

        <button
          onClick={handleGenerate}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md"
        >
          Generate API Key
        </button>

        <button
          onClick={() => setRevealed(!revealed)}
          disabled={!apiKey}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md disabled:opacity-40"
        >
          {revealed ? "Hide API Key" : "Reveal API Key"}
        </button>

        <button
          onClick={copyKey}
          disabled={!apiKey}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md disabled:opacity-40"
        >
          Copy API Key
        </button>

        <button
          onClick={handleReset}
          disabled={!apiKey}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md disabled:opacity-40"
        >
          Delete API Key
        </button>

      </div>

      {/* FUTURE SETTINGS */}
      <div className="text-gray-400 text-sm">
        Additional settings will appear here later.
      </div>

    </div>
  );
};

export default SettingsPage;