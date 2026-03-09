import React, { useRef, useEffect } from "react";
import { Play, StopCircle } from "lucide-react";

type TelemetryStatusProps = {
  messages: string[];
  isTelemetryRunning?: boolean; // optional prop to show live indicator
};

const TelemetryStatus: React.FC<TelemetryStatusProps> = ({ messages, isTelemetryRunning }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 text-sm shadow-lg z-50"
      style={{ maxHeight: "200px" }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">Telemetry Status</span>
        <span className="flex items-center gap-1">
          {isTelemetryRunning ? (
            <Play size={14} className="text-green-400 animate-pulse" />
          ) : (
            <StopCircle size={14} className="text-red-400" />
          )}
          {isTelemetryRunning ? "Live" : "Stopped"}
        </span>
      </div>
      <div
        ref={containerRef}
        className="overflow-y-auto h-32 border border-gray-700 rounded-md p-1 bg-gray-900"
      >
        {messages.length === 0 ? (
          <p className="text-gray-400">No messages yet...</p>
        ) : (
          messages.map((msg, idx) => (
            <p key={idx} className="whitespace-pre-wrap">{msg}</p>
          ))
        )}
      </div>
    </div>
  );
};

export default TelemetryStatus;