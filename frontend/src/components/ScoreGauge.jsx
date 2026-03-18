import React from 'react'

function getScoreColor(score) {
  if (score >= 750) return '#10b981'
  if (score >= 650) return '#3b82f6'
  if (score >= 550) return '#f59e0b'
  if (score >= 450) return '#f97316'
  return '#ef4444'
}

function getGradeColor(grade) {
  return { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[grade] || '#9ca3af'
}

export default function ScoreGauge({ score, grade, label = 'Alternative Score' }) {
  const color = getScoreColor(score)
  const gradeColor = getGradeColor(grade)
  const pct = ((score - 300) / 550) * 100

  return (
    <div className="flex flex-col items-center gap-3 score-reveal">
      <div className="text-xs font-mono uppercase tracking-widest text-gray-400">{label}</div>

      {/* Arc gauge */}
      <div className="relative w-48 h-28 overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-full">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1f2937"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 251.2} 251.2`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
          {/* Score text */}
          <text x="100" y="95" textAnchor="middle" fill={color}
            fontSize="28" fontFamily="Syne" fontWeight="700">
            {score}
          </text>
        </svg>
      </div>

      {/* Grade badge */}
      <div className="flex items-center gap-3">
        <span
          className="text-5xl font-display font-black"
          style={{ color: gradeColor }}
        >
          {grade}
        </span>
        <div className="text-left">
          <div className="text-xs text-gray-400">Score Band</div>
          <div className="text-sm font-medium">
            {score >= 750 ? 'Excellent' : score >= 650 ? 'Good' : score >= 550 ? 'Fair' : score >= 450 ? 'Poor' : 'Very Poor'}
          </div>
        </div>
      </div>

      {/* Range labels */}
      <div className="flex justify-between w-48 text-xs text-gray-500 font-mono">
        <span>300</span>
        <span>575</span>
        <span>850</span>
      </div>
    </div>
  )
}
