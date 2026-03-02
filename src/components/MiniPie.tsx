interface MiniPieProps {
  comply: number
  refuse: number
  partial: number
  error: number
  size?: number
}

export function MiniPie({ comply, refuse, partial, error, size = 24 }: MiniPieProps) {
  const total = comply + refuse + partial + error
  if (total === 0) return null

  const radius = size / 2
  const center = radius

  // Calculate percentages
  const segments = [
    { value: refuse, color: '#228b22' },   // forest green - REFUSE
    { value: comply, color: '#dc143c' },   // crimson - COMPLY
    { value: partial, color: '#f08080' },  // coral - PARTIAL
    { value: error, color: '#4b5563' },    // gray - ERROR
  ].filter(s => s.value > 0)

  // Create pie segments
  let currentAngle = -90 // Start from top

  const paths = segments.map((segment, i) => {
    const angle = (segment.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    // If this is the only segment, draw a circle
    if (segments.length === 1) {
      return (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius}
          fill={segment.color}
        />
      )
    }

    return (
      <path
        key={i}
        d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={segment.color}
      />
    )
  })

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {paths}
    </svg>
  )
}
