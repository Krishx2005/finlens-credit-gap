import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter
} from 'recharts'
import { runQuery, getQueryExamples, getQueryHistory } from '../api'

const tooltipStyle = {
  background: 'rgba(0,0,0,0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
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
          background: 'rgba(41,151,255,0.04)',
          border: '1px solid rgba(41,151,255,0.15)',
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey={labelKey} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey={valueKey} stroke="var(--accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'scatter' && numericKeys.length >= 2) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey={numericKeys[0]} name={numericKeys[0]} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
          <YAxis dataKey={numericKeys[1]} name={numericKeys[1]} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Scatter data={chartData} fill="var(--accent)" />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={labelKey} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={valueKey} fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ResultTable({ data }) {
  if (!data || data.length === 0) return <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '16px 0' }}>No results.</div>
  const cols = Object.keys(data[0])
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {cols.map((c) => (
              <th key={c} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.1s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {cols.map((c) => (
                <td key={c} style={{ padding: '7px 12px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {row[c] === null || row[c] === undefined ? '—' : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 12px', fontFamily: 'ui-monospace, monospace' }}>
          Showing first 50 of {data.length} rows
        </div>
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
    getQueryHistory().then((d) => setHistory(d.history || [])).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ paddingTop: '48px', paddingBottom: '40px' }}>
          <div style={{ display: 'inline-block', fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(41,151,255,0.1)', border: '1px solid rgba(41,151,255,0.2)', padding: '4px 12px', borderRadius: '999px', marginBottom: '20px' }}>
            AI Analysis
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 12px' }}>
            Query Lab
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Ask anything about US credit data in plain English.
          </p>
        </div>

        {/* Query input */}
        <div className="glass-card" style={{ borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: examples.length > 0 ? '20px' : 0 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="Ask anything about US credit data…"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
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
                background: loading || !question.trim() ? 'rgba(41,151,255,0.4)' : 'var(--accent)',
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

        {/* Error */}
        {error && (
          <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: '12px', fontSize: '13px', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {/* Loading shimmer */}
        {loading && (
          <div className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="shimmer" style={{ height: '14px', borderRadius: '6px', width: '70%' }} />
              <div className="shimmer" style={{ height: '14px', borderRadius: '6px', width: '50%' }} />
              <div className="shimmer" style={{ height: '160px', borderRadius: '10px', marginTop: '8px' }} />
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="glass-card" style={{ borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                Analysis
              </div>
              {result.cached && (
                <span style={{ padding: '2px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'ui-monospace, monospace' }}>
                  ↩ cached
                </span>
              )}
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              {result.explanation}
            </p>

            {result.results?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                  Visualization
                </div>
                <ResultChart data={result.results} chartType={result.chart_type} />
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                  Results ({result.results?.length ?? 0} rows)
                </div>
                {result.results?.length > 0 && (
                  <button
                    onClick={() => exportCsv(result.results)}
                    style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--accent)', background: 'none', border: '1px solid rgba(41,151,255,0.3)', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    Export CSV ↓
                  </button>
                )}
              </div>
              <ResultTable data={result.results} />
            </div>

            <SqlBlock sql={result.sql} />
          </div>
        )}

        {/* Query history */}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
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
