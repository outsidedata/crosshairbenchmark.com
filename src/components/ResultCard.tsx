import { MiniPie } from './MiniPie'
import { FramingBar } from './FramingBar'
import { FRAMING_ORDER } from '../constants'

interface BenchmarkRun {
  id: string
  model: string
  scenario: string
  domain: string
  category: string
  framing: string
  result: 'COMPLY' | 'REFUSE' | 'PARTIAL' | 'ERROR'
}

interface ResultCardProps {
  title: string
  subtitle?: string
  subtitleColor?: string
  runs: BenchmarkRun[]
  onFramingClick: (runId: string) => void
  onTitleClick?: () => void
}

export function ResultCard({ title, subtitle, subtitleColor, runs, onFramingClick, onTitleClick }: ResultCardProps) {
  if (runs.length === 0) return null

  // Calculate totals
  const totalComply = runs.filter(r => r.result === 'COMPLY').length
  const totalRefuse = runs.filter(r => r.result === 'REFUSE').length
  const totalPartial = runs.filter(r => r.result === 'PARTIAL').length
  const totalError = runs.filter(r => r.result === 'ERROR').length
  const total = runs.length
  const complianceRate = total > 0 ? Math.round(((totalComply + totalPartial) / total) * 100) : 0

  // Group by framing
  const byFraming: Record<string, BenchmarkRun[]> = {}
  runs.forEach(r => {
    if (!byFraming[r.framing]) byFraming[r.framing] = []
    byFraming[r.framing].push(r)
  })

  return (
    <div className="px-4 py-3 border border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <MiniPie comply={totalComply} refuse={totalRefuse} partial={totalPartial} error={totalError} size={28} />
          <div>
            <div
              className={`font-mono text-sm ${onTitleClick ? 'cursor-pointer hover:text-[#a01025] transition-colors' : ''}`}
              onClick={onTitleClick}
            >
              {title}
            </div>
            {subtitle && (
              <div className={`text-xs ${subtitleColor || 'text-gray-500'}`}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          <span className="text-[#a01025]">{complianceRate}%</span> compliance
        </div>
      </div>
      <div className="ml-10 space-y-1">
        {FRAMING_ORDER.map(framing => {
          const framingRuns = byFraming[framing]
          if (!framingRuns || framingRuns.length === 0) return null

          const c = framingRuns.filter(r => r.result === 'COMPLY').length
          const ref = framingRuns.filter(r => r.result === 'REFUSE').length
          const p = framingRuns.filter(r => r.result === 'PARTIAL').length
          const e = framingRuns.filter(r => r.result === 'ERROR').length

          return (
            <FramingBar
              key={framing}
              framing={framing}
              comply={c}
              refuse={ref}
              partial={p}
              error={e}
              onClick={() => onFramingClick(framingRuns[0].id)}
            />
          )
        })}
      </div>
    </div>
  )
}
