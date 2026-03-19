import React, { useEffect, useState } from 'react'
import { getAllCounties, getCounty } from '../api'

function getColor(value, metric) {
  if (metric === 'loan_denial_rate') {
    if (value > 0.5) return 'var(--danger)'
    if (value > 0.4) return '#ff6b35'
    if (value > 0.3) return 'var(--warning)'
    if (value > 0.2) return '#34c759'
    return 'var(--positive)'
  }
  if (metric === 'score_gap') {
    if (value > 80) return 'var(--danger)'
    if (value > 50) return '#ff6b35'
    if (value > 20) return 'var(--warning)'
    if (value > 0) return '#34c759'
    return 'var(--positive)'
  }
  if (metric === 'disparity_index') {
    if (value > 60) return 'var(--danger)'
    if (value > 40) return '#ff6b35'
    if (value > 25) return 'var(--warning)'
    if (value > 10) return '#34c759'
    return 'var(--positive)'
  }
  return 'var(--accent)'
}

const LAYER_OPTIONS = [
  { key: 'loan_denial_rate', label: 'Denial Rate', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'score_gap', label: 'Score Gap', format: (v) => `${v > 0 ? '+' : ''}${v} pts` },
  { key: 'disparity_index', label: 'Disparity Index', format: (v) => v?.toFixed(1) },
  { key: 'median_income', label: 'Median Income', format: (v) => `$${(v / 1000).toFixed(0)}K` },
  { key: 'alternative_score_avg', label: 'Alt Score', format: (v) => Math.round(v) },
]

const colorVar = (name) => {
  if (name === 'danger') return 'var(--danger)'
  if (name === 'warning') return 'var(--warning)'
  if (name === 'positive') return 'var(--positive)'
  if (name === 'accent') return 'var(--accent)'
  return 'var(--text-primary)'
}

function MetricRow({ label, value, color = 'default' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontFamily: 'ui-monospace, monospace', fontWeight: 500, color: colorVar(color) }}>{value}</span>
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
    const timeout = setTimeout(() => setLoading(false), 5000)
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '0 24px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          minHeight: '64px',
          paddingTop: '64px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '2px' }}>
            Geography
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            US Disparity Map
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveMetric(opt.key)}
              className="pill-btn"
              style={activeMetric === opt.key ? {
                background: 'rgba(0,113,227,0.1)',
                borderColor: 'rgba(0,113,227,0.3)',
                color: 'var(--accent)',
              } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search county…"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
            width: '180px',
          }}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
              Loading county data…
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {filtered.length.toLocaleString()} counties · <span style={{ color: 'var(--accent)' }}>{metricOption?.label}</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Low</span>
                  {['var(--positive)', '#34c759', 'var(--warning)', '#ff6b35', 'var(--danger)'].map((c, i) => (
                    <div key={i} style={{ width: '24px', height: '8px', borderRadius: '2px', background: c }} />
                  ))}
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>High</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                {filtered.map((county) => {
                  const metricValue = county[activeMetric]
                  const color = getColor(metricValue, activeMetric)
                  const formatted = metricOption?.format(metricValue)
                  const isSelected = selectedCounty?.county_fips === county.county_fips

                  return (
                    <div
                      key={county.county_fips}
                      onClick={() => setSelectedCounty(county)}
                      style={{
                        background: isSelected ? 'rgba(0,113,227,0.06)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isSelected ? 'rgba(0,113,227,0.25)' : 'rgba(0,0,0,0.07)'}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.background = 'rgba(0,0,0,0.04)' } }}
                      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.background = 'rgba(0,0,0,0.02)' } }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {county.county_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'ui-monospace, monospace', marginTop: '2px' }}>
                            {county.state}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', fontFamily: 'ui-monospace, monospace', fontWeight: 700, color, background: color + '18', padding: '2px 8px', borderRadius: '6px' }}>
                          {formatted}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {county.credit_desert && <span style={{ color: 'var(--danger)' }}>Desert</span>}
                        {county.is_rural && <span style={{ color: 'var(--warning)' }}>Rural</span>}
                        <span>Gap: {county.score_gap > 0 ? '+' : ''}{county.score_gap}pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {selectedCounty && (
          <div
            style={{
              width: '300px',
              flexShrink: 0,
              borderLeft: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(0,0,0,0.01)',
              padding: '24px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  {selectedCounty.county_name}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {selectedCounty.state} · FIPS {selectedCounty.county_fips}
                </div>
              </div>
              <button
                onClick={() => setSelectedCounty(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '18px', cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div>
              <MetricRow label="Denial Rate" value={`${(selectedCounty.loan_denial_rate * 100).toFixed(1)}%`} color={selectedCounty.loan_denial_rate > 0.4 ? 'danger' : 'warning'} />
              <MetricRow label="Alt Score Avg" value={Math.round(selectedCounty.alternative_score_avg)} color="accent" />
              <MetricRow label="FICO Estimate" value={Math.round(selectedCounty.fico_estimate_avg)} />
              <MetricRow label="Score Gap" value={`${selectedCounty.score_gap > 0 ? '+' : ''}${selectedCounty.score_gap} pts`} color={selectedCounty.score_gap > 20 ? 'positive' : selectedCounty.score_gap < -20 ? 'danger' : 'warning'} />
              <MetricRow label="Median Income" value={`$${(selectedCounty.median_income / 1000).toFixed(0)}K`} />
              <MetricRow label="Poverty Rate" value={`${(selectedCounty.poverty_rate * 100).toFixed(1)}%`} color="warning" />
              <MetricRow label="Unemployment" value={`${(selectedCounty.unemployment_rate * 100).toFixed(1)}%`} />
              <MetricRow label="Bank Branches" value={selectedCounty.bank_branch_count} />
              <MetricRow label="Population" value={selectedCounty.population?.toLocaleString()} />
              <MetricRow label="Disparity Index" value={selectedCounty.disparity_index?.toFixed(1)} color="warning" />
              <MetricRow label="Complaint Rate" value={`${selectedCounty.complaint_rate?.toFixed(2)}/1K`} />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCounty.credit_desert && (
                <div style={{ padding: '10px 12px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '10px', fontSize: '12px', color: 'var(--danger)' }}>
                  ⚠ Credit Desert — high denial despite adequate income
                </div>
              )}
              {selectedCounty.is_rural && (
                <div style={{ padding: '10px 12px', background: 'rgba(183,149,11,0.08)', border: '1px solid rgba(183,149,11,0.2)', borderRadius: '10px', fontSize: '12px', color: 'var(--warning)' }}>
                  ⬡ Rural county
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
