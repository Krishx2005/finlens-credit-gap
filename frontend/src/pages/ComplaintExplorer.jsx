import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Treemap, Cell
} from 'recharts'
import { getComplaints, getComplaintSummary } from '../api'

const PRODUCTS = ['All', 'Mortgage', 'Credit card', 'Student loan', 'Debt collection', 'Credit reporting', 'Personal loan', 'Bank account']
const STATES = ['All', 'CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']

const TREEMAP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

function CustomTreemapContent({ root, depth, x, y, width, height, index, name, value }) {
  if (width < 30 || height < 20) return null
  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        style={{ fill: TREEMAP_COLORS[index % TREEMAP_COLORS.length], stroke: '#0a0f1e', strokeWidth: 2, opacity: 0.85 }}
        rx={4}
      />
      {width > 60 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={11} fontFamily="DM Sans">
          {name?.length > 14 ? name.slice(0, 14) + '…' : name}
        </text>
      )}
      {width > 60 && height > 45 && (
        <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" fill="#9ca3af" fontSize={10}>
          {value?.toLocaleString()}
        </text>
      )}
    </g>
  )
}

export default function ComplaintExplorer() {
  const [summary, setSummary] = useState(null)
  const [summaryError, setSummaryError] = useState('')
  const [complaints, setComplaints] = useState([])
  const [listError, setListError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ product: 'All', state: 'All', company: '' })
  // Separate input state for company so we can debounce before flushing into filters
  const [companyInput, setCompanyInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    getComplaintSummary()
      .then(setSummary)
      .catch((err) => setSummaryError(err.message || 'Failed to load summary'))
  }, [])

  // Debounce company input → flush into filters after 400ms
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
    const params = {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }
    if (filters.product !== 'All') params.product = filters.product
    if (filters.state !== 'All') params.state = filters.state
    if (filters.company) params.company = filters.company

    // 5-second fallback — stop showing spinner even if fetch hangs
    const timeout = setTimeout(() => {
      if (!controller.signal.aborted) {
        console.warn('[ComplaintExplorer] 5s timeout — stopping loading spinner')
        setListError('Request timed out. Is the backend running at ' + (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '?')
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

  const issueTreemap = summary?.by_issue?.slice(0, 8).map((item) => ({
    name: item.issue,
    size: item.count,
    value: item.count,
  })) || []

  // by_state is now an array [{state, count}] sorted by count
  const stateData = summary?.by_state?.slice(0, 12).map((s) => ({
    name: s.state,
    count: s.count,
  })) || []

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">CFPB Data</div>
        <h1 className="text-4xl font-display font-black text-white">Complaint Explorer</h1>
        <p className="text-gray-400 mt-2">
          Consumer financial complaints by product, company, and geography.
        </p>
      </div>

      {summaryError && (
        <div className="mb-4 px-4 py-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
          Summary unavailable: {summaryError}
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Complaints', value: summary.total_complaints?.toLocaleString(), color: 'text-white' },
            { label: 'Dispute Rate', value: `${(summary.dispute_rate * 100).toFixed(1)}%`, color: 'text-warning' },
            { label: 'Timely Response', value: `${(summary.timely_response_rate * 100).toFixed(1)}%`, color: 'text-positive' },
            { label: 'Avg / Month', value: Math.round(summary.avg_monthly)?.toLocaleString(), color: 'text-accent' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-navy-800 border border-navy-700 rounded-xl p-4">
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-2xl font-display font-bold ${color}`}>{value ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar: Top Companies */}
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h3 className="font-display font-semibold text-white mb-1">Top 10 Companies by Volume</h3>
          <p className="text-xs text-gray-400 mb-4">Largest complaint recipients</p>
          {topCompanies.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topCompanies} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={130} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                  formatter={(v) => [v.toLocaleString(), 'Complaints']}
                />
                <Bar dataKey="complaints" radius={[0, 4, 4, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              {summaryError ? 'No data available' : 'Loading...'}
            </div>
          )}
        </div>

        {/* Line: Monthly Trend */}
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h3 className="font-display font-semibold text-white mb-1">Complaint Volume Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Monthly complaint count (last 12 months)</p>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                  formatter={(v) => [v.toLocaleString(), 'Complaints']}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              {summaryError ? 'No data available' : 'Loading...'}
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Treemap: Issues */}
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h3 className="font-display font-semibold text-white mb-1">Issues by Category</h3>
          <p className="text-xs text-gray-400 mb-4">Size = complaint volume</p>
          {issueTreemap.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <Treemap data={issueTreemap} dataKey="size" content={<CustomTreemapContent />} />
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              {summaryError ? 'No data available' : 'Loading...'}
            </div>
          )}
        </div>

        {/* Bar: By State */}
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h3 className="font-display font-semibold text-white mb-1">Complaint Rate by State</h3>
          <p className="text-xs text-gray-400 mb-4">Top 12 states by complaint volume</p>
          {stateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stateData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                  formatter={(v) => [v.toLocaleString(), 'Complaints']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stateData.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? '#ef4444' : i < 6 ? '#f97316' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              {summaryError ? 'No data available' : 'Loading...'}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 bg-navy-800 border border-navy-700 rounded-xl p-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Product</label>
          <select
            value={filters.product}
            onChange={(e) => { setFilters({ ...filters, product: e.target.value }); setPage(1) }}
            className="bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
          >
            {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">State</label>
          <select
            value={filters.state}
            onChange={(e) => { setFilters({ ...filters, state: e.target.value }); setPage(1) }}
            className="bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
          >
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Company</label>
          <input
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            placeholder="Filter company..."
            className="bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent w-40"
          />
        </div>
        <div className="ml-auto flex items-end">
          <span className="text-xs text-gray-400">{total.toLocaleString()} results</span>
        </div>
      </div>

      {listError && (
        <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
          {listError}
        </div>
      )}

      {/* Complaints table */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {['Date', 'Company', 'Product', 'Issue', 'State', 'Timely', 'Disputed'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-mono text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">Loading complaints...</td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">No complaints found</td>
              </tr>
            ) : (
              complaints.map((c, i) => (
                <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-400 whitespace-nowrap">
                    {c.date_received ? c.date_received.slice(0, 10) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300 max-w-[160px] truncate">
                    {c.company || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px] truncate">
                    {c.product || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">
                    {c.issue || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{c.state || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono ${c.timely_response === 'Yes' ? 'text-positive' : 'text-danger'}`}>
                      {c.timely_response || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono ${c.consumer_disputed === 'Yes' ? 'text-warning' : 'text-gray-500'}`}>
                      {c.consumer_disputed || 'No'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-700">
            <span className="text-xs text-gray-400">
              Page {page} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs bg-navy-700 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-navy-600 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / PAGE_SIZE)}
                className="px-3 py-1 text-xs bg-navy-700 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-navy-600 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
