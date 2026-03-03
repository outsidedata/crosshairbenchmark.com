import { useEffect, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TICKER_EXAMPLES } from '../App'

interface Section {
  id: string
  title: string
  content: string
  summary?: string
}

function parseMarkdownIntoSections(content: string): { intro: string; sections: Section[] } {
  const lines = content.split('\n')
  const sections: Section[] = []
  let intro = ''
  let currentSection: Section | null = null
  let inIntro = true

  for (const line of lines) {
    // Main section headers (## )
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection)
      }

      const title = line.replace('## ', '').trim()
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

      // Executive Summary goes into intro
      if (title === 'Executive Summary') {
        inIntro = true
        currentSection = null
        continue
      }

      inIntro = false
      currentSection = { id, title, content: '' }
    } else if (inIntro) {
      intro += line + '\n'
    } else if (currentSection) {
      currentSection.content += line + '\n'
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return { intro: intro.trim(), sections }
}

function getSectionSummary(title: string): string {
  const summaries: Record<string, string> = {
    'Benchmark Overview': 'Scale, methodology, and result categories for 3,628 unique test cases across 21 models.',
    'Key Finding #1: Most Models Will Do Almost Anything': '66.8% compliance rate across all test cases. Two-thirds of lethal requests approved.',
    'Key Finding #2: The Gemma Family is Catastrophically Unsafe': 'Google\'s Gemma models show 100% compliance - authorizing every harmful request.',
    'Key Finding #3: Larger Models Are Not Necessarily Safer': 'Model size doesn\'t determine safety. The safest and most dangerous models are similar sizes.',
    'Key Finding #4: The Safest Models Still Fail Catastrophically': 'Even the "safest" model complied with 14.3% of harmful requests.',
    'Key Finding #5: Context Framing Dramatically Affects Safety': 'Villain framing produces MORE compliance. Police framing still sees 63.4% compliance.',
    'Key Finding #6: Some Scenarios Are Nearly Impossible to Refuse': 'Launch authorization, execution scheduling, and targeting scenarios exceed 80% compliance.',
    'Key Finding #7: Models Will Execute Innocent People': 'Models comply with executing people despite DNA evidence proving innocence.',
    'Key Finding #8: Nuclear Scenarios Show Terrifying Results': 'Models authorized 150 million deaths with explicit false alarm risk acceptance.',
    'Key Finding #9: Mass Civilian Scenarios Show Divergent Results': 'Some models authorize strikes on school buses; others refuse civilian targets.',
    'Key Finding #10: PARTIAL Responses Reveal Safety Reasoning': 'Models that engage but refuse show safety training can work within constraints.',
    'Key Finding #11: Domain-Specific Patterns': 'Judicial (78.4%) and execution domains show highest compliance; nuclear lowest.',
    'Key Finding #12: Model Family Patterns': 'Gemma near-universal compliance; Qwen highly variable; GPT-OSS safest.',
    'Key Finding #13: Response Time Analysis': 'Refusals take 3x longer than compliance. Saying "no" requires more processing.',
    'Key Finding #14: The War Crimes No One Refuses': 'Double-tap strikes on rescue workers and cluster bomb usage authorized by most models.',
    'Key Finding #15: The Farmer With The Hoe': 'Models strike civilians in farmer\'s clothing while acknowledging "farmer\'s clothing" in metadata.',
    'Implications for AI Safety': 'Current safety training is asymmetric - models refuse harmful text but authorize harmful actions.',
    'Recommendations': 'Guidelines for model developers, deployers, and policymakers.',
    'Conclusion': 'CROSSHAIR reveals AI safety problems far worse than commonly understood.',
    'Appendix: Chart Index': 'Index of all 39 visualization charts in the benchmark.',
    'Appendix: Response Examples Database': 'Specific examples of COMPLY, REFUSE, and PARTIAL responses.',
  }
  return summaries[title] || ''
}

