import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, Legend
} from 'recharts'
import { runQuery, getQueryExamples, getQueryHistory } from '../api'

const tooltipStyle = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: '10px',
  backdropFilter: 'blur(20px)',
  fontSize: '12px',
  color: 'var(--text-primary)',
}

function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false)
  if (!sql) return null
  return (
    <div style={{ marginTop: '16px' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >
        <span>{open ? '▼' : '▶'}</span> {open ? 'Hide' : 'Show'} SQL
      </button>
      {open && (
        <pre style={{
          marginTop: '10px',
          padding: '16px',
          background: 'rgba(0,113,227,0.03)',
          border: '1px solid rgba(0,113,227,0.12)',
          borderRadius: '12px',
          fontSize: '12px',
          fontFamily: 'ui-monospace, monospace',
          color: 'var(--accent)',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
        }}>
          {sql}
        </pre>
      )}
    </div>
  )
}

const BAR_COLORS = ['var(--accent)', 'var(--positive)', 'var(--warning)', 'var(--danger)', '#8b5cf6']
const DATE_KEYS = ['date', 'month', 'year', 'week', 'period', 'time', 'quarter']

function isNumeric(val) {
  if (typeof val === 'number') return true
  if (typeof val === 'string') return val.trim() !== '' && !isNaN(Number(val))
  return false
}

function coerceNumeric(data) {
  if (!data || data.length === 0) return data
  const keys = Object.keys(data[0])
  const numericKeys = keys.filter((k) => isNumeric(data[0][k]))
  if (numericKeys.length === 0) return data
  return data.map((row) => {
    const next = { ...row }
    numericKeys.forEach((k) => { next[k] = Number(next[k]) })
    return next
  })
}

function ResultChart({ data }) {
  if (!data || data.length === 0) return null

  const coerced = coerceNumeric(data)
  const keys = Object.keys(coerced[0])
  const numericKeys = keys.filter((k) => typeof coerced[0][k] === 'number')
  const stringKeys = keys.filter((k) => typeof coerced[0][k] === 'string')

  if (numericKeys.length === 0) {
    return (
      <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'ui-monospace, monospace' }}>
        No numeric columns — chart unavailable for this result set.
      </div>
    )
  }

  const xKey = stringKeys[0] || keys[0]
  const chartData = coerced.slice(0, 20)
  const axisProps = {
    tick: { fill: 'var(--text-tertiary)', fontSize: 10 },
    axisLine: false,
    tickLine: false,
  }

  const isDateAxis = DATE_KEYS.some((d) => xKey.toLowerCase().includes(d))
  const isMultiMetric = numericKeys.length >= 3

  if (isDateAxis || isMultiMetric) {
    if (isDateAxis) {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            {numericKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={BAR_COLORS[i % BAR_COLORS.length]} strokeWidth={2} dot={false} />
            ))}
            {numericKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          </LineChart>
        </ResponsiveContainer>
      )
    }
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {numericKeys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={numericKeys[0]} fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ResultTable({ data }) {
  if (!data || data.length === 0) return <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '16px 0' }}>No results.</div>
  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            {Object.keys(data[0]).map((key) => (
              <th key={key} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6e6e73', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {key.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 100).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)' }}>
              {Object.values(row).map((val, j) => (
                <td key={j} style={{ padding: '8px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {val === null || val === undefined
                    ? '—'
                    : typeof val === 'number'
                      ? val % 1 === 0 ? val.toLocaleString() : val.toFixed(4)
                      : String(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && (
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 12px', fontFamily: 'ui-monospace, monospace' }}>
          Showing first 100 of {data.length} rows
        </div>
      )}
    </div>
  )
}

function SimpleBarChart({ data }) {
  const chartData = coerceNumeric(data.slice(0, 15))
  const keys = Object.keys(chartData[0])
  const xKey = keys[0]
  const yKey = keys.find((k) => typeof chartData[0][k] === 'number') || keys[1]
  console.log('Chart keys — x:', xKey, 'y:', yKey, 'sample row:', chartData[0])
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
        Visualization
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey={yKey} fill="#0071e3" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
  const [results, setResults] = useState([])
  const [sql, setSql] = useState('')
  const [explanation, setExplanation] = useState('')
  const [chartType, setChartType] = useState('bar')
  const [cached, setCached] = useState(false)
  const [hasResult, setHasResult] = useState(false)
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
    setHasResult(false)
    setResults([])
    setSql('')
    setExplanation('')
    setLoading(true)
    try {
      const res = await runQuery({ question: text })
      console.log('API response:', res)
      console.log('results array:', res.results)
      console.log('results length:', res.results?.length)
      setResults(res.results || [])
      setSql(res.sql || '')
      setExplanation(res.explanation || '')
      setChartType(res.chart_type || 'bar')
      setCached(res.cached || false)
      setHasResult(true)
    } catch (err) {
      console.error('Query error:', err)
      setError(err.response?.data?.detail || err.message || 'Query failed')
    } finally {
      setLoading(false)
    }
    getQueryHistory().then((d) => setHistory(d.history || [])).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>

        <div style={{ paddingTop: '48px', paddingBottom: '40px' }}>
          <div style={{ display: 'inline-block', fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.15)', padding: '4px 12px', borderRadius: '999px', marginBottom: '20px' }}>
            AI Analysis
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 12px' }}>
            Query Lab
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Ask anything about US credit data in plain English.
          </p>
        </div>

        <div className="glass-card" style={{ borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: examples.length > 0 ? '20px' : 0 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="Ask anything about US credit data…"
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.16)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleQuery()}
              disabled={loading || !question.trim()}
              style={{
                padding: '12px 24px',
                background: loading || !question.trim() ? 'rgba(0,113,227,0.4)' : 'var(--accent)',
                color: '#fff',
                fontWeight: 500,
                fontSize: '14px',
                border: 'none',
                borderRadius: '12px',
                cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? 'Querying…' : 'Run Query →'}
            </button>
          </div>

          {examples.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                Example queries
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {examples.map((ex) => (
                  <button
                    key={ex.id ?? ex.question}
                    onClick={() => handleQuery(ex.question)}
                    className="pill-btn"
                  >
                    {ex.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '12px', fontSize: '13px', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="shimmer" style={{ height: '14px', borderRadius: '6px', width: '70%' }} />
              <div className="shimmer" style={{ height: '14px', borderRadius: '6px', width: '50%' }} />
              <div className="shimmer" style={{ height: '160px', borderRadius: '10px', marginTop: '8px' }} />
            </div>
          </div>
        )}

        {hasResult && !loading && (
          <div className="glass-card" style={{ borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                Analysis
              </div>
              {cached && (
                <span style={{ padding: '2px 10px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '999px', fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'ui-monospace, monospace' }}>
                  ↩ cached
                </span>
              )}
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              {explanation}
            </p>

            {results.length > 0 && <SimpleBarChart data={results} />}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                  Results ({results.length} rows)
                </div>
                {results.length > 0 && (
                  <button
                    onClick={() => exportCsv(results)}
                    style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--accent)', background: 'none', border: '1px solid rgba(0,113,227,0.25)', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    Export CSV ↓
                  </button>
                )}
              </div>
              <ResultTable data={results} />
            </div>

            <SqlBlock sql={sql} />
          </div>
        )}

        {history.length > 0 && (
          <div className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              Recent Queries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {history.slice(0, 8).map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleQuery(h.question)}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-tertiary)', marginTop: '2px', minWidth: '24px' }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.question}
                    </div>
                    {h.created_at && (
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'ui-monospace, monospace', marginTop: '2px' }}>
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
    </div>
  )
}
