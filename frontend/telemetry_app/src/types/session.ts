export type TrackSummary = {
  trackName: string
  bestLapTime: number
}

export type Lap = {
  id: number
  lap_number: number
  lap_time: number
  car: string
  session_date: string
}