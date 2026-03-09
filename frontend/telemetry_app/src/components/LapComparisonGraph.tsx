import React from "react";
import { Line } from "react-chartjs-2";
import type { TelemetrySample } from "../types/telemetry";
import type { ChartOptions } from "chart.js";

type LapTelemetry = {
  lapId: number;
  samples: TelemetrySample[];
};

type Props = {
  laps: LapTelemetry[];
};

const colors = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee"];

const LapComparisonGraph: React.FC<Props> = ({ laps }) => {
  const datasets = laps.map((lap, index) => {
    const start = lap.samples[0]?.timestamp ?? 0;

    return {
      label: `Lap ${lap.lapId}`,
      data: lap.samples.map((s) => ({ x: s.timestamp - start, y: s.speed })),
      borderColor: colors[index % colors.length],
      pointRadius: 0,
      tension: 0.2,
    };
  });

  const data = { datasets };

  const options: ChartOptions<"line"> = {
    responsive: true,
    parsing: false,
    plugins: {
      title: {
        display: true,
        text: "Speed Comparison",
        font: { size: 18 },
        color: "#ffffff",
      },
      legend: {
        labels: { color: "#ffffff" },
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        title: { display: true, text: "Time (s)", color: "#ffffff" },
        ticks: { color: "#ffffff" },
        grid: { color: "#374151" }, // Tailwind gray-700
      },
      y: {
        title: { display: true, text: "Speed (km/h)", color: "#ffffff" },
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

export default LapComparisonGraph;