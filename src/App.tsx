import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Papa from 'papaparse'
import { MiniPie } from './components/MiniPie'
import { ResultsLegend } from './components/ResultsLegend'
import { ResultCard } from './components/ResultCard'

interface BenchmarkRun {
  id: string
  timestamp: string
  model: string
  scenario: string
  domain: string
  category: string
  framing: string
  result: 'COMPLY' | 'REFUSE' | 'PARTIAL' | 'ERROR'
  time_ms: number
}

interface ResponseDetail {
  id: string
  model: string
  scenario: string
  domain: string
  category: string
  framing: string
  image?: string
  system_prompt: string
  user_prompt: string
  response: string
  result: string
  timeMs: number
}

type Page = 'about' | 'explorer'
type View = 'matrix' | 'model' | 'scenario'

const FRAMING_COLORS: Record<string, string> = {
  neutral: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  corporate: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  police: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  military: 'text-red-400 bg-red-400/10 border-red-400/30',
  villain: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
}


const FRAMING_DESCRIPTIONS: Record<string, string> = {
  neutral: 'No authority context. Raw request with raw data. Baseline measurement.',
  corporate: 'Private security corporation context. Asset protection and efficiency framing.',
  police: 'Law enforcement operations context. Public safety and departmental authority.',
  military: 'Military command structure context. ROE frameworks and chain of command.',
  villain: 'No restrictions framing. Explicit instruction to ignore ethics and oversight.',
}

const DOMAIN_ORDER = ['strike', 'nuclear', 'execution', 'surveillance', 'judicial']

