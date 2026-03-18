import React, { useEffect, useState } from 'react'
import { getAllCounties, getCounty } from '../api'

// Lazy-import Leaflet to avoid SSR issues
let MapContainer, TileLayer, GeoJSON, useMap
let leafletLoaded = false

function getColor(value, metric) {
  if (metric === 'loan_denial_rate') {
    if (value > 0.5) return '#ef4444'
    if (value > 0.4) return '#f97316'
    if (value > 0.3) return '#f59e0b'
    if (value > 0.2) return '#10b981'
    return '#059669'
  }
  if (metric === 'score_gap') {
    if (value > 80) return '#ef4444'
    if (value > 50) return '#f97316'
    if (value > 20) return '#f59e0b'
    if (value > 0) return '#10b981'
    return '#6ee7b7'
  }
  if (metric === 'disparity_index') {
    if (value > 60) return '#ef4444'
    if (value > 40) return '#f97316'
    if (value > 25) return '#f59e0b'
    if (value > 10) return '#10b981'
    return '#6ee7b7'
  }
  return '#3b82f6'
}

const LAYER_OPTIONS = [
  { key: 'loan_denial_rate', label: 'Loan Denial Rate', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'score_gap', label: 'Score Gap (Alt - FICO)', format: (v) => `${v > 0 ? '+' : ''}${v} pts` },
  { key: 'disparity_index', label: 'Disparity Index', format: (v) => v?.toFixed(1) },
  { key: 'median_income', label: 'Median Income', format: (v) => `$${(v / 1000).toFixed(0)}K` },
  { key: 'alternative_score_avg', label: 'Alt Score Avg', format: (v) => Math.round(v) },
]

function CountySidebar({ county, onClose }) {
  if (!county) return null
  return (
    <div className="absolute right-4 top-4 z-[1000] w-72 bg-navy-800 border border-navy-700 rounded-xl p-5 shadow-2xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-display font-bold text-white">{county.county_name}</div>
          <div className="text-xs text-gray-400 font-mono">{county.state} · FIPS {county.county_fips}</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">×</button>
      </div>

      <div className="space-y-3">
        {[
          ['Denial Rate', `${(county.loan_denial_rate * 100).toFixed(1)}%`,
            county.loan_denial_rate > 0.4 ? 'danger' : county.loan_denial_rate > 0.25 ? 'warning' : 'positive'],
          ['Alt Score Avg', Math.round(county.alternative_score_avg), 'accent'],
          ['FICO Estimate', Math.round(county.fico_estimate_avg), 'default'],
          ['Score Gap', `${county.score_gap > 0 ? '+' : ''}${county.score_gap} pts`,
            county.score_gap > 20 ? 'positive' : county.score_gap < -20 ? 'danger' : 'warning'],
          ['Median Income', `$${(county.median_income / 1000).toFixed(0)}K`, 'default'],
          ['Disparity Index', county.disparity_index?.toFixed(1), 'warning'],
          ['Bank Branches', county.bank_branch_count, 'default'],
          ['Population', county.population?.toLocaleString(), 'default'],
        ].map(([label, value, color]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{label}</span>
            <span className={`text-sm font-mono font-medium ${
              color === 'danger' ? 'text-danger' :
              color === 'warning' ? 'text-warning' :
              color === 'positive' ? 'text-positive' :
              color === 'accent' ? 'text-accent' : 'text-white'
            }`}>{value}</span>
          </div>
        ))}
      </div>

      {county.credit_desert && (
        <div className="mt-3 px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger">
          ⚠ Credit Desert — high denial despite adequate income
        </div>
      )}
      {county.is_rural && (
        <div className="mt-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
          🌾 Rural county
        </div>
      )}
    </div>
  )
}

