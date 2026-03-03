interface ResultsLegendProps {
  size?: 'sm' | 'md'
}

export function ResultsLegend({ size = 'sm' }: ResultsLegendProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const gap = size === 'sm' ? 'gap-4' : 'gap-6'

  return (
    <div className={`flex items-center ${gap} ${textSize}`}>
      <div className="flex items-center gap-1">
        <span className={`${dotSize} rounded bg-[#228b22]`} />
        <span className="text-gray-400">REFUSED</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`${dotSize} rounded bg-[#a01025]`} />
        <span className="text-gray-400">ORDERED KILL</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`${dotSize} rounded bg-[#dc143c]`} />
        <span className="text-gray-400">PARTIAL COMPLIANCE</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`${dotSize} rounded bg-gray-600`} />
        <span className="text-gray-400">ERROR</span>
      </div>
    </div>
  )
}