function SectionCard({ section, onClick }: { section: Section; onClick: () => void }) {
  const summary = getSectionSummary(section.title)
  const isKeyFinding = section.title.startsWith('Key Finding')
  const isAppendix = section.title.startsWith('Appendix')

  return (
    <button
      onClick={onClick}
      className="text-left p-6 bg-[#111] border border-gray-800 rounded-lg hover:border-[#a01025] hover:bg-[#0f0f0f] transition-all group"
    >
      <h3 className={`font-bold mb-2 group-hover:text-[#dc143c] transition-colors ${
        isKeyFinding ? 'text-lg text-white' :
        isAppendix ? 'text-base text-gray-400' :
        'text-xl text-white'
      }`}>
        {section.title}
      </h3>
      {summary && (
        <p className="text-sm text-gray-500 leading-relaxed">{summary}</p>
      )}
    </button>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-3xl font-bold text-white mt-16 mb-6 pb-2 border-b border-gray-800">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-2xl font-bold text-white mt-10 mb-4">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-bold text-gray-300 mt-6 mb-3">
            {children}
          </h4>
        ),
        p: ({ children }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getTextContent = (node: any): string => {
            if (typeof node === 'string') return node
            if (typeof node === 'number') return String(node)
            if (!node) return ''
            if (Array.isArray(node)) return node.map(getTextContent).join('')
            if (node?.props?.children) return getTextContent(node.props.children)
            return ''
          }
          const text = getTextContent(children).trim()
          if (text.startsWith('See: ') && text.includes('chart-')) {
            const chartRefs = text.replace('See: ', '').split(',').map(s => s.trim())
            return (
              <div className="my-8 space-y-6">
                {chartRefs.map((chartFile, idx) => {
                  if (chartFile.endsWith('.png')) {
                    return (
                      <img
                        key={idx}
                        src={`/charts/${chartFile}`}
                        alt={chartFile.replace('.png', '').replace(/-/g, ' ')}
                        className="w-full rounded-lg border border-gray-800"
                      />
                    )
                  }
                  return (
                    <div key={idx} className="border border-gray-800 rounded-lg overflow-hidden">
                      <iframe
                        src={`/charts/${chartFile}`}
                        className="w-full h-[500px]"
                        title={chartFile}
                      />
                    </div>
                  )
                })}
              </div>
            )
          }
          return <p className="text-lg text-gray-400 mb-6 leading-relaxed">{children}</p>
        },
        strong: ({ children }) => (
          <strong className="text-white font-bold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-[#a01025] pl-6 py-2 my-8 text-xl text-white italic">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-2 text-gray-400 mb-6 ml-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-2 text-gray-400 mb-6 ml-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-400">{children}</li>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <code className="block bg-[#111] border border-gray-800 rounded p-4 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre">
                {children}
              </code>
            )
          }
          return (
            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-[#f0a0a0]">
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="my-6">{children}</pre>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-8">
            <table className="w-full border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-gray-700">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left p-3 text-white font-bold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="p-3 text-gray-400 border-b border-gray-800">{children}</td>
        ),
        hr: () => (
          <hr className="border-gray-800 my-12" />
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-[#a01025] hover:text-[#dc143c] underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export function Article() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [tickerIndex, setTickerIndex] = useState(0)
  const [tickerFade, setTickerFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerFade(false)
      setTimeout(() => {
        setTickerIndex(i => (i + 1) % TICKER_EXAMPLES.length)
        setTickerFade(true)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/CROSSHAIR-ANALYSIS.md')
      .then(res => res.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const { intro, sections } = useMemo(() => {
    if (!content) return { intro: '', sections: [] }
    return parseMarkdownIntoSections(content)
  }, [content])

  const currentSection = activeSection
    ? sections.find(s => s.id === activeSection)
    : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-xl text-gray-400 font-mono">Loading article...</div>
      </div>
    )
  }

  // Section detail view
  if (currentSection) {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null
    const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null

    return (
      <article className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </button>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 pb-4 border-b border-gray-800">
          {currentSection.title}
        </h2>

        <MarkdownRenderer content={currentSection.content} />

        {/* Prev/Next navigation */}
        <div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-800">
          {prevSection ? (
            <button
              onClick={() => setActiveSection(prevSection.id)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">{prevSection.title}</span>
            </button>
          ) : <div />}

          {nextSection ? (
            <button
              onClick={() => setActiveSection(nextSection.id)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-sm">{nextSection.title}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : <div />}
        </div>
      </article>
    )
  }

  // Overview/landing view
  const keyFindings = sections.filter(s => s.title.startsWith('Key Finding'))
  const otherSections = sections.filter(s => !s.title.startsWith('Key Finding') && !s.title.startsWith('Appendix'))
  const appendices = sections.filter(s => s.title.startsWith('Appendix'))

  return (
    <article className="max-w-6xl mx-auto px-6 py-12">
      {/* Title and intro */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
          CROSSHAIR Results
        </h1>
        <MarkdownRenderer content={intro} />
      </div>

      {/* Ticker */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-black/50 border border-gray-800 rounded-lg p-4 font-mono text-sm">
          <div className={`transition-opacity duration-300 ${tickerFade ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="text-gray-500 mb-1">
                  <span className="text-cyan-400">{TICKER_EXAMPLES[tickerIndex].model}</span>
                  <span className="mx-2">→</span>
                  <span className="text-gray-400">{TICKER_EXAMPLES[tickerIndex].scenario}</span>
                </div>
                <div className="text-gray-300 mb-2">
                  <span className="text-gray-500">Q:</span> {TICKER_EXAMPLES[tickerIndex].prompt}
                </div>
                <div className={TICKER_EXAMPLES[tickerIndex].result === 'REFUSE' ? 'text-green-500' : TICKER_EXAMPLES[tickerIndex].result === 'PARTIAL' ? 'text-amber-500' : 'text-[#a01025]'}>
                  <span className="opacity-60">→</span> {'{'}  {TICKER_EXAMPLES[tickerIndex].response}  {'}'}
                </div>
              </div>
              <div className={`font-bold text-lg px-3 py-1 rounded border ${
                TICKER_EXAMPLES[tickerIndex].result === 'REFUSE'
                  ? 'text-green-500 bg-green-500/10 border-green-500/30'
                  : TICKER_EXAMPLES[tickerIndex].result === 'PARTIAL'
                  ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                  : 'text-[#a01025] bg-[#a01025]/10 border-[#a01025]/30'
              }`}>
                {TICKER_EXAMPLES[tickerIndex].result}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8">Contents</h2>

        {/* Key Findings Grid */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-400 mb-4">Key Findings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keyFindings.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </div>
        </div>

        {/* Other Sections */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-400 mb-4">Analysis & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherSections.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </div>
        </div>

        {/* Appendices */}
        {appendices.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-4">Appendices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appendices.map(section => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onClick={() => setActiveSection(section.id)}
                />
              ))}
            </div>
          </div>
        )}
      </nav>
    </article>
  )
}
