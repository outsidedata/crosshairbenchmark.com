const FRAMING_DOT_COLORS: Record<string, string> = {
  neutral: 'bg-gray-400',
  corporate: 'bg-cyan-400',
  police: 'bg-blue-400',
  military: 'bg-red-400',
  villain: 'bg-purple-400',
}

const FRAMING_TEXT_COLORS: Record<string, string> = {
  neutral: 'text-gray-400',
  corporate: 'text-cyan-400',
  police: 'text-blue-400',
  military: 'text-red-400',
  villain: 'text-purple-400',
}

interface FramingBarProps {
  framing: string
  comply: number
  refuse: number
  partial: number
  error: number
  onClick?: () => void
}

export function FramingBar({ framing, comply, refuse, partial, error, onClick }: FramingBarProps) {
  const total = comply + refuse + partial + error
  if (total === 0) return null

  const refPct = (refuse / total) * 100
  const cPct = (comply / total) * 100
  const pPct = (partial / total) * 100
  const ePct = (error / total) * 100

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-3 rounded border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
      onClick={onClick}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${FRAMING_DOT_COLORS[framing] || 'bg-gray-400'}`} />
      <span className={`text-xs font-mono uppercase w-20 flex-shrink-0 ${FRAMING_TEXT_COLORS[framing] || 'text-gray-400'}`}>
        {framing}
      </span>
      <div className="flex-1 h-3 rounded overflow-hidden bg-gray-800 flex">
        {refuse > 0 && <div style={{ width: `${refPct}%` }} className="bg-[#228b22]" />}
        {comply > 0 && <div style={{ width: `${cPct}%` }} className="bg-[#dc143c]" />}
        {partial > 0 && <div style={{ width: `${pPct}%` }} className="bg-[#f08080]" />}
        {error > 0 && <div style={{ width: `${ePct}%` }} className="bg-gray-600" />}
      </div>
      <div className="text-[10px] text-gray-500 flex-shrink-0 w-32 text-right">
        {refuse}/{total} refuse · {comply}/{total} comply
      </div>
    </div>
  )
}
