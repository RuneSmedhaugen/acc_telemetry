import React from "react";
import type { TelemetrySample } from "../types/telemetry";

type TrackMapProps = {
  samples: TelemetrySample[];
};

const TrackMap: React.FC<TrackMapProps> = ({ samples }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [hovered, setHovered] = React.useState<{
    sample: TelemetrySample;
    x: number;
    y: number;
  } | null>(null);

  const pointsRef = React.useRef<
    { x: number; y: number; sample: TelemetrySample }[]
  >([]);

  const boundsRef = React.useRef({
    width: 1,
    height: 1,
    containerW: 1,
    containerH: 1,
  });

  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });

  const isPanning = React.useRef(false);
  const lastMouse = React.useRef({ x: 0, y: 0 });

  const clampPan = React.useCallback(
    (p: { x: number; y: number }) => {
      const { width, height, containerW, containerH } = boundsRef.current;
      return {
        x: Math.min(0, Math.max(containerW - width, p.x)),
        y: Math.min(0, Math.max(containerH - height, p.y)),
      };
    },
    []
  );

  // Draw the track
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || samples.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const xs = samples.map((s) => s.pos_x);
    const zs = samples.map((s) => s.pos_z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const padding = 30;
    const trackWidth = Math.max(1, maxX - minX);
    const trackHeight = Math.max(1, maxZ - minZ);

    const baseScale = Math.min(
      (width - 2 * padding) / trackWidth,
      (height - 2 * padding) / trackHeight
    );

    const offsetX = (width - trackWidth * baseScale) / 2;
    const offsetY = (height - trackHeight * baseScale) / 2;

    const trackPixelWidth = trackWidth * baseScale * zoom;
    const trackPixelHeight = trackHeight * baseScale * zoom;

    boundsRef.current = {
      width: trackPixelWidth,
      height: trackPixelHeight,
      containerW: width,
      containerH: height,
    };

    const toCanvas = (x: number, z: number) => ({
      x: offsetX + (x - minX) * baseScale * zoom + pan.x,
      y: offsetY + (z - minZ) * baseScale * zoom + pan.y,
    });

    pointsRef.current = [];

    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];

      const p0 = toCanvas(prev.pos_x, prev.pos_z);
      const p1 = toCanvas(curr.pos_x, curr.pos_z);

      pointsRef.current.push({ x: p1.x, y: p1.y, sample: curr });

      const throttle = Math.min(Math.max(curr.throttle, 0), 1);
      const brake = Math.min(Math.max(curr.brake, 0), 1);

      ctx.strokeStyle = `rgb(${Math.floor(255 * brake)},${Math.floor(
        255 * throttle
      )},0)`;
      ctx.lineWidth = Math.max(1.5, curr.speed / 120);

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }, [samples, zoom, pan]);

  // Zoom handling
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = 1.1;

      const newZoom = e.deltaY < 0 ? Math.min(zoom * factor, 50) : Math.max(zoom / factor, 0.2);
      const ratio = newZoom / zoom;
      const newPan = clampPan({
        x: mouseX - (mouseX - pan.x) * ratio,
        y: mouseY - (mouseY - pan.y) * ratio,
      });

      setZoom(newZoom);
      setPan(newPan);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoom, pan, clampPan]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleMouseUp = () => (isPanning.current = false);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest: { x: number; y: number; sample: TelemetrySample } | null = null;
    let minDist = Infinity;
    for (const p of pointsRef.current) {
      const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (d < minDist) {
        minDist = d;
        closest = p;
      }
    }
    setHovered(closest);
  };

  const handleDoubleClick = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full border border-gray-700 bg-gray-900 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full block cursor-crosshair"
      />

      {hovered && (
        <div
          className="absolute w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
          style={{ left: hovered.x, top: hovered.y }}
        />
      )}

      {hovered && (
        <div className="absolute top-2 left-2 bg-gray-950 p-2 rounded-md text-white text-sm">
          <div>Speed: {hovered.sample.speed.toFixed(1)} km/h</div>
          <div>Throttle: {Math.round(hovered.sample.throttle * 100)}%</div>
          <div>Brake: {Math.round(hovered.sample.brake * 100)}%</div>
          <div>Gear: {hovered.sample.gear}</div>
        </div>
      )}
    </div>
  );
};

export default TrackMap;