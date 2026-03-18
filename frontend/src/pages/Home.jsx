import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import MetricCard from '../components/MetricCard'
import { getGeographySummary, getComplaintSummary } from '../api'

function AnimatedNumber({ target, prefix = '', suffix = '', decimals = 0, duration = 1500 }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return (
    <span>
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

export default function Home() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    getGeographySummary().then(setSummary).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen p-8">
      {/* Hero */}
      <section className="mb-16 pt-8">
        <div className="max-w-3xl">
          <div className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
            Federal Data Analysis · 2024
          </div>
          <h1 className="text-6xl font-display font-black text-white leading-tight mb-6">
            The Credit
            <br />
            <span className="text-accent">Gap</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed mb-4">
            Traditional FICO scores systematically disadvantage young and rural borrowers
            — not because of their financial behavior, but because of{' '}
            <em className="text-white not-italic font-medium">where they live</em> and{' '}
            <em className="text-white not-italic font-medium">when they started</em>.
          </p>
          <p className="text-gray-400 mb-8">
            We rebuilt the score from scratch using federal mortgage data, banking access metrics,
            and economic stability indicators. Here's what we found.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => navigate('/score')}
              className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-blue-400 transition-colors"
            >
              Calculate Your Alternative Score
            </button>
            <button
              onClick={() => navigate('/map')}
              className="px-6 py-3 border border-navy-700 text-gray-200 rounded-lg hover:border-accent hover:text-accent transition-colors"
            >
              Explore the Map
            </button>
            <button
              onClick={() => navigate('/query')}
              className="px-6 py-3 border border-navy-700 text-gray-200 rounded-lg hover:border-accent hover:text-accent transition-colors"
            >
              Query the Data
            </button>
          </div>
        </div>
      </section>

      {/* Animated counters — key findings */}
      <section className="mb-14">
        <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-6">
          The Findings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-navy-800 border border-danger/30 rounded-xl p-5 count-up">
            <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Credit Deserts
            </div>
            <div className="text-4xl font-display font-black text-danger">
              {summary ? <AnimatedNumber target={summary.credit_deserts} /> : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              counties with {'>'} 40% denial, income {'>'} $40K
            </div>
          </div>

          <div className="bg-navy-800 border border-warning/30 rounded-xl p-5 count-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Rural Denial Premium
            </div>
            <div className="text-4xl font-display font-black text-warning">
              {summary ? (
                <><AnimatedNumber target={summary.rural_denial_premium * 100} decimals={1} />%</>
              ) : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              extra denial rate vs urban applicants
            </div>
          </div>

          <div className="bg-navy-800 border border-accent/30 rounded-xl p-5 count-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Score Gap (Rural)
            </div>
            <div className="text-4xl font-display font-black text-accent">
              {summary ? (
                <><AnimatedNumber target={Math.abs(summary.avg_score_gap_rural)} decimals={0} /> pts</>
              ) : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              alt score vs FICO estimate, rural avg
            </div>
          </div>

          <div className="bg-navy-800 border border-positive/30 rounded-xl p-5 count-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              Counties Analyzed
            </div>
            <div className="text-4xl font-display font-black text-positive">
              {summary ? <AnimatedNumber target={summary.total_counties} /> : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              across all 50 states + territories
            </div>
          </div>
        </div>
      </section>

      {/* Charts side by side */}
      <section className="mb-14 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h3 className="font-display font-semibold text-white mb-1">
            Loan Denial Rate by Rurality
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Rural classification, not income, predicts denial rate
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={RURAL_URBAN_DATA} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                formatter={(v) => [`${v}%`, 'Denial Rate']}
              />
              <Bar dataKey="denial" radius={[4, 4, 0, 0]}>
                {RURAL_URBAN_DATA.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? '#10b981' : i === 2 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h3 className="font-display font-semibold text-white mb-1">
            Denial Rate by Age Bracket
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Young borrowers face 2× the denial rate of older applicants
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={AGE_DATA} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                formatter={(v) => [`${v}%`, 'Denial Rate']}
              />
              <Bar dataKey="denial" radius={[4, 4, 0, 0]}>
                {AGE_DATA.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : i === 2 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Methodology strip */}
      <section className="bg-navy-800 border border-navy-700 rounded-xl p-6">
        <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3">
          Data Sources
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { name: 'CFPB Complaints', desc: 'Consumer complaint patterns by product, company, state' },
            { name: 'HMDA 2023', desc: 'Mortgage application approvals/denials by geography' },
            { name: 'Census ACS', desc: 'Income, demographics by zip code and county' },
            { name: 'FDIC Branch Data', desc: 'Bank branch density by county' },
          ].map(({ name, desc }) => (
            <div key={name}>
              <div className="text-accent text-xs font-mono font-medium mb-1">{name}</div>
              <div className="text-gray-400 text-xs">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
