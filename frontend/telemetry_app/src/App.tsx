import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SavedTelemetriesPage from "./pages/SavedTelemetriesPage";
import TelemetryStatus from "./components/TelemetryStatus";
import LivePage from "./pages/LivePage";

const App: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isTelemetryRunning, setIsTelemetryRunning] = useState<boolean>(false);

  const pushMessage = (msg: string) => {
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/telemetry/status");

        if (!res.ok) return;

        const data = await res.json();

        setIsTelemetryRunning(data.running ?? false);

        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg: string) => {
            setMessages((prev) => {
              if (prev.includes(msg)) return prev;
              return [...prev, msg];
            });
          });
        }
      } catch (err) {
        console.error("Telemetry status polling error:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white relative">
        <Routes>
          <Route
        path="/"
        element={<HomePage pushMessage={pushMessage} />}
          />
          <Route
        path="/saved"
        element={<SavedTelemetriesPage pushMessage={pushMessage} />}
          />
          <Route path="/live" element={<LivePage />} />
        </Routes>

        <TelemetryStatus
          messages={messages}
          isTelemetryRunning={isTelemetryRunning}
        />
      </div>
    </Router>
  );
};

export default App;