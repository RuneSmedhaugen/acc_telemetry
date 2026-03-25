import type { TelemetrySample } from "../types/telemetry";

let ws: WebSocket | null = null;

export const connectTelemetry = (
  onTelemetry: (data: TelemetrySample) => void,
  onMessage: (msg: string) => void
) => {
  ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/live`);

  ws.onopen = () => {
    onMessage("Telemetry connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.telemetry) {
      onTelemetry(data.telemetry as TelemetrySample);
    }

    if (data.messages) {
      data.messages.forEach((msg: string) => onMessage(msg));
    }
  };

  ws.onerror = () => {
    onMessage("Telemetry websocket error");
  };

  ws.onclose = () => {
    onMessage("Telemetry disconnected");
  };
};

export const disconnectTelemetry = () => {
  ws?.close();
  ws = null;
};