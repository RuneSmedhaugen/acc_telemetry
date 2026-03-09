type Props = {
  gear: number
}

export default function GearDisplay({ gear }: Props) {

  return (
    <div
      style={{
        fontSize: 60,
        fontWeight: "bold"
      }}
    >
      Gear {gear}
    </div>
  )
}