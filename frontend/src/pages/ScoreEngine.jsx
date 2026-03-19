import React, { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import ScoreGauge from '../components/ScoreGauge'
import { calculateScore, getDemoScores, getAllCounties } from '../api'

function CountySearch({ counties, value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selected = counties.find((c) => c.fips === value)
  useEffect(() => {
    if (selected) setQuery(selected.label)
  }, [value, counties.length])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        if (selected) setQuery(selected.label)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  const filtered = query.length < 2
    ? []
    : counties.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())).slice(0, 60)

  const handleSelect = (county) => {
    setQuery(county.label)
    setOpen(false)
    onChange(county.fips)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { if (query.length >= 2) setOpen(true) }}
        placeholder="Type to search counties…"
        style={{
          width: '100%',
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.16)',
          borderRadius: '10px',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.15s ease',
        }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.16)' }}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '10px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          }}
        >
          {filtered.map((c) => (
            <li
              key={c.fips}
              onMouseDown={() => handleSelect(c)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                cursor: 'pointer',
                color: c.fips === value ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(0,0,0,0.04)'; e.target.style.color = 'var(--text-primary)' }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = c.fips === value ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {c.label}
            </li>
          ))}
        </ul>
      )}
      {open && query.length >= 2 && filtered.length === 0 && (
        <div
          className="absolute z-50 w-full mt-1"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            color: 'var(--text-tertiary)',
          }}
        >
          No counties found
        </div>
      )}
    </div>
  )
}

function ScoreBreakdownBar({ label, value, contribution, index }) {
  const isPositive = contribution >= 0
  const color = isPositive ? 'var(--accent)' : 'var(--danger)'

  return (
    <div style={{ marginBottom: '14px', animationDelay: `${index * 80}ms` }} className="animate-on-scroll">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color }}>
          {isPositive ? '+' : ''}{contribution.toFixed(1)}%
        </span>
      </div>
      <div style={{ width: '100%', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', height: '4px' }}>
        <div
          style={{
            height: '4px',
            borderRadius: '999px',
            background: color,
            width: `${Math.min(100, Math.abs(contribution))}%`,
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  )
}

function InputField({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <label style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.16)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
}

export default function ScoreEngine() {
  const [form, setForm] = useState({
    income: '',
    loan_amount: '',
    county_fips: '',
    age_bracket: '26-35',
    employment_type: 'employed',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demos, setDemos] = useState([])
  const [counties, setCounties] = useState([])

  useEffect(() => {
    getDemoScores().then((d) => setDemos(d.profiles || [])).catch(() => {})
    getAllCounties().then((d) => {
      const list = (d.counties || []).map((c) => ({
        fips: c.county_fips,
        label: `${c.county_name.split(',')[0]}, ${c.state}`,
      }))
      list.sort((a, b) => a.label.localeCompare(b.label))
      setCounties(list)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.income || !form.loan_amount) {
      setError('Please enter income and loan amount.')
      return
    }
    setLoading(true)
    try {
      const res = await calculateScore({
        ...form,
        income: parseFloat(form.income),
        loan_amount: parseFloat(form.loan_amount),
      })
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const breakdownData = result
    ? Object.entries(result.score_breakdown).map(([key, val]) => ({
        name: val.label,
        value: Math.abs(val.contribution),
        contribution: val.contribution,
        fill: val.contribution >= 0 ? 'var(--accent)' : 'var(--danger)',
      }))
    : []

  const scoreGrade = result
    ? result.alternative_score >= 750 ? 'A' : result.alternative_score >= 650 ? 'B' :
      result.alternative_score >= 550 ? 'C' : result.alternative_score >= 450 ? 'D' : 'F'
    : null

  const ficoGrade = result
    ? result.fico_estimate >= 750 ? 'A' : result.fico_estimate >= 650 ? 'B' :
      result.fico_estimate >= 550 ? 'C' : result.fico_estimate >= 450 ? 'D' : 'F'
    : null

  return (
    <div style={{ minHeight: '100vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ paddingTop: '48px', paddingBottom: '48px' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              background: 'rgba(0,113,227,0.08)',
              border: '1px solid rgba(0,113,227,0.15)',
              padding: '4px 12px',
              borderRadius: '999px',
              marginBottom: '20px',
            }}
          >
            Score Engine
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 12px',
            }}
          >
            Alternative Credit Score
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.6 }}>
            Scored on structural access, not history. Enter your profile to see what FICO misses.
          </p>
        </div>

        {/* Main 2-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '80px' }}>

          {/* Form card */}
          <div
            className="glass-card"
            style={{ borderRadius: '20px', padding: '32px' }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px', marginTop: 0 }}>
              Applicant Profile
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <InputField label="Annual Income" hint="USD">
                <input
                  type="number"
                  value={form.income}
                  onChange={(e) => setForm({ ...form, income: e.target.value })}
                  placeholder="52,000"
                  style={inputStyle}
                />
              </InputField>

              <InputField label="Loan Amount" hint="USD">
                <input
                  type="number"
                  value={form.loan_amount}
                  onChange={(e) => setForm({ ...form, loan_amount: e.target.value })}
                  placeholder="220,000"
                  style={inputStyle}
                />
              </InputField>

              <InputField
                label="County"
                hint={counties.length > 0 ? `${counties.length.toLocaleString()} available` : undefined}
              >
                <CountySearch
                  counties={counties}
                  value={form.county_fips}
                  onChange={(fips) => setForm({ ...form, county_fips: fips })}
                />
              </InputField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField label="Age Bracket">
                  <select
                    value={form.age_bracket}
                    onChange={(e) => setForm({ ...form, age_bracket: e.target.value })}
                    style={inputStyle}
                  >
                    {['18-25', '26-35', '36-50', '51-65', '65+'].map((b) => (
                      <option key={b} value={b} style={{ background: '#ffffff' }}>{b}</option>
                    ))}
                  </select>
                </InputField>
                <InputField label="Employment">
                  <select
                    value={form.employment_type}
                    onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                    style={inputStyle}
                  >
                    {[
                      ['employed', 'Employed'],
                      ['self_employed', 'Self-Employed'],
                      ['part_time', 'Part-Time'],
                      ['gig_worker', 'Gig Worker'],
                      ['retired', 'Retired'],
                    ].map(([val, label]) => (
                      <option key={val} value={val} style={{ background: '#ffffff' }}>{label}</option>
                    ))}
                  </select>
                </InputField>
              </div>

              {error && (
                <div style={{ fontSize: '13px', color: 'var(--danger)', padding: '10px 14px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '10px' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? 'rgba(0,113,227,0.5)' : 'var(--accent)',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.01em',
                }}
              >
                {loading ? 'Calculating…' : 'Calculate Alternative Score →'}
              </button>
            </form>
          </div>

          {/* Results card */}
          <div
            className="glass-card"
            style={{ borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column' }}
          >
            {result ? (
              <>
                {/* Score gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ScoreGauge score={result.alternative_score} grade={scoreGrade} label="Alternative Score" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ScoreGauge score={result.fico_estimate} grade={ficoGrade} label="FICO Estimate" />
                  </div>
                </div>

                {/* Score gap */}
                <div
                  style={{
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    background: result.score_gap > 0 ? 'rgba(29,131,72,0.07)' : 'rgba(192,57,43,0.07)',
                    border: `1px solid ${result.score_gap > 0 ? 'rgba(29,131,72,0.2)' : 'rgba(192,57,43,0.2)'}`,
                  }}
                >
                  <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    Score Gap
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: result.score_gap > 0 ? 'var(--positive)' : 'var(--danger)' }}>
                    {result.score_gap > 0 ? '+' : ''}{result.score_gap} pts
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {result.score_gap > 0
                      ? 'FICO undervalues this applicant vs structural indicators'
                      : 'Traditional scoring rates this profile higher'}
                  </div>
                </div>

                {/* Explanation */}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  {result.explanation}
                </div>

                {/* Breakdown bars */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                    Score Breakdown
                  </div>
                  {breakdownData.map((d, i) => (
                    <ScoreBreakdownBar key={d.name} label={d.name} value={d.value} contribution={d.contribution} index={i} />
                  ))}
                </div>

                {/* Approval probability */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Approval Probability</span>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: '999px', height: '4px' }}>
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '999px',
                        background: 'var(--accent)',
                        width: `${result.approval_probability * 100}%`,
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--accent)', minWidth: '36px', textAlign: 'right' }}>
                    {(result.approval_probability * 100).toFixed(0)}%
                  </span>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(0,113,227,0.06)',
                    border: '1px solid rgba(0,113,227,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  ◎
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
                  Enter your profile to see<br />your alternative credit score
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Demo profiles */}
        {demos.length > 0 && (
          <section>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                Contrasting Profiles
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                The Gap in Practice
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {demos.map((profile, i) => (
                <div
                  key={i}
                  className="glass-card card-hover animate-on-scroll"
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    {profile.label}
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Alt Score</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--accent)' }}>{profile.alternative_score}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>FICO Est.</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-secondary)' }}>{profile.fico_estimate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gap</div>
                      <div style={{
                        fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em',
                        color: profile.score_gap > 0 ? 'var(--positive)' : 'var(--danger)'
                      }}>
                        {profile.score_gap > 0 ? '+' : ''}{profile.score_gap}
                      </div>
                    </div>
                  </div>

                  {/* Score gap bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '999px', height: '3px', position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: `${(profile.fico_estimate / 850) * 100}%`,
                        top: '-1px',
                        width: `${Math.abs(profile.score_gap / 850) * 100}%`,
                        height: '5px',
                        borderRadius: '999px',
                        background: profile.score_gap > 0 ? 'var(--positive)' : 'var(--danger)',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {profile.is_rural ? '⬡ Rural' : '▣ Urban'} · {profile.county_name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