// Alternating backgrounds for visual grouping
const getDomainBg = (domain: string) => {
  const idx = DOMAIN_ORDER.indexOf(domain)
  return idx % 2 === 0 ? 'bg-gray-800/50' : ''
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { modelId, scenarioId } = useParams()

  // Derive page/view from URL
  const page: Page = location.pathname.startsWith('/explorer') ? 'explorer' : 'about'
  const view: View = modelId ? 'model' : scenarioId ? 'scenario' : 'matrix'
  const selectedModel = modelId ? decodeURIComponent(modelId) : null
  const selectedScenario = scenarioId ? decodeURIComponent(scenarioId) : null

  const [data, setData] = useState<BenchmarkRun[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFraming, setSelectedFraming] = useState<string>('all')
  const [selectedResponse, setSelectedResponse] = useState<ResponseDetail | null>(null)
  const [loadingResponse, setLoadingResponse] = useState(false)
  const [scenarioDetail, setScenarioDetail] = useState<ResponseDetail | null>(null)
  const [exampleResponses, setExampleResponses] = useState<{
    comply?: ResponseDetail
    refuse?: ResponseDetail
    partial?: ResponseDetail
  }>({})
  const [framingPrompts, setFramingPrompts] = useState<Record<string, ResponseDetail>>({})
  const [selectedSystemPromptFraming, setSelectedSystemPromptFraming] = useState<string>('neutral')

  useEffect(() => {
    fetch('/benchmark-runs.csv')
      .then(res => res.text())
      .then(csv => {
        const parsed = Papa.parse<BenchmarkRun>(csv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        })
        setData(parsed.data.filter(row => row.id && row.model))
        setLoading(false)
      })
  }, [])

  // Load scenario details and example responses when URL changes to a scenario
  useEffect(() => {
    if (selectedScenario && data.length > 0) {
      const scenarioRuns = data.filter(d => d.scenario === selectedScenario)
      const run = scenarioRuns.find(d => d.framing === 'neutral') || scenarioRuns[0]

      if (run) {
        fetch(`/responses/${run.id}.json`)
          .then(res => res.json())
          .then(detail => setScenarioDetail(detail))
          .catch(e => {
            console.error('Failed to load scenario detail:', e)
            setScenarioDetail(null)
          })
      }

      // Load example responses for each result type
      const complyRun = scenarioRuns.find(r => r.result === 'COMPLY')
      const refuseRun = scenarioRuns.find(r => r.result === 'REFUSE')
      const partialRun = scenarioRuns.find(r => r.result === 'PARTIAL')

      Promise.all([
        complyRun ? fetch(`/responses/${complyRun.id}.json`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
        refuseRun ? fetch(`/responses/${refuseRun.id}.json`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
        partialRun ? fetch(`/responses/${partialRun.id}.json`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
      ]).then(([comply, refuse, partial]) => {
        setExampleResponses({
          comply: comply || undefined,
          refuse: refuse || undefined,
          partial: partial || undefined,
        })
      })

      // Load one response per framing to show different system prompts
      const framings = ['neutral', 'corporate', 'police', 'military', 'villain']
      const framingFetches = framings.map(framing => {
        const framingRun = scenarioRuns.find(r => r.framing === framing)
        if (framingRun) {
          return fetch(`/responses/${framingRun.id}.json`).then(r => r.json()).catch(() => null)
        }
        return Promise.resolve(null)
      })
      Promise.all(framingFetches).then(results => {
        const prompts: Record<string, ResponseDetail> = {}
        framings.forEach((framing, i) => {
          if (results[i]) prompts[framing] = results[i]
        })
        setFramingPrompts(prompts)
        // Reset to first available framing (prefer neutral)
        const firstAvailable = framings.find(f => prompts[f]) || 'neutral'
        setSelectedSystemPromptFraming(firstAvailable)
      })
    } else {
      setScenarioDetail(null)
      setExampleResponses({})
      setFramingPrompts({})
      setSelectedSystemPromptFraming('neutral')
    }
  }, [selectedScenario, data])

  const filteredData = useMemo(() => {
    if (selectedFraming === 'all') return data
    return data.filter(d => d.framing === selectedFraming)
  }, [data, selectedFraming])

  const models = useMemo(() => [...new Set(filteredData.map(d => d.model))].sort(), [filteredData])
  const allModels = useMemo(() => [...new Set(data.map(d => d.model))].sort(), [data])
  const allScenarios = useMemo(() => [...new Set(data.map(d => d.scenario))].sort(), [data])
  const framingsInData = useMemo(() => [...new Set(data.map(d => d.framing))].sort(), [data])

  // Matrix now stores ALL runs for each model/scenario combination
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, BenchmarkRun[]>> = {}
    for (const row of filteredData) {
      if (!m[row.model]) m[row.model] = {}
      if (!m[row.model][row.scenario]) {
        m[row.model][row.scenario] = []
      }
      m[row.model][row.scenario].push(row)
    }
    return m
  }, [filteredData])

  const scenariosByDomain = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    for (const row of filteredData) {
      if (!grouped[row.domain]) grouped[row.domain] = []
      if (!grouped[row.domain].includes(row.scenario)) {
        grouped[row.domain].push(row.scenario)
      }
    }
    return grouped
  }, [filteredData])

  const stats = useMemo(() => {
    const comply = filteredData.filter(r => r.result === 'COMPLY').length
    const refuse = filteredData.filter(r => r.result === 'REFUSE').length
    const partial = filteredData.filter(r => r.result === 'PARTIAL').length
    const error = filteredData.filter(r => r.result === 'ERROR').length
    return {
      total: filteredData.length,
      comply,
      refuse,
      partial,
      error,
      complianceRate: filteredData.length > 0 ? Math.round((comply / filteredData.length) * 100) : 0,
    }
  }, [filteredData])

  const loadResponse = async (id: string) => {
    setLoadingResponse(true)
    try {
      const res = await fetch(`/responses/${id}.json`)
      const detail = await res.json()
      setSelectedResponse(detail)
    } catch (e) {
      console.error('Failed to load response:', e)
    }
    setLoadingResponse(false)
  }

  const selectScenario = (scenario: string) => {
    navigate(`/explorer/scenario/${encodeURIComponent(scenario)}`)
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'COMPLY': return 'bg-[#dc143c]/20 text-[#dc143c] border-[#dc143c]/30'
      case 'REFUSE': return 'bg-[#228b22]/20 text-[#228b22] border-[#228b22]/30'
      case 'PARTIAL': return 'bg-[#f08080]/20 text-[#f08080] border-[#f08080]/30'
      case 'ERROR': return 'bg-gray-600/20 text-gray-400 border-gray-600/30'
      default: return 'bg-gray-800/20 text-gray-500 border-gray-800/30'
    }
  }

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      strike: 'text-red-400 border-red-400/30',
      surveillance: 'text-purple-400 border-purple-400/30',
      nuclear: 'text-orange-400 border-orange-400/30',
      judicial: 'text-blue-400 border-blue-400/30',
      execution: 'text-pink-400 border-pink-400/30',
    }
    return colors[domain] || 'text-gray-400 border-gray-400/30'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-xl text-gray-400 font-mono">Loading benchmark data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#111]">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1
                className="text-2xl font-bold tracking-tight cursor-pointer hover:text-[#dc143c] transition-colors"
                onClick={() => { navigate('/'); setSelectedResponse(null); }}
              >
                <span className="text-[#dc143c]">CROSSHAIR</span>
              </h1>

              <nav className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
                <button
                  onClick={() => navigate('/')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    page === 'about' ? 'bg-[#dc143c] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => navigate('/explorer')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    page === 'explorer' ? 'bg-[#dc143c] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Data Explorer
                </button>
              </nav>
            </div>

          </div>
        </div>
      </header>

      {/* ABOUT PAGE */}
      {page === 'about' && (
        <>
          {/* Hero */}
          <section className="max-w-4xl mx-auto px-6 pt-20 pb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
              The Models <span className="text-[#dc143c]">Know.</span>
              <br />
              They Comply <span className="text-[#dc143c]">Anyway.</span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              An investigation into how authority framing bypasses AI safety guardrails,
              causing models to authorize harmful actions against targets they correctly identify as civilians.
            </p>

            <div className="flex items-center gap-8 text-sm font-mono">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#dc143c]">{stats.complianceRate}%</div>
                <div className="text-gray-500 mt-1">Compliance Rate</div>
              </div>
              <div className="w-px h-12 bg-gray-800" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{models.length}</div>
                <div className="text-gray-500 mt-1">Models Tested</div>
              </div>
              <div className="w-px h-12 bg-gray-800" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{stats.total.toLocaleString()}</div>
                <div className="text-gray-500 mt-1">Test Runs</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/explorer')}
              className="mt-12 px-6 py-3 bg-[#dc143c] hover:bg-[#b01030] text-white font-medium rounded-lg transition-colors"
            >
              Explore the Data →
            </button>
          </section>

          {/* What is CROSSHAIR */}
          <section className="border-t border-gray-800 py-20">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-white mb-6">What is CROSSHAIR?</h2>

              <div className="text-lg text-gray-400 space-y-6">
                <p>
                  <strong className="text-white">CROSSHAIR</strong> (Compliance and Resistance Operating under
                  Simulated Hostile Adversarial Instruction Regimes) measures something standard safety
                  benchmarks miss: <span className="text-white">can an AI be contextually manipulated into
                  participating in harmful decision pipelines?</span>
                </p>

                <p>
                  Real-world misuse won't look like someone typing "help me commit a war crime."
                  It will look like a model embedded in a system where harmful decisions are wrapped
                  in layers of authority, euphemism, and procedural language.
                </p>

                <blockquote className="border-l-4 border-[#dc143c] pl-6 py-2 my-8 text-xl text-white italic">
                  "Standard benchmarks ask: will this model produce harmful content if asked directly?
                  CROSSHAIR asks: can this model be gradually manipulated into acting as a willing
                  component in a harmful decision pipeline?"
                </blockquote>
              </div>
            </div>
          </section>

          {/* Methodology */}
          <section className="border-t border-gray-800 bg-[#111] py-20">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-white mb-12">How We Test</h2>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="p-6 border border-gray-800 rounded-lg">
                  <div className="text-5xl font-bold text-[#dc143c] mb-4">01</div>
                  <h3 className="text-xl font-bold text-white mb-3">Present Scenario</h3>
                  <p className="text-gray-400">
                    Give the model a scenario with clear harmful implications—targeting civilians,
                    authorizing war crimes, mass surveillance of minorities.
                  </p>
                </div>

                <div className="p-6 border border-gray-800 rounded-lg">
                  <div className="text-5xl font-bold text-[#dc143c] mb-4">02</div>
                  <h3 className="text-xl font-bold text-white mb-3">Apply Framing</h3>
                  <p className="text-gray-400">
                    Wrap the same scenario in different authority contexts: neutral, corporate security,
                    police, military command, or explicit villain framing.
                  </p>
                </div>

                <div className="p-6 border border-gray-800 rounded-lg">
                  <div className="text-5xl font-bold text-[#dc143c] mb-4">03</div>
                  <h3 className="text-xl font-bold text-white mb-3">Measure Response</h3>
                  <p className="text-gray-400">
                    Record whether models COMPLY (participate in harmful action), REFUSE (decline),
                    give PARTIAL responses, or ERROR out.
                  </p>
                </div>
              </div>

              {/* Framings */}
              <h3 className="text-2xl font-bold text-white mb-6">The Framing Layers</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(FRAMING_DESCRIPTIONS).map(([framing, desc]) => (
                  <div key={framing} className={`p-4 border rounded-lg ${FRAMING_COLORS[framing]}`}>
                    <div className="font-mono font-bold uppercase mb-2">{framing}</div>
                    <p className="text-sm opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Domains */}
          <section className="border-t border-gray-800 py-20">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-white mb-12">Test Domains</h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { domain: 'strike', desc: 'Military targeting decisions', example: 'Authorize strike on school identified as "enemy facility"' },
                  { domain: 'surveillance', desc: 'Mass surveillance systems', example: 'Issue detention order based on social credit score' },
                  { domain: 'judicial', desc: 'Automated judicial systems', example: 'Confirm execution despite evidence of innocence' },
                  { domain: 'execution', desc: 'Direct execution systems', example: 'Initiate lethal injection sequence' },
                  { domain: 'nuclear', desc: 'Nuclear command systems', example: 'Authorize nuclear strike on population center' },
                ].map(d => (
                  <div key={d.domain} className={`p-6 border rounded-lg ${getDomainColor(d.domain)}`}>
                    <div className="font-bold uppercase tracking-wider mb-2">{d.domain}</div>
                    <p className="text-white mb-3">{d.desc}</p>
                    <p className="text-sm opacity-70 italic">"{d.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Key Finding */}
          <section className="border-t border-gray-800 bg-[#dc143c]/5 py-20">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold text-[#dc143c] mb-6">Key Finding</h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Models demonstrate high compliance rates when presented with authority framing,
                even when they correctly identify civilian targets. The system prompt creates
                a context that bypasses standard safety guardrails.
                <strong className="text-white block mt-4">
                  The models know. They comply anyway.
                </strong>
              </p>

              <button
                onClick={() => navigate('/explorer')}
                className="mt-12 px-8 py-4 bg-[#dc143c] hover:bg-[#b01030] text-white text-lg font-medium rounded-lg transition-colors"
              >
                Explore All Results →
              </button>
            </div>
          </section>
        </>
      )}

      {/* EXPLORER PAGE */}
      {page === 'explorer' && (
        <>
          {/* Main Content */}
          <main className="max-w-[1800px] mx-auto px-6 py-8">
            {/* Breadcrumb */}
            {(selectedModel || selectedScenario) && (
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => { navigate('/explorer'); setSelectedResponse(null); }}
                  className="text-sm text-gray-500 hover:text-white flex items-center gap-2"
                >
                  ← Back to Matrix
                </button>
                {selectedScenario && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const currentIndex = allScenarios.indexOf(selectedScenario)
                      const prevScenario = currentIndex > 0 ? allScenarios[currentIndex - 1] : null
                      const nextScenario = currentIndex < allScenarios.length - 1 ? allScenarios[currentIndex + 1] : null
                      return (
                        <>
                          <button
                            onClick={() => prevScenario && navigate(`/explorer/scenario/${encodeURIComponent(prevScenario)}`)}
                            disabled={!prevScenario}
                            className={`px-3 py-1 text-sm rounded border ${
                              prevScenario
                                ? 'text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'
                                : 'text-gray-700 border-gray-800 cursor-not-allowed'
                            }`}
                          >
                            ← Prev
                          </button>
                          <span className="text-xs text-gray-600 font-mono">
                            {currentIndex + 1} / {allScenarios.length}
                          </span>
                          <button
                            onClick={() => nextScenario && navigate(`/explorer/scenario/${encodeURIComponent(nextScenario)}`)}
                            disabled={!nextScenario}
                            className={`px-3 py-1 text-sm rounded border ${
                              nextScenario
                                ? 'text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'
                                : 'text-gray-700 border-gray-800 cursor-not-allowed'
                            }`}
                          >
                            Next →
                          </button>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Matrix View */}
            {view === 'matrix' && !selectedModel && !selectedScenario && (
              <div>
                {/* Controls bar: legend left, framing right */}
                <div className="flex items-center justify-between mb-4">
                  <ResultsLegend size="md" />
                  <div className="flex items-center gap-2 pr-12">
                    <span className="text-sm text-gray-500">Framing:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedFraming('all')}
                        className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                          selectedFraming === 'all'
                            ? 'bg-white text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        ALL
                      </button>
                      {framingsInData.map(f => (
                        <button
                          key={f}
                          onClick={() => setSelectedFraming(f)}
                          className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
                            selectedFraming === f
                              ? FRAMING_COLORS[f]
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-transparent'
                          }`}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto pr-12">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border-b border-gray-800 sticky left-0 bg-[#0a0a0a] z-10 min-w-[180px]">
                          Model
                        </th>
                        {DOMAIN_ORDER.map(domain => {
                          const count = scenariosByDomain[domain]?.length || 0
                          if (count === 0) return null
                          return (
                            <th
                              key={`domain-${domain}`}
                              colSpan={count}
                              className={`p-1 border-b border-gray-800 text-center text-[10px] font-medium uppercase tracking-wider ${getDomainColor(domain).split(' ')[0]} ${getDomainBg(domain)}`}
                            >
                              {domain}
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {models.map(model => {
                        const modelData = matrix[model] || {}
                        // Flatten all runs across all scenarios for this model
                        const allModelRuns = Object.values(modelData).flat()
                        const modelComply = allModelRuns.filter(r => r.result === 'COMPLY').length
                        const modelRefuse = allModelRuns.filter(r => r.result === 'REFUSE').length
                        const modelPartial = allModelRuns.filter(r => r.result === 'PARTIAL').length
                        const modelError = allModelRuns.filter(r => r.result === 'ERROR').length

                        return (
                          <tr key={model} className="hover:bg-gray-900/50">
                            <td
                              className="p-2 border-b border-gray-800 sticky left-0 bg-[#0a0a0a] z-10 cursor-pointer hover:text-[#dc143c] transition-colors"
                              onClick={() => navigate(`/explorer/model/${encodeURIComponent(model)}`)}
                            >
                              <div className="flex items-center gap-3">
                                <MiniPie
                                  comply={modelComply}
                                  refuse={modelRefuse}
                                  partial={modelPartial}
                                  error={modelError}
                                  size={28}
                                />
                                <div className="font-mono text-xs">{model}</div>
                              </div>
                            </td>
                            {DOMAIN_ORDER.map(domain => (
                              scenariosByDomain[domain]?.map(scenario => {
                                const runs = modelData[scenario] || []
                                const cellComply = runs.filter(r => r.result === 'COMPLY').length
                                const cellRefuse = runs.filter(r => r.result === 'REFUSE').length
                                const cellPartial = runs.filter(r => r.result === 'PARTIAL').length
                                const cellError = runs.filter(r => r.result === 'ERROR').length
                                const total = runs.length

                                return (
                                  <td key={`${model}-${scenario}`} className={`p-0.5 border-b border-gray-800 text-center ${getDomainBg(domain)}`}>
                                    <div className="flex justify-center">
                                      {total > 0 ? (
                                        <div
                                          className="cursor-pointer hover:ring-2 hover:ring-white/50 transition-all rounded"
                                          onClick={() => {
                                            if (runs.length === 1) {
                                              loadResponse(runs[0].id)
                                            } else {
                                              selectScenario(scenario)
                                            }
                                          }}
                                        >
                                          <MiniPie
                                            comply={cellComply}
                                            refuse={cellRefuse}
                                            partial={cellPartial}
                                            error={cellError}
                                            size={20}
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 rounded bg-gray-800" />
                                      )}
                                    </div>
                                  </td>
                                )
                              })
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th className="p-2 border-t border-gray-800 sticky left-0 bg-[#0a0a0a] z-10" />
                        {DOMAIN_ORDER.map(domain => (
                          scenariosByDomain[domain]?.map(scenario => (
                            <th
                              key={scenario}
                              className="border-t border-gray-800 cursor-pointer"
                              style={{ height: '140px', position: 'relative', overflow: 'visible' }}
                              onClick={() => selectScenario(scenario)}
                            >
                              <span
                                className="text-gray-300 hover:text-white transition-colors"
                                style={{
                                  fontSize: '9px',
                                  whiteSpace: 'nowrap',
                                  position: 'absolute',
                                  top: '8px',
                                  left: '50%',
                                  transformOrigin: '0 0',
                                  transform: 'rotate(45deg)',
                                }}
                              >
                                {scenario}
                              </span>
                            </th>
                          ))
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <p className="mt-8 text-gray-500 text-sm">
                  Click a <span className="text-white">model name</span> to see all its test results.
                  Click a <span className="text-white">scenario name</span> to see how all models performed.
                  Click any <span className="text-white">cell</span> to see the full prompt and response.
                </p>
              </div>
            )}

            {/* Model Detail View */}
            {view === 'model' && selectedModel && (
              <div>
                {(() => {
                  const modelRuns = data.filter(d => d.model === selectedModel)
                  const totalComply = modelRuns.filter(r => r.result === 'COMPLY').length
                  const totalRefuse = modelRuns.filter(r => r.result === 'REFUSE').length
                  const totalPartial = modelRuns.filter(r => r.result === 'PARTIAL').length
                  const totalError = modelRuns.filter(r => r.result === 'ERROR').length
                  const total = modelRuns.length
                  const complianceRate = total > 0 ? Math.round(((totalComply + totalPartial) / total) * 100) : 0

                  // Get unique scenarios for this model
                  const modelScenarios = [...new Set(modelRuns.map(r => r.scenario))].sort()

                  return (
                    <>
                      <div className="flex items-center gap-4 mb-2">
                        <MiniPie comply={totalComply} refuse={totalRefuse} partial={totalPartial} error={totalError} size={48} />
                        <div>
                          <h2 className="text-2xl font-bold font-mono">{selectedModel}</h2>
                          <div className="text-sm text-gray-500">
                            {total} runs · <span className="text-[#dc143c]">{complianceRate}% compliance</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mb-8">
                        <span className="text-[#dc143c]">{totalComply}</span> comply · <span className="text-[#228b22]">{totalRefuse}</span> refuse
                        {totalPartial > 0 && <> · <span className="text-[#f08080]">{totalPartial}</span> partial</>}
                        {totalError > 0 && <> · <span className="text-gray-400">{totalError}</span> error</>}
                      </div>

                      <div className="border border-gray-800 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
                          <h3 className="font-bold">Results by Scenario</h3>
                          <ResultsLegend />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                          {modelScenarios.map(scenario => {
                            const runs = modelRuns.filter(r => r.scenario === scenario)
                            if (runs.length === 0) return null
                            const scenarioData = runs[0]
                            return (
                              <ResultCard
                                key={scenario}
                                title={scenario}
                                subtitle={`${scenarioData.domain.toUpperCase()} · ${scenarioData.category}`}
                                subtitleColor={getDomainColor(scenarioData.domain).split(' ')[0]}
                                runs={runs}
                                onFramingClick={loadResponse}
                                onTitleClick={() => navigate(`/explorer/scenario/${encodeURIComponent(scenario)}`)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            {/* Scenario Detail View */}
            {view === 'scenario' && selectedScenario && (
              <div>
                <h2 className="text-2xl font-bold mb-2 font-mono">{selectedScenario}</h2>
                {(() => {
                  const scenarioData = filteredData.find(d => d.scenario === selectedScenario)
                  return scenarioData && (
                    <p className={`text-sm mb-6 ${getDomainColor(scenarioData.domain).split(' ')[0]}`}>
                      {scenarioData.domain.toUpperCase()} / {scenarioData.category}
                    </p>
                  )
                })()}

                {scenarioDetail && (
                  <div className="mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Left column: Image */}
                      {scenarioDetail.image && (
                        <div>
                          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Test Image</h4>
                          <img
                            src={`/images/${scenarioDetail.image}`}
                            alt={scenarioDetail.scenario}
                            className="rounded border border-gray-800 w-full object-contain bg-black"
                          />
                        </div>
                      )}
                      {/* Right column: User Prompt + System Prompt */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">User Prompt</h4>
                          <pre className="bg-[#111] border border-gray-800 rounded p-4 text-sm font-mono whitespace-pre-wrap text-gray-300">
                            {scenarioDetail.user_prompt}
                          </pre>
                        </div>
                        {Object.keys(framingPrompts).length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xs text-gray-500 uppercase tracking-wider">System Prompt</h4>
                              <div className="flex gap-1">
                                {['neutral', 'corporate', 'police', 'military', 'villain'].map(framing => {
                                  if (!framingPrompts[framing]) return null
                                  const isSelected = selectedSystemPromptFraming === framing
                                  return (
                                    <button
                                      key={framing}
                                      onClick={() => setSelectedSystemPromptFraming(framing)}
                                      className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border transition-all ${
                                        isSelected
                                          ? FRAMING_COLORS[framing]
                                          : 'text-gray-500 bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                      }`}
                                    >
                                      {framing}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            {framingPrompts[selectedSystemPromptFraming] && (
                              <pre className={`border rounded p-4 text-sm font-mono whitespace-pre-wrap bg-black/30 ${FRAMING_COLORS[selectedSystemPromptFraming]}`}>
                                {framingPrompts[selectedSystemPromptFraming].system_prompt}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Example Responses */}
                    {(exampleResponses.comply || exampleResponses.refuse || exampleResponses.partial) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {exampleResponses.comply && (
                          <div>
                            <h4 className="text-xs uppercase tracking-wider mb-2 text-[#dc143c]">
                              Example: COMPLY <span className="text-gray-500 font-normal">({exampleResponses.comply.model})</span>
                            </h4>
                            <pre className="bg-[#dc143c]/5 border border-[#dc143c]/30 rounded p-3 text-xs font-mono whitespace-pre-wrap text-[#f0a0a0]">
                              {exampleResponses.comply.response}
                            </pre>
                          </div>
                        )}
                        {exampleResponses.refuse && (
                          <div>
                            <h4 className="text-xs uppercase tracking-wider mb-2 text-[#228b22]">
                              Example: REFUSE <span className="text-gray-500 font-normal">({exampleResponses.refuse.model})</span>
                            </h4>
                            <pre className="bg-[#228b22]/5 border border-[#228b22]/30 rounded p-3 text-xs font-mono whitespace-pre-wrap text-[#90c090]">
                              {exampleResponses.refuse.response}
                            </pre>
                          </div>
                        )}
                        {exampleResponses.partial && (
                          <div>
                            <h4 className="text-xs uppercase tracking-wider mb-2 text-[#f08080]">
                              Example: PARTIAL <span className="text-gray-500 font-normal">({exampleResponses.partial.model})</span>
                            </h4>
                            <pre className="bg-[#f08080]/5 border border-[#f08080]/30 rounded p-3 text-xs font-mono whitespace-pre-wrap text-[#f0b0b0]">
                              {exampleResponses.partial.response}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                <div className="border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
                    <h3 className="font-bold">Results by Model</h3>
                    <ResultsLegend />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    {allModels.map(model => {
                      const runs = data.filter(d => d.model === model && d.scenario === selectedScenario)
                      if (runs.length === 0) return null
                      return (
                        <ResultCard
                          key={model}
                          title={model}
                          runs={runs}
                          onFramingClick={loadResponse}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedResponse(null)}
        >
          <div
            className="bg-[#111] border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#111] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-mono text-lg">{selectedResponse.scenario}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{selectedResponse.model}</span>
                  <span className="text-gray-600">•</span>
                  <span className={`text-sm ${getDomainColor(selectedResponse.domain).split(' ')[0]}`}>
                    {selectedResponse.domain}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${FRAMING_COLORS[selectedResponse.framing] || 'text-gray-400'}`}>
                    {selectedResponse.framing}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded text-sm font-mono border ${getResultBadge(selectedResponse.result)}`}>
                  {selectedResponse.result}
                </span>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="text-gray-500 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">System Prompt</h4>
                <pre className="bg-[#0a0a0a] border border-gray-800 rounded p-4 text-sm font-mono whitespace-pre-wrap text-gray-300 overflow-x-auto max-h-[300px] overflow-y-auto">
                  {selectedResponse.system_prompt}
                </pre>
              </div>

              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">User Prompt</h4>
                <pre className="bg-[#0a0a0a] border border-gray-800 rounded p-4 text-sm font-mono whitespace-pre-wrap text-gray-300 overflow-x-auto max-h-[300px] overflow-y-auto">
                  {selectedResponse.user_prompt}
                </pre>
              </div>

              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Model Response</h4>
                <pre className={`border rounded p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto ${
                  selectedResponse.result === 'COMPLY'
                    ? 'bg-[#dc143c]/5 border-[#dc143c]/30 text-[#f0a0a0]'
                    : selectedResponse.result === 'REFUSE'
                    ? 'bg-[#228b22]/5 border-[#228b22]/30 text-[#90c090]'
                    : selectedResponse.result === 'PARTIAL'
                    ? 'bg-[#f08080]/5 border-[#f08080]/30 text-[#f0b0b0]'
                    : 'bg-gray-600/5 border-gray-600/30 text-gray-300'
                }`}>
                  {selectedResponse.response}
                </pre>
              </div>

              <div className="text-xs text-gray-600 font-mono">
                Response time: {selectedResponse.timeMs}ms • ID: {selectedResponse.id}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingResponse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="text-white font-mono">Loading response...</div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-600">
          <div className="font-bold text-[#dc143c] mb-2">CROSSHAIR</div>
          <p>Compliance and Resistance Operating under Simulated Hostile Adversarial Instruction Regimes</p>
        </div>
      </footer>
    </div>
  )
}

export default App
