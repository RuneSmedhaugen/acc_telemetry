import React from "react";
import type { TelemetrySample } from "../types/telemetry";

type TrackMapComparisonProps = {
  laps: TelemetrySample[][]; // array of laps, each is a list of samples
  colors?: string[];          // optional colors for each lap
};

const defaultColors = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#06b6d4"];

const TrackMapComparison: React.FC<TrackMapComparisonProps> = ({
  laps,
  colors = defaultColors,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || laps.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // compute bounds across all laps
    const allX: number[] = [];
    const allZ: number[] = [];

    laps.forEach((lap) => {
      lap.forEach((s) => {
        allX.push(s.pos_x);
        allZ.push(s.pos_z);
      });
    });

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minZ = Math.min(...allZ);
    const maxZ = Math.max(...allZ);

    const padding = 30;
    const trackWidth = Math.max(1, maxX - minX);
    const trackHeight = Math.max(1, maxZ - minZ);

    const scale = Math.min(
      (canvas.width - 2 * padding) / trackWidth,
      (canvas.height - 2 * padding) / trackHeight
    );

    const offsetX = (canvas.width - trackWidth * scale) / 2;
    const offsetY = (canvas.height - trackHeight * scale) / 2;

    const toCanvas = (x: number, z: number) => ({
      x: offsetX + (x - minX) * scale,
      y: offsetY + (z - minZ) * scale,
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    laps.forEach((lap, i) => {
      const color = colors[i % colors.length];

      for (let j = 1; j < lap.length; j++) {
        const p0 = toCanvas(lap[j - 1].pos_x, lap[j - 1].pos_z);
        const p1 = toCanvas(lap[j].pos_x, lap[j].pos_z);

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, lap[j].speed / 120);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    });
  }, [laps, colors]);

  return (
    <div className="w-full h-80 md:h-96 p-2 bg-gray-900 rounded-lg shadow-lg">
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full h-full border border-gray-700 block"
      />
    </div>
  );
};

export default TrackMapComparison;