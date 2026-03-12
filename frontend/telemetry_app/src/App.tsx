import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SavedTelemetriesPage from "./pages/SavedTelemetriesPage";
import TelemetryStatus from "./components/TelemetryStatus";
import LivePage from "./pages/LivePage";

const App: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isTelemetryRunning, setIsTelemetryRunning] = useState(false);

  const pushMessage = (msg: string) => {
    setMessages((prev) => (prev.includes(msg) ? prev : [...prev, msg]));
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white relative">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                pushMessage={pushMessage}
                isTelemetryRunning={isTelemetryRunning}
                setIsTelemetryRunning={setIsTelemetryRunning}
              />
            }
          />

          <Route
            path="/saved"
            element={<SavedTelemetriesPage pushMessage={pushMessage} />}
          />

          <Route
            path="/live"
            element={
              <LivePage
                pushMessage={pushMessage}
                isTelemetryRunning={isTelemetryRunning}
              />
            }
          />
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