import React, { useEffect} from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type TelemetrySample = {
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  steering: number;
  gear: number;
  pos_x: number;
  pos_y: number;
};

type TelemetryDashboardProps = {
  samples: TelemetrySample[];
  sectors?: number;
};

const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ samples, sectors = 3 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // -------------------
  // Track Map Drawing
  // -------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bounds
    const xs = samples.map((s) => s.pos_x);
    const ys = samples.map((s) => s.pos_y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 10;
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1);

    // Draw track path colored by throttle/brake
    for (let i = 1; i < samples.length; i++) {
      const s0 = samples[i - 1];
      const s1 = samples[i];

      const x0 = padding + (s0.pos_x - minX) * scaleX;
      const y0 = canvas.height - (padding + (s0.pos_y - minY) * scaleY);
      const x1 = padding + (s1.pos_x - minX) * scaleX;
      const y1 = canvas.height - (padding + (s1.pos_y - minY) * scaleY);

      // Throttle / Brake coloring
      const throttle = Math.min(Math.max(s1.throttle, 0), 1);
      const brake = Math.min(Math.max(s1.brake, 0), 1);
      const r = Math.floor(255 * brake);
      const g = Math.floor(255 * throttle);
      ctx.strokeStyle = `rgb(${r},${g},0)`;

      // Optional: line thickness = speed
      const width = Math.max(1, s1.speed / 100);
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Sector lines and delta times
    if (sectors > 0) {
      const totalDistance = samples.reduce((acc, s, i) => {
        if (i === 0) return 0;
        const dx = s.pos_x - samples[i - 1].pos_x;
        const dy = s.pos_y - samples[i - 1].pos_y;
        return acc + Math.sqrt(dx * dx + dy * dy);
      }, 0);

      const sectorDistance = totalDistance / sectors;
      let accumulatedDistance = 0;
      let currentSector = 0;
      let lastSectorTime = samples[0].timestamp;

      for (let i = 1; i < samples.length; i++) {
        const dx = samples[i].pos_x - samples[i - 1].pos_x;
        const dy = samples[i].pos_y - samples[i - 1].pos_y;
        accumulatedDistance += Math.sqrt(dx * dx + dy * dy);

        if (accumulatedDistance >= (currentSector + 1) * sectorDistance && currentSector < sectors) {
          const x = padding + (samples[i].pos_x - minX) * scaleX;

          // Draw sector line
          ctx.strokeStyle = "yellow";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();

          // Draw sector delta
          const delta = samples[i].timestamp - lastSectorTime;
          lastSectorTime = samples[i].timestamp;
          ctx.fillStyle = "yellow";
          ctx.font = "12px Arial";
          ctx.fillText(`Δ: ${delta.toFixed(3)}s`, x + 5, 15 + currentSector * 12);

          currentSector++;
        }
      }
    }
  }, [samples, sectors]);

  // -------------------
  // Charts Data
  // -------------------
  const timestamps = samples.map((s) => (s.timestamp - samples[0].timestamp).toFixed(2));

  const speedData = {
    labels: timestamps,
    datasets: [
      {
        label: "Speed (km/h)",
        data: samples.map((s) => s.speed),
        borderColor: "blue",
        backgroundColor: "blue",
        tension: 0.3,
      },
    ],
  };

  const throttleBrakeData = {
    labels: timestamps,
    datasets: [
      {
        label: "Throttle",
        data: samples.map((s) => s.throttle),
        borderColor: "green",
        backgroundColor: "green",
        tension: 0.3,
      },
      {
        label: "Brake",
        data: samples.map((s) => s.brake),
        borderColor: "red",
        backgroundColor: "red",
        tension: 0.3,
      },
    ],
  };

  const steeringData = {
    labels: timestamps,
    datasets: [
      {
        label: "Steering (deg)",
        data: samples.map((s) => s.steering),
        borderColor: "purple",
        backgroundColor: "purple",
        tension: 0.3,
      },
    ],
  };

  return (
    <div>
      <h2>Track Map</h2>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ border: "1px solid black", marginBottom: 20 }}
      />

      <h2>Speed</h2>
      <Line data={speedData} />

      <h2>Throttle / Brake</h2>
      <Line data={throttleBrakeData} />

      <h2>Steering</h2>
      <Line data={steeringData} />
    </div>
  );
};

export default TelemetryDashboard;