import React from "react";

type Props = {
  messages: string[];
};

const TelemetryStatus: React.FC<Props> = ({ messages }) => {
  return (
    <div className="bg-gray-900 border-t border-gray-800 p-3 h-28 overflow-y-auto font-mono text-xs">

      {messages.length === 0 && (
        <div className="text-gray-500">No telemetry messages</div>
      )}

      {messages.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}

    </div>
  );
};

export default TelemetryStatus;