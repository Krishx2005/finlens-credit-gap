import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import ScoreGauge from '../components/ScoreGauge'
import { calculateScore, getDemoScores } from '../api'

const COUNTIES = [
  { fips: '06037', name: 'Los Angeles, CA' },
  { fips: '06085', name: 'Santa Clara, CA' },
  { fips: '36061', name: 'New York County, NY' },
  { fips: '17031', name: 'Cook County, IL' },
  { fips: '48201', name: 'Harris County, TX' },
  { fips: '04013', name: 'Maricopa, AZ' },
  { fips: '53033', name: 'King County, WA' },
  { fips: '30031', name: 'Gallatin, MT (Rural)' },
  { fips: '56021', name: 'Laramie, WY (Rural)' },
  { fips: '28049', name: 'Hinds, MS (Rural)' },
  { fips: '20161', name: 'Riley, KS (Rural)' },
  { fips: '01001', name: 'Autauga, AL (Rural)' },
  { fips: '23005', name: 'Cumberland, ME (Rural)' },
]

function ScoreBreakdownBar({ label, value, contribution }) {
  const isPositive = contribution >= 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className={isPositive ? 'text-positive' : 'text-danger'}>
          {isPositive ? '+' : ''}{contribution.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-navy-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${isPositive ? 'bg-accent' : 'bg-danger'}`}
          style={{ width: `${Math.min(100, Math.abs(contribution))}%` }}
        />
      </div>
    </div>
  )
}

export default function ScoreEngine() {
  const [form, setForm] = useState({
    income: '',
    loan_amount: '',
    county_fips: '06037',
    age_bracket: '26-35',
    employment_type: 'employed',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demos, setDemos] = useState([])

  useEffect(() => {
    getDemoScores().then((d) => setDemos(d.profiles || [])).catch(() => {})
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
        fill: val.contribution >= 0 ? '#3b82f6' : '#ef4444',
      }))
    : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">Score Engine</div>
        <h1 className="text-4xl font-display font-black text-white">Alternative Credit Score</h1>
        <p className="text-gray-400 mt-2">
          Scored on structural access, not history. Enter your profile to see what FICO misses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Form */}
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h2 className="font-display font-semibold text-white mb-5">Applicant Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Annual Income ($)</label>
              <input
                type="number"
                value={form.income}
                onChange={(e) => setForm({ ...form, income: e.target.value })}
                placeholder="52000"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Loan Amount ($)</label>
              <input
                type="number"
                value={form.loan_amount}
                onChange={(e) => setForm({ ...form, loan_amount: e.target.value })}
                placeholder="220000"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">County</label>
              <select
                value={form.county_fips}
                onChange={(e) => setForm({ ...form, county_fips: e.target.value })}
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
              >
                {COUNTIES.map(({ fips, name }) => (
                  <option key={fips} value={fips}>{name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Age Bracket</label>
                <select
                  value={form.age_bracket}
                  onChange={(e) => setForm({ ...form, age_bracket: e.target.value })}
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                >
                  {['18-25', '26-35', '36-50', '51-65', '65+'].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Employment</label>
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                >
                  {[
                    ['employed', 'Employed'],
                    ['self_employed', 'Self-Employed'],
                    ['part_time', 'Part-Time'],
                    ['gig_worker', 'Gig Worker'],
                    ['retired', 'Retired'],
                  ].map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <div className="text-danger text-sm">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-white font-medium rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate Alternative Score →'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700 flex flex-col">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <ScoreGauge score={result.alternative_score} grade={result.grade} label="Alternative Score" />
                </div>
                <div className="flex flex-col items-center">
                  <ScoreGauge score={result.fico_estimate} grade={
                    result.fico_estimate >= 750 ? 'A' : result.fico_estimate >= 650 ? 'B' :
                    result.fico_estimate >= 550 ? 'C' : result.fico_estimate >= 450 ? 'D' : 'F'
                  } label="FICO Estimate" />
                </div>
              </div>

              {/* Score gap callout */}
              <div className={`rounded-lg p-4 mb-4 border ${result.score_gap > 0 ? 'bg-positive/5 border-positive/20' : 'bg-danger/5 border-danger/20'}`}>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">Score Gap</div>
                <div className={`text-2xl font-display font-bold ${result.score_gap > 0 ? 'text-positive' : 'text-danger'}`}>
                  {result.score_gap > 0 ? '+' : ''}{result.score_gap} points
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {result.score_gap > 0
                    ? 'FICO undervalues this applicant vs structural indicators'
                    : 'Traditional scoring rates this profile higher'}
                </div>
              </div>

              <div className="text-xs text-gray-300 mb-4 leading-relaxed">{result.explanation}</div>

              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">Score Breakdown</div>
                {breakdownData.map((d) => (
                  <ScoreBreakdownBar key={d.name} label={d.name} value={d.value} contribution={d.contribution} />
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="text-xs text-gray-400">Approval Probability</div>
                <div className="flex-1 bg-navy-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${result.approval_probability * 100}%` }}
                  />
                </div>
                <div className="text-xs font-mono text-accent">
                  {(result.approval_probability * 100).toFixed(0)}%
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-6xl mb-4">⊕</div>
              <div className="text-sm">Enter your profile to see your alternative score</div>
            </div>
          )}
        </div>
      </div>

      {/* Demo profiles */}
      {demos.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
            Contrasting Profiles — The Gap in Practice
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demos.map((profile, i) => (
              <div key={i} className="bg-navy-800 border border-navy-700 rounded-xl p-4">
                <div className="text-sm font-display font-semibold text-white mb-3">
                  {profile.label}
                </div>
                <div className="flex gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Alt Score</div>
                    <div className="text-xl font-display font-bold text-accent">{profile.alternative_score}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">FICO Est.</div>
                    <div className="text-xl font-display font-bold text-gray-300">{profile.fico_estimate}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Gap</div>
                    <div className={`text-xl font-display font-bold ${profile.score_gap > 0 ? 'text-positive' : 'text-danger'}`}>
                      {profile.score_gap > 0 ? '+' : ''}{profile.score_gap}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {profile.is_rural ? '🌾 Rural' : '🏙 Urban'} · {profile.county_name}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
