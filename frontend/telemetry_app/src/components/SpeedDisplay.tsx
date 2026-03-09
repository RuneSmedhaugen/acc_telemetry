type Props = {
  speed: number
}

export default function SpeedDisplay({ speed }: Props) {

  return (
    <div
      style={{
        fontSize: 80,
        fontWeight: "bold"
      }}
    >
      {Math.round(speed)} km/h
    </div>
  )
}