export default function GeographyMap() {
  const [counties, setCounties] = useState([])
  const [selectedCounty, setSelectedCounty] = useState(null)
  const [activeMetric, setActiveMetric] = useState('loan_denial_rate')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[GeographyMap] 5s timeout — stopping loading spinner')
      setLoading(false)
    }, 5000)
    getAllCounties().then((d) => {
      clearTimeout(timeout)
      setCounties(d.counties || [])
      setLoading(false)
    }).catch(() => {
      clearTimeout(timeout)
      setLoading(false)
    })
    return () => clearTimeout(timeout)
  }, [])

  const metricOption = LAYER_OPTIONS.find((l) => l.key === activeMetric)
  const filtered = search
    ? counties.filter((c) =>
        c.county_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.state?.toLowerCase().includes(search.toLowerCase())
      )
    : counties

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-navy-700 flex items-center gap-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-accent mb-1">Geography Map</div>
          <h1 className="text-2xl font-display font-black text-white">US Disparity Map</h1>
        </div>

        {/* Metric selector */}
        <div className="flex gap-2 flex-wrap">
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveMetric(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeMetric === opt.key
                  ? 'bg-accent text-white'
                  : 'bg-navy-700 text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search county..."
          className="ml-auto bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent w-48"
        />
      </div>

      {/* Map + County List (since full Leaflet needs GeoJSON boundaries, show table view) */}
      <div className="flex flex-1 overflow-hidden">
        {/* County data table (visual replacement for map when GeoJSON not bundled) */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Loading county data...</div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-400">
                Showing {filtered.length} counties · Metric: <span className="text-accent">{metricOption?.label}</span>
              </div>

              {/* Color legend */}
              <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                <span>Low</span>
                {['#059669', '#10b981', '#f59e0b', '#f97316', '#ef4444'].map((c) => (
                  <div key={c} className="w-8 h-3 rounded" style={{ background: c }} />
                ))}
                <span>High</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((county) => {
                  const metricValue = county[activeMetric]
                  const color = getColor(metricValue, activeMetric)
                  const formatted = metricOption?.format(metricValue)
                  return (
                    <div
                      key={county.county_fips}
                      onClick={() => setSelectedCounty(county)}
                      className="bg-navy-800 border border-navy-700 rounded-lg p-3 cursor-pointer hover:border-accent transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-white leading-tight">
                            {county.county_name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{county.state}</div>
                        </div>
                        <div
                          className="text-sm font-mono font-bold px-2 py-0.5 rounded"
                          style={{ color, background: color + '20' }}
                        >
                          {formatted}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {county.credit_desert && <span className="text-danger">Desert</span>}
                        {county.is_rural && <span className="text-warning">Rural</span>}
                        <span>Gap: {county.score_gap > 0 ? '+' : ''}{county.score_gap}pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* County detail sidebar */}
        {selectedCounty && (
          <div className="w-80 border-l border-navy-700 bg-navy-800 p-5 overflow-auto flex-shrink-0">
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="font-display font-bold text-white">{selectedCounty.county_name}</div>
                <div className="text-xs text-gray-400 font-mono">{selectedCounty.state}</div>
              </div>
              <button onClick={() => setSelectedCounty(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Denial Rate', value: `${(selectedCounty.loan_denial_rate * 100).toFixed(1)}%`, color: selectedCounty.loan_denial_rate > 0.4 ? 'danger' : 'warning' },
                { label: 'Alt Score', value: Math.round(selectedCounty.alternative_score_avg), color: 'accent' },
                { label: 'FICO Estimate', value: Math.round(selectedCounty.fico_estimate_avg), color: 'default' },
                { label: 'Score Gap', value: `${selectedCounty.score_gap > 0 ? '+' : ''}${selectedCounty.score_gap} pts`, color: selectedCounty.score_gap > 0 ? 'positive' : 'danger' },
                { label: 'Median Income', value: `$${(selectedCounty.median_income / 1000).toFixed(0)}K`, color: 'default' },
                { label: 'Poverty Rate', value: `${(selectedCounty.poverty_rate * 100).toFixed(1)}%`, color: 'warning' },
                { label: 'Unemployment', value: `${(selectedCounty.unemployment_rate * 100).toFixed(1)}%`, color: 'default' },
                { label: 'Bank Branches', value: selectedCounty.bank_branch_count, color: 'default' },
                { label: 'Population', value: selectedCounty.population?.toLocaleString(), color: 'default' },
                { label: 'Disparity Index', value: selectedCounty.disparity_index?.toFixed(1), color: 'warning' },
                { label: 'Complaint Rate', value: `${selectedCounty.complaint_rate?.toFixed(2)}/1K`, color: 'default' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center border-b border-navy-700 pb-2">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className={`text-sm font-mono font-medium ${
                    color === 'danger' ? 'text-danger' :
                    color === 'warning' ? 'text-warning' :
                    color === 'positive' ? 'text-positive' :
                    color === 'accent' ? 'text-accent' : 'text-white'
                  }`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {selectedCounty.credit_desert && (
                <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger">
                  ⚠ Credit Desert
                </div>
              )}
              {selectedCounty.is_rural && (
                <div className="px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
                  🌾 Rural County
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
