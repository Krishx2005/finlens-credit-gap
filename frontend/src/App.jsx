import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ScoreEngine from './pages/ScoreEngine'
import GeographyMap from './pages/GeographyMap'
import ComplaintExplorer from './pages/ComplaintExplorer'
import QueryLab from './pages/QueryLab'
import Reports from './pages/Reports'

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <Navbar />
      <main style={{ paddingTop: '48px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/score" element={<ScoreEngine />} />
          <Route path="/map" element={<GeographyMap />} />
          <Route path="/complaints" element={<ComplaintExplorer />} />
          <Route path="/query" element={<QueryLab />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}
