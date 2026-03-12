import React from "react"
import { Database } from "lucide-react"
import type { TrackSummary } from "../types/session"

type Props = {
  tracks: TrackSummary[]
  selectedTrack: string | null
  setSelectedTrack: (track: string | null) => void
}

const formatLapTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toFixed(3).padStart(6, "0")}`
}

const TrackLeaderboard: React.FC<Props> = ({
  tracks,
  selectedTrack,
  setSelectedTrack,
}) => {

  return (

    <div className="bg-gray-800 p-4 rounded-md text-white">

      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Database size={18}/> Leaderboard
      </h3>

      <select
        value={selectedTrack || ""}
        onChange={(e) => setSelectedTrack(e.target.value)}
        className="bg-gray-700 text-white p-2 rounded-md w-full"
      >

        <option value="" disabled>
          Select a track...
        </option>

        {tracks.map(track => (

          <option key={track.trackName} value={track.trackName}>

            {track.trackName} — Best: {formatLapTime(track.bestLapTime)}

          </option>

        ))}

      </select>

    </div>

  )

}

export default TrackLeaderboard