import { useEffect, useState } from "react"
import type { TelemetrySample } from "../types/telemetry"

import SpeedDisplay from "../components/SpeedDisplay"
import PedalBars from "../components/PedalBars"
import GearDisplay from "../components/GearDisplay"

export default function LivePage() {

  const [data, setData] = useState<TelemetrySample | null>(null)

  useEffect(() => {

    const ws = new WebSocket("ws://localhost:8000/ws/live")

    ws.onmessage = (event) => {
      const sample: TelemetrySample = JSON.parse(event.data)
      setData(sample)
    }

    return () => ws.close()

  }, [])

  if (!data) {
    return <div>Waiting for telemetry...</div>
  }

  return (
    <div style={{ padding: 40 }}>

      <h1>Live Telemetry</h1>

      <SpeedDisplay speed={data.speed} />

      <GearDisplay gear={data.gear} />

      <PedalBars
        throttle={data.throttle}
        brake={data.brake}
      />

    </div>
  )
}