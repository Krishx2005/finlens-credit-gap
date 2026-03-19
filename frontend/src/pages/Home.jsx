import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getGeographySummary } from '../api'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

function AnimatedNumber({ target, prefix = '', suffix = '', decimals = 0, duration = 1800 }) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(target * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, started])

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}{suffix}
    </span>
  )
}

const RURAL_URBAN_DATA = [
  { label: 'Urban', denial: 25 },
  { label: 'Suburban', denial: 31 },
  { label: 'Rural', denial: 40 },
  { label: 'Very Rural', denial: 48 },
]

const AGE_DATA = [
  { label: '18-25', denial: 44 },
  { label: '26-35', denial: 36 },
  { label: '36-50', denial: 27 },
  { label: '51-65', denial: 22 },
  { label: '65+', denial: 19 },
]

const FINDING_CARDS = [
  {
    badge: 'Credit Access',
    color: 'var(--danger)',
    colorBg: 'rgba(192,57,43,0.08)',
    colorBorder: 'rgba(192,57,43,0.2)',
    title: 'Credit Deserts',
    metric: '847',
    desc: 'Counties where denial rates exceed 40% despite household incomes above $40K. Geography penalizes creditworthy borrowers.',
  },
  {
    badge: 'Rural Penalty',
    color: 'var(--warning)',
    colorBg: 'rgba(183,149,11,0.08)',
    colorBorder: 'rgba(183,149,11,0.2)',
    title: 'The Rural Premium',
    metric: '+23%',
    desc: 'Rural applicants face a 23-point higher denial rate than urban counterparts at identical income levels. FICO doesn\'t account for this.',
  },
  {
    badge: 'Score Gap',
    color: 'var(--accent)',
    colorBg: 'rgba(0,113,227,0.08)',
    colorBorder: 'rgba(0,113,227,0.2)',
    title: 'The Hidden Gap',
    metric: '73 pts',
    desc: 'On average, rural borrowers\' alternative credit scores are 73 points higher than their FICO estimates suggest. This gap disappears when you look at structural access.',
  },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-xl px-4 py-3 text-xs">
      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ color: 'var(--accent)' }}>{payload[0].value}% denial rate</div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const heroRef = useRef(null)
  const sectionRef = useScrollAnimation()

  useEffect(() => {
    getGeographySummary().then(setSummary).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden"
        style={{ background: '#f5f5f7' }}
      >
        {/* Gradient orbs */}
        <div
          className="orb animate-orb-float"
          style={{
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(0,113,227,0.12) 0%, transparent 70%)',
            top: '5%', left: '20%',
          }}
        />
        <div
          className="orb animate-orb-float-alt"
          style={{
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(29,131,72,0.06) 0%, transparent 70%)',
            top: '40%', right: '15%',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-8"
            style={{
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: 'var(--text-secondary)',
              letterSpacing: '0.08em',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--positive)' }}
            />
            Federal Data Analysis · 2024
          </div>

          <h1
            className="text-display font-black tracking-tight mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            What FICO{' '}
            <span className="gradient-text-blue">Doesn't Tell You.</span>
          </h1>

          <p
            className="text-lg font-light leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Traditional credit scores systematically disadvantage rural and young borrowers —
            not because of financial behavior, but because of{' '}
            <em className="not-italic" style={{ color: 'var(--text-primary)' }}>where they live</em>{' '}
            and{' '}
            <em className="not-italic" style={{ color: 'var(--text-primary)' }}>when they started</em>.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/score')}
              className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 24px rgba(0,113,227,0.25)',
              }}
            >
              Calculate Your Score
            </button>
            <button
              onClick={() => navigate('/map')}
              className="px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.1)',
                color: 'var(--text-primary)',
              }}
            >
              Explore the Map
            </button>
            <button
              onClick={() => navigate('/query')}
              className="px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.1)',
                color: 'var(--text-primary)',
              }}
            >
              Query the Data
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
        >
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, var(--text-secondary))' }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>scroll</span>
        </div>
      </section>

      {/* ── Stat counters ──────────────────────────────────────────────── */}
      <section
        ref={sectionRef}
        className="py-24 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className="label-mono mb-4 animate-on-scroll" style={{ color: 'var(--text-tertiary)' }}>
            The Findings
          </div>
          <h2
            className="text-4xl font-bold tracking-tight mb-16 animate-on-scroll animate-on-scroll-delay-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Numbers FICO ignores.
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Credit Deserts',
                value: summary ? <AnimatedNumber target={summary.credit_deserts} /> : '—',
                desc: 'high-denial, adequate-income counties',
                color: 'var(--danger)',
              },
              {
                label: 'Rural Denial Premium',
                value: summary ? (
                  <><AnimatedNumber target={summary.rural_denial_premium * 100} decimals={1} />%</>
                ) : '—',
                desc: 'above urban applicants',
                color: 'var(--warning)',
              },
              {
                label: 'Avg Score Gap',
                value: summary ? (
                  <><AnimatedNumber target={Math.abs(summary.avg_score_gap_rural)} /> pts</>
                ) : '—',
                desc: 'alt score vs FICO, rural avg',
                color: 'var(--accent)',
              },
              {
                label: 'Counties Analyzed',
                value: summary ? <AnimatedNumber target={summary.total_counties} /> : '—',
                desc: 'across all 50 states',
                color: 'var(--positive)',
              },
            ].map(({ label, value, desc, color }, i) => (
              <div
                key={label}
                className={`glass-card rounded-2xl p-6 card-hover animate-on-scroll animate-on-scroll-delay-${i + 1}`}
              >
                <div className="label-mono mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {label}
                </div>
                <div
                  className="text-4xl font-black tracking-tight mb-2"
                  style={{ color, fontVariantNumeric: 'tabular-nums' }}
                >
                  {value}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Finding cards ──────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="label-mono mb-4" style={{ color: 'var(--text-tertiary)' }}>Key Findings</div>
          <h2
            className="text-4xl font-bold tracking-tight mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            Three gaps. One system.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {FINDING_CARDS.map((card, i) => (
              <div
                key={card.title}
                className="glass-card rounded-2xl p-7 card-hover animate-on-scroll"
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div
                  className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium mb-5"
                  style={{
                    background: card.colorBg,
                    border: `1px solid ${card.colorBorder}`,
                    color: card.color,
                  }}
                >
                  {card.badge}
                </div>
                <div
                  className="text-3xl font-black tracking-tight mb-3"
                  style={{ color: card.color }}
                >
                  {card.metric}
                </div>
                <div
                  className="text-base font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {card.title}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="label-mono mb-4" style={{ color: 'var(--text-tertiary)' }}>Data Patterns</div>
          <h2
            className="text-4xl font-bold tracking-tight mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            The data is clear.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-6">
              <div
                className="text-base font-semibold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Loan Denial Rate by Rurality
              </div>
              <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
                Rural classification predicts denial — not income
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={RURAL_URBAN_DATA} barSize={42}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#6e6e73', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6e6e73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="denial" radius={[6, 6, 0, 0]}>
                    {RURAL_URBAN_DATA.map((_, i) => (
                      <Cell key={i} fill={i < 2 ? '#1d8348' : i === 2 ? '#b7950b' : '#c0392b'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div
                className="text-base font-semibold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Denial Rate by Age Bracket
              </div>
              <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
                Young borrowers face 2× the denial rate of older applicants
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={AGE_DATA} barSize={42}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#6e6e73', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6e6e73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="denial" radius={[6, 6, 0, 0]}>
                    {AGE_DATA.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? '#c0392b' : i === 1 ? '#b7950b' : i === 2 ? '#b7950b' : '#1d8348'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── Data Sources ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div
            className="glass-card rounded-2xl p-8"
          >
            <div className="label-mono mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Data Sources
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'CFPB Complaints', desc: 'Consumer complaint patterns by product, company, state' },
                { name: 'HMDA 2023', desc: 'Mortgage application approvals/denials by geography' },
                { name: 'Census ACS', desc: 'Income, demographics by zip code and county' },
                { name: 'FDIC Branch Data', desc: 'Bank branch density by county' },
              ].map(({ name, desc }) => (
                <div key={name}>
                  <div
                    className="text-xs font-semibold font-mono mb-2"
                    style={{ color: 'var(--accent)' }}
                  >
                    {name}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
