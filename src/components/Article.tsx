import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Article() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/CROSSHAIR-ANALYSIS.md')
      .then(res => res.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-xl text-gray-400 font-mono">Loading article...</div>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
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
            // Check if this paragraph contains only a chart reference
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
            // Support both PNG images and HTML iframes
            // Match "See: " followed by any path containing "chart-"
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
    </article>
  )
}
