import React from 'react'
import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Overview', icon: '◎' },
  { to: '/score', label: 'Score Engine', icon: '⊕' },
  { to: '/map', label: 'Geography Map', icon: '◈' },
  { to: '/complaints', label: 'Complaints', icon: '◇' },
  { to: '/query', label: 'Query Lab', icon: '⌬' },
  { to: '/reports', label: 'Reports', icon: '▣' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-navy-900 border-r border-navy-700 flex flex-col py-6 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 mb-8">
        <div className="text-xl font-display font-black text-white tracking-tight">
          Fin<span className="text-accent">Lens</span>
        </div>
        <div className="text-xs text-gray-500 font-mono mt-1">
          What FICO doesn't tell you.
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium border-l-2 border-accent pl-2'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700'
              }`
            }
          >
            <span className="w-5 text-center font-mono">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 pt-4 border-t border-navy-700">
        <div className="text-xs text-gray-600 font-mono">
          Built with federal data
        </div>
        <div className="text-xs text-gray-600">
          CFPB · HMDA · Census ACS
        </div>
      </div>
    </aside>
  )
}
