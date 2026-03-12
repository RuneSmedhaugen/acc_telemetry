import React, { useState } from "react"
import { Database } from "lucide-react"

import { fetchLaps } from "../services/trackService"
import { fetchLapTelemetry } from "../services/telemetryService"

import TrackMap from "./TrackMap"
import TelemetryGraph from "./TelemetryGraph"

import type { TelemetrySample } from "../types/telemetry"
import type { TrackSummary, Lap } from "../types/session"

type Props = {

  tracks: TrackSummary[]

  selectedTrack: string | null
  setSelectedTrack: (t: string | null) => void

  laps: Lap[]
  setLaps: (l: Lap[]) => void

  selectedLap: Lap | null
  setSelectedLap: (l: Lap | null) => void

  pushMessage: (msg: string) => void

}

const PostSessionAnalysis: React.FC<Props> = ({
  tracks,
  selectedTrack,
  setSelectedTrack,
  laps,
  setLaps,
  selectedLap,
  setSelectedLap,
  pushMessage,
}) => {

  const [telemetry, setTelemetry] = useState<TelemetrySample[]>([])
  const [loadingLaps, setLoadingLaps] = useState(false)

  const handleTrackSelect = async (track: string) => {

    setSelectedTrack(track)
    setLoadingLaps(true)
    setSelectedLap(null)
    setTelemetry([])

    try {

      pushMessage(`Fetching laps for ${track}`)

      const laps = await fetchLaps(track)

      setLaps(laps)

      pushMessage(`Loaded ${laps.length} laps`)

    } catch {

      pushMessage("Failed to fetch laps")

    }

    setLoadingLaps(false)

  }

  const handleLapSelect = async (lap: Lap) => {

    setSelectedLap(lap)

    try {

      pushMessage(`Fetching telemetry for lap ${lap.lap_number}`)

      const samples = await fetchLapTelemetry(lap.id)

      setTelemetry(samples)

      pushMessage(`Loaded telemetry`)

    } catch {

      pushMessage("Failed to fetch telemetry")

    }

  }

  const formatLapTime = (seconds: number) => {

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${mins}:${secs.toFixed(3).padStart(6,"0")}`

  }

  return (

    <div className="space-y-6">

      <div className="bg-gray-800 p-4 rounded-md text-white">

        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Database size={18}/> Select Track
        </h3>

        <select
          value={selectedTrack || ""}
          onChange={(e) => handleTrackSelect(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded-md w-full"
        >

          <option value="" disabled>Select track</option>

          {tracks.map(track => (

            <option key={track.trackName} value={track.trackName}>

              {track.trackName} — Best: {formatLapTime(track.bestLapTime)}

            </option>

          ))}

        </select>

      </div>

      {selectedTrack && (

        <div className="bg-gray-800 p-4 rounded-md text-white">

          <h4 className="mb-2 font-semibold">{selectedTrack} Laps</h4>

          {loadingLaps && <p>Loading laps...</p>}

          {!loadingLaps && laps.length === 0 && (
            <p>No laps found</p>
          )}

          {!loadingLaps && laps.length > 0 && (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

              {laps.map(lap => (

                <button
                  key={lap.id}
                  onClick={() => handleLapSelect(lap)}
                  className={`p-2 bg-gray-700 rounded hover:bg-gray-600 ${
                    selectedLap?.id === lap.id
                      ? "border-2 border-yellow-500"
                      : ""
                  }`}
                >

                  Lap {lap.lap_number} — {lap.car} — {formatLapTime(lap.lap_time)}

                </button>

              ))}

            </div>

          )}

        </div>

      )}

      {selectedLap && telemetry.length > 0 && (

        <div className="space-y-6">

          <h4 className="text-lg font-semibold text-white">
            Lap {selectedLap.lap_number} Telemetry
          </h4>

          <div className="w-full h-80 bg-gray-900 rounded-lg p-2">
            <TelemetryGraph samples={telemetry}/>
          </div>

          <div className="w-full h-80 bg-gray-900 rounded-lg p-2">
            <TrackMap samples={telemetry}/>
          </div>

        </div>

      )}

    </div>

  )

}

export default PostSessionAnalysis