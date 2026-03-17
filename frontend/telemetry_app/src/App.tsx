import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Tabs from "./components/tabs";
import TelemetryStatus from "./components/TelemetryStatus";

import LivePage from "./pages/LivePage";
import PostSessionPage from "./pages/PostSessionPage";
import LapComparisonPage from "./pages/LapComparisonPage";
import SettingsPage from "./pages/SettingsPage";

const App: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);

  const pushMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();

    const formatted = `[${timestamp}] ${msg}`;

    setMessages((prev) =>
      prev.includes(formatted) ? prev : [...prev, formatted]
    );
  };

  return (
    <Router>

      <div className="min-h-screen flex flex-col bg-gray-900 text-white">

        <Tabs />

        <div className="flex-1">

          <Routes>

            <Route
              path="/"
              element={<LivePage pushMessage={pushMessage} />}
            />

            <Route
              path="/post"
              element={<PostSessionPage pushMessage={pushMessage} />}
            />

            <Route
              path="/compare"
              element={<LapComparisonPage pushMessage={pushMessage} />}
            />

            <Route
              path="/settings"
              element={<SettingsPage pushMessage={pushMessage} />}
            />

          </Routes>

        </div>

        <TelemetryStatus messages={messages} />

      </div>

    </Router>
  );
};

export default App;