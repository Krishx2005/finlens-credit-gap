import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Treemap, Cell
} from 'recharts'
import { getComplaints, getComplaintSummary } from '../api'

const PRODUCTS = ['All', 'Mortgage', 'Credit card', 'Student loan', 'Debt collection', 'Credit reporting', 'Personal loan', 'Bank account']
const STATES = ['All', 'CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']

const TREEMAP_COLORS = ['#0071e3', '#1d8348', '#b7950b', '#c0392b', '#bf5af2', '#32d2ff', '#ff6961', '#adf7b6']

const tooltipStyle = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: '10px',
  backdropFilter: 'blur(20px)',
  fontSize: '12px',
  color: 'var(--text-primary)',
}

function CustomTreemapContent({ root, depth, x, y, width, height, index, name, value }) {
  if (width < 30 || height < 20) return null
  return (
    <g>
      <rect
        x={x + 1} y={y + 1} width={width - 2} height={height - 2}
        style={{ fill: TREEMAP_COLORS[index % TREEMAP_COLORS.length], stroke: 'rgba(0,0,0,0.08)', strokeWidth: 2, opacity: 0.85 }}
        rx={6}
      />
      {width > 60 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={11} fontFamily="Inter, sans-serif">
          {name?.length > 14 ? name.slice(0, 14) + '…' : name}
        </text>
      )}
      {width > 60 && height > 45 && (
        <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>
          {value?.toLocaleString()}
        </text>
      )}
    </g>
  )
}

function KpiCard({ label, value, color }) {
  return (
    <div
      className="glass-card"
      style={{ borderRadius: '16px', padding: '20px' }}
    >
      <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: color || 'var(--text-primary)' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{subtitle}</div>
      </div>
      {children}
    </div>
  )
}

const selectStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: '8px',
  padding: '7px 12px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
}

export default function ComplaintExplorer() {
  const [showAllIssues, setShowAllIssues] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryError, setSummaryError] = useState('')
  const [complaints, setComplaints] = useState([])
  const [listError, setListError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ product: 'All', state: 'All', company: '' })
  const [companyInput, setCompanyInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    getComplaintSummary()
      .then(setSummary)
      .catch((err) => setSummaryError(err.message || 'Failed to load summary'))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, company: companyInput }))
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [companyInput])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setListError('')
    const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }
    if (filters.product !== 'All') params.product = filters.product
    if (filters.state !== 'All') params.state = filters.state
    if (filters.company) params.company = filters.company

    const timeout = setTimeout(() => {
      if (!controller.signal.aborted) {
        setListError('Request timed out. Is the backend running?')
        setLoading(false)
      }
    }, 5000)

    getComplaints(params, controller.signal)
      .then((d) => {
        clearTimeout(timeout)
        setComplaints(d.complaints || [])
        setTotal(d.total || 0)
        setLoading(false)
      })
      .catch((err) => {
        clearTimeout(timeout)
        if (err.name === 'AbortError' || err.message?.includes('canceled')) return
        setListError(err.message || 'Failed to load complaints')
        setLoading(false)
      })
    return () => { controller.abort(); clearTimeout(timeout) }
  }, [filters, page])

  const topCompanies = summary?.by_company?.slice(0, 10).map((c) => ({
    name: c.company?.length > 20 ? c.company.slice(0, 20) + '…' : c.company,
    complaints: c.count,
  })) || []

  const monthlyTrend = summary?.monthly_trend?.slice(-12) || []

  const allIssues = summary?.by_issue || []
  const issueTreemap = allIssues.slice(0, 8).map((item) => ({ name: item.issue, size: item.count, value: item.count }))
  const legendIssues = showAllIssues ? allIssues : allIssues.slice(0, 6)

  const stateData = summary?.by_state?.slice(0, 12).map((s) => ({ name: s.state, count: s.count })) || []

  const emptyChart = (msg) => (
    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
      {msg}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        <div style={{ paddingTop: '48px', paddingBottom: '40px' }}>
          <div style={{ display: 'inline-block', fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.15)', padding: '4px 12px', borderRadius: '999px', marginBottom: '20px' }}>
            CFPB Data
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 12px' }}>
            Complaint Explorer
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.6 }}>
            Consumer financial complaints by product, company, and geography.
          </p>
        </div>

        {summaryError && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(183,149,11,0.08)', border: '1px solid rgba(183,149,11,0.2)', borderRadius: '12px', fontSize: '13px', color: 'var(--warning)' }}>
            Summary unavailable: {summaryError}
          </div>
        )}

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <KpiCard label="Total Complaints" value={summary.total_complaints?.toLocaleString()} />
            <KpiCard label="Dispute Rate" value={`${(summary.dispute_rate * 100).toFixed(1)}%`} color="var(--warning)" />
            <KpiCard label="Timely Response" value={`${(summary.timely_response_rate * 100).toFixed(1)}%`} color="var(--positive)" />
            <KpiCard label="Avg / Month" value={Math.round(summary.avg_monthly)?.toLocaleString()} color="var(--accent)" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <ChartCard title="Top 10 Companies by Volume" subtitle="Largest complaint recipients">
            {topCompanies.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topCompanies} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v.toLocaleString(), 'Complaints']} />
                  <Bar dataKey="complaints" radius={[0, 4, 4, 0]} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            ) : emptyChart(summaryError ? 'No data' : 'Loading…')}
          </ChartCard>

          <ChartCard title="Complaint Volume Trend" subtitle="Monthly complaint count (last 12 months)">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v.toLocaleString(), 'Complaints']} />
                  <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : emptyChart(summaryError ? 'No data' : 'Loading…')}
          </ChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <ChartCard title="Issues by Category" subtitle="Size = complaint volume">
            {issueTreemap.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <Treemap data={issueTreemap} dataKey="size" content={<CustomTreemapContent />} />
                </ResponsiveContainer>
                <div style={{ marginTop: '16px', maxHeight: '160px', overflowY: 'auto' }}>
                  {legendIssues.map((item, i) => (
                    <div key={item.issue} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', flexShrink: 0, background: TREEMAP_COLORS[i % TREEMAP_COLORS.length] }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.issue}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-tertiary)', marginLeft: '12px', flexShrink: 0 }}>
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {allIssues.length > 6 && (
                    <button
                      onClick={() => setShowAllIssues((v) => !v)}
                      style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}
                    >
                      {showAllIssues ? 'Show less ↑' : `Show all ${allIssues.length} categories ↓`}
                    </button>
                  )}
                </div>
              </>
            ) : emptyChart(summaryError ? 'No data' : 'Loading…')}
          </ChartCard>

          <ChartCard title="Complaint Rate by State" subtitle="Top 12 states by complaint volume">
            {stateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stateData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v.toLocaleString(), 'Complaints']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stateData.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? 'var(--danger)' : i < 6 ? 'var(--warning)' : 'var(--accent)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : emptyChart(summaryError ? 'No data' : 'Loading…')}
          </ChartCard>
        </div>

        <div
          className="glass-card"
          style={{ borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}
        >
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Product</div>
            <select value={filters.product} onChange={(e) => { setFilters({ ...filters, product: e.target.value }); setPage(1) }} style={selectStyle}>
              {PRODUCTS.map((p) => <option key={p} value={p} style={{ background: '#ffffff' }}>{p}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>State</div>
            <select value={filters.state} onChange={(e) => { setFilters({ ...filters, state: e.target.value }); setPage(1) }} style={selectStyle}>
              {STATES.map((s) => <option key={s} value={s} style={{ background: '#ffffff' }}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Company</div>
            <input
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="Filter company…"
              style={{ ...selectStyle, width: '160px' }}
            />
          </div>
          <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace' }}>{total.toLocaleString()} results</span>
          </div>
        </div>

        {listError && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '12px', fontSize: '13px', color: 'var(--danger)' }}>
            {listError}
          </div>
        )}

        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Date', 'Company', 'Product', 'Issue', 'State', 'Timely', 'Disputed'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Loading complaints…</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', fontSize: '13px' }}>No complaints found</td></tr>
              ) : (
                complaints.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.1s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.025)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {c.date_received ? c.date_received.slice(0, 10) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.company || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-tertiary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.product || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-tertiary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.issue || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-tertiary)' }}>{c.state || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: c.timely_response === 'Yes' ? 'var(--positive)' : 'var(--danger)' }}>
                        {c.timely_response || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: c.consumer_disputed === 'Yes' ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                        {c.consumer_disputed || 'No'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'ui-monospace, monospace' }}>
                Page {page} of {Math.ceil(total / PAGE_SIZE)}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="pill-btn" style={{ opacity: page === 1 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / PAGE_SIZE)} className="pill-btn" style={{ opacity: page >= Math.ceil(total / PAGE_SIZE) ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
