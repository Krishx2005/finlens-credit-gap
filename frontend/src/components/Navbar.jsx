import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/score', label: 'Score Engine' },
  { to: '/map', label: 'Geography' },
  { to: '/complaints', label: 'Complaints' },
  { to: '/query', label: 'Query Lab' },
  { to: '/reports', label: 'Reports' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(0,0,0,0.78)'
          : 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid transparent',
        height: '48px',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <span className="text-sm font-semibold tracking-tight text-white">
            Fin<span style={{ color: 'var(--accent)' }}>Lens</span>
          </span>
          <span
            className="hidden sm:block text-xs font-mono opacity-40 group-hover:opacity-60 transition-opacity"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
          >
            credit gap
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'text-[#86868b] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
