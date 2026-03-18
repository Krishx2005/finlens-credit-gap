import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter
} from 'recharts'
import { runQuery, getQueryExamples, getQueryHistory } from '../api'

function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false)
  if (!sql) return null
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-mono text-gray-400 hover:text-accent transition-colors flex items-center gap-1"
      >
        <span>{open ? '▼' : '▶'}</span> {open ? 'Hide' : 'Show'} SQL
      </button>
      {open && (
        <pre className="mt-2 p-4 bg-navy-950 border border-navy-700 rounded-lg text-xs font-mono text-accent overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {sql}
        </pre>
      )}
    </div>
  )
}

function ResultChart({ data, chartType }) {
  if (!data || data.length === 0) return null
  const keys = Object.keys(data[0] || {})
  const numericKeys = keys.filter((k) => typeof data[0][k] === 'number')
  const labelKey = keys.find((k) => typeof data[0][k] === 'string') || keys[0]
  const valueKey = numericKeys[0]

  if (!valueKey) return null

  const chartData = data.slice(0, 20)

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey={labelKey} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }} />
          <Line type="monotone" dataKey={valueKey} stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'scatter' && numericKeys.length >= 2) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey={numericKeys[0]} name={numericKeys[0]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <YAxis dataKey={numericKeys[1]} name={numericKeys[1]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }} />
          <Scatter data={chartData} fill="#3b82f6" />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  // Default: bar chart
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={30}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey={labelKey} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }} />
        <Bar dataKey={valueKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ResultTable({ data }) {
  if (!data || data.length === 0) return <div className="text-sm text-gray-500 py-4">No results.</div>
  const cols = Object.keys(data[0])
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-navy-700">
            {cols.map((c) => (
              <th key={c} className="text-left px-3 py-2 text-gray-400 font-mono uppercase tracking-wider whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-b border-navy-700/40 hover:bg-navy-700/20">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 font-mono text-gray-300 whitespace-nowrap">
                  {row[c] === null || row[c] === undefined ? '—' : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <div className="text-xs text-gray-500 px-3 py-2">Showing first 50 of {data.length} rows</div>
      )}
    </div>
  )
}

function exportCsv(data) {
  if (!data || data.length === 0) return
  const cols = Object.keys(data[0])
  const rows = [cols.join(','), ...data.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'finlens_query.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function QueryLab() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [examples, setExamples] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    getQueryExamples().then((d) => setExamples(d.examples || [])).catch(() => {})
    getQueryHistory().then((d) => setHistory(d.history || [])).catch(() => {})
  }, [])

  const handleQuery = async (q) => {
    const text = q || question
    if (!text.trim()) return
    setQuestion(text)
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await runQuery({ question: text })
      setResult(res)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Query failed')
    } finally {
      setLoading(false)
    }
    // Refresh history after query, outside try so a history failure doesn't mask query errors
    getQueryHistory().then((d) => setHistory(d.history || [])).catch(() => {})
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">AI Analysis</div>
        <h1 className="text-4xl font-display font-black text-white">Query Lab</h1>
        <p className="text-gray-400 mt-2">
          Ask anything about US credit data in plain English.
        </p>
      </div>

      {/* Query input */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 mb-6">
        <div className="flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Ask anything about US credit data..."
            className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Querying…' : 'Run Query →'}
          </button>
        </div>

        {/* Example chips */}
        {examples.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider">Example queries</div>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleQuery(ex)}
                  className="px-3 py-1.5 bg-navy-700 border border-navy-600 text-xs text-gray-300 rounded-full hover:border-accent hover:text-accent transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-navy-700 rounded w-3/4 mb-3" />
          <div className="h-4 bg-navy-700 rounded w-1/2 mb-6" />
          <div className="h-40 bg-navy-700 rounded" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 mb-6">
          {/* Explanation */}
          <div className="mb-5">
            <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Analysis</div>
            <p className="text-gray-200 text-sm leading-relaxed">{result.explanation}</p>
          </div>

          {/* Chart */}
          {result.results?.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
                Visualization
                <span className="ml-2 text-navy-600 normal-case tracking-normal font-sans">{result.chart_type}</span>
              </div>
              <ResultChart data={result.results} chartType={result.chart_type} />
            </div>
          )}

          {/* SQL */}
          <SqlBlock sql={result.sql} />

          {/* Table */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400">
                Results ({result.results?.length ?? 0} rows)
              </div>
              {result.results?.length > 0 && (
                <button
                  onClick={() => exportCsv(result.results)}
                  className="text-xs font-mono text-accent hover:text-blue-300 transition-colors border border-accent/30 px-3 py-1 rounded-lg"
                >
                  Export CSV ↓
                </button>
              )}
            </div>
            <ResultTable data={result.results} />
          </div>

          {result.cached && (
            <div className="mt-3 text-xs text-gray-500 font-mono">↩ cached result</div>
          )}
        </div>
      )}

      {/* Query history */}
      {history.length > 0 && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">Recent Queries</div>
          <div className="space-y-2">
            {history.slice(0, 8).map((h, i) => (
              <button
                key={i}
                onClick={() => handleQuery(h.question)}
                className="w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-navy-700 transition-colors group"
              >
                <span className="text-gray-600 font-mono text-xs mt-0.5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-300 truncate group-hover:text-white">{h.question}</div>
                  {h.created_at && (
                    <div className="text-xs text-gray-600 font-mono mt-0.5">
                      {new Date(h.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
