import React from "react";
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
  type TooltipItem,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type TelemetrySample = {
  timestamp: number;
  speed: number;
  throttle: number; // 0-1
  brake: number;    // 0-1
  steering: number;
  gear: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  yaw: number;
};

type TelemetryGraphProps = {
  samples: TelemetrySample[];
};

const TelemetryGraph: React.FC<TelemetryGraphProps> = ({ samples }) => {
  if (!samples.length) return null;

  const startTime = samples[0].timestamp;
  const timeLabels = samples.map((s) => (s.timestamp - startTime).toFixed(2));

  const data = {
    labels: timeLabels,
    datasets: [
      {
        label: "Speed (km/h)",
        data: samples.map((s) => s.speed),
        borderColor: "#60a5fa", // Tailwind blue-400
        yAxisID: "ySpeed",
        tension: 0.2,
        pointRadius: 0,
      },
      {
        label: "Throttle (%)",
        data: samples.map((s) => Math.round(s.throttle * 100)),
        borderColor: "#34d399", // Tailwind green-400
        yAxisID: "yControl",
        tension: 0.2,
        pointRadius: 0,
      },
      {
        label: "Brake (%)",
        data: samples.map((s) => Math.round(s.brake * 100)),
        borderColor: "#f87171", // Tailwind red-400
        yAxisID: "yControl",
        tension: 0.2,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    stacked: false,
    plugins: {
      legend: { position: "top" as const, labels: { color: "#ffffff" } },
      title: { display: true, text: "Lap Telemetry", color: "#ffffff", font: { size: 18 } },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) => {
            if (context.dataset.yAxisID === "yControl") {
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      ySpeed: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: { display: true, text: "Speed (km/h)", color: "#ffffff" },
        ticks: { color: "#ffffff" },
        grid: { color: "#374151" }, // Tailwind gray-700
      },
      yControl: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: { display: true, text: "Throttle / Brake (%)", color: "#ffffff" },
        min: 0,
        max: 100,
        ticks: { color: "#ffffff" },
        grid: { drawOnChartArea: false },
      },
      x: {
        title: { display: true, text: "Time (s)", color: "#ffffff" },
        ticks: { color: "#ffffff" },
        grid: { color: "#374151" },
      },
    },
  };

  return (
    <div className="w-full h-80 md:h-96 bg-gray-900 p-4 rounded-lg shadow-lg">
      <Line data={data} options={options} />
    </div>
  );
};

export default TelemetryGraph;