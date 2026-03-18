import React from 'react'

export default function MetricCard({ label, value, sub, color = 'accent', icon }) {
  const colorMap = {
    accent: 'text-accent border-accent/30',
    positive: 'text-positive border-positive/30',
    warning: 'text-warning border-warning/30',
    danger: 'text-danger border-danger/30',
  }

  return (
    <div className={`bg-navy-800 border ${colorMap[color]} rounded-xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-gray-400">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-3xl font-display font-bold ${colorMap[color].split(' ')[0]}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}
