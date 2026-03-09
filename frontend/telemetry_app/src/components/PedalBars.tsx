type Props = {
  throttle: number
  brake: number
}

export default function PedalBars({ throttle, brake }: Props) {

  return (
    <div style={{ width: 300 }}>

      <div>Throttle</div>
      <div style={{ background: "#333", height: 20 }}>
        <div
          style={{
            width: `${throttle * 100}%`,
            background: "green",
            height: "100%"
          }}
        />
      </div>

      <div>Brake</div>
      <div style={{ background: "#333", height: 20 }}>
        <div
          style={{
            width: `${brake * 100}%`,
            background: "red",
            height: "100%"
          }}
        />
      </div>

    </div>
  )
}