import React, { useEffect, useState } from "react";
import LapComparisonGraph from "../components/LapComparisonGraph";
import type { TelemetrySample } from "../types/telemetry";
import TrackMapComparison from "../components/TrackMapComparison"; // new component

type Props = {
  lapIds: number[];
  onClose: () => void;
};

type LapTelemetry = {
  lapId: number;
  samples: TelemetrySample[];
};

const LapComparisonPage: React.FC<Props> = ({ lapIds, onClose }) => {
  const [laps, setLaps] = useState<LapTelemetry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const results = await Promise.all(
          lapIds.map(async (id) => {
            const res = await fetch(`http://127.0.0.1:8000/telemetry/${id}`);
            const data = await res.json();

            return {
              lapId: id,
              samples: data.samples || [],
            };
          })
        );

        setLaps(results);
      } catch (err) {
        console.error("Failed loading comparison data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, [lapIds]);

  if (loading) return <p>Loading lap comparison...</p>;

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Lap Comparison</h2>
      <button onClick={onClose} style={{ marginBottom: 20 }}>
        Back
      </button>

      {/* Graph comparison */}
      <LapComparisonGraph laps={laps} />

      {/* Track overlay comparison */}
      <div style={{ marginTop: 30 }}>
        <h3>Track Overlay</h3>
        <div style={{ width: 600, height: 600 }}>
          {/* Instead of multiple stacked TrackMaps, render a single comparison */}
          <TrackMapComparison laps={laps.map(l => l.samples)} />
        </div>
      </div>
    </div>
  );
};

export default LapComparisonPage;