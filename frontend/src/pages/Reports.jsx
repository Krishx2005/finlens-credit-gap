import React, { useState, useEffect } from 'react'
import { getReportPreview } from '../api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const REPORT_TYPES = [
  {
    key: 'disparity',
    label: 'Disparity Analysis',
    desc: 'Full breakdown of score gaps, denial rates, and geographic disparities.',
    sections: ['Executive Summary', 'Key Metrics', 'Top Disparity Counties', 'Score Gap Distribution', 'Methodology'],
    color: 'var(--accent)',
  },
  {
    key: 'credit_desert',
    label: 'Credit Desert Profile',
    desc: 'Counties where high denial rates persist despite adequate income levels.',
    sections: ['Credit Desert Definition', 'Affected Counties', 'Demographic Overlap', 'Bank Access Analysis', 'Recommendations'],
    color: 'var(--danger)',
  },
  {
    key: 'complaint',
    label: 'Complaint Summary',
    desc: 'CFPB complaint patterns by product type, company, and geography.',
    sections: ['Complaint Volume Trends', 'Top Companies', 'Issue Breakdown', 'Dispute Rates', 'Resolution Analysis'],
    color: 'var(--warning)',
  },
]

export default function Reports() {
  const [selectedType, setSelectedType] = useState('disparity')
  const [preview, setPreview] = useState(null)
  const [previewError, setPreviewError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  const reportType = REPORT_TYPES.find((r) => r.key === selectedType)

  useEffect(() => {
    setPreview(null)
    setPreviewError('')
    getReportPreview({ report_type: selectedType })
      .then(setPreview)
      .catch((err) => setPreviewError(err.message || 'Failed to load preview'))
  }, [selectedType])

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError('')
    try {
      const params = new URLSearchParams({ report_type: selectedType })
      const response = await fetch(`${API_URL}/api/reports/generate?${params}`, {
        method: 'GET',
        headers: { Accept: 'application/pdf' },
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Server error ${response.status}: ${text.slice(0, 120)}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finlens_${selectedType}_report.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(err.message || 'PDF generation failed. Is the backend running?')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ paddingTop: '48px', paddingBottom: '40px' }}>
          <div style={{ display: 'inline-block', fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.15)', padding: '4px 12px', borderRadius: '999px', marginBottom: '20px' }}>
            Export
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 12px' }}>
            Reports
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Generate executive-ready PDF reports from federal credit data.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* Config panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                Report Type
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {REPORT_TYPES.map((rt) => {
                  const isActive = selectedType === rt.key
                  return (
                    <button
                      key={rt.key}
                      onClick={() => setSelectedType(rt.key)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `1px solid ${isActive ? rt.color + '40' : 'rgba(0,0,0,0.07)'}`,
                        background: isActive ? rt.color + '0f' : 'rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: rt.color, flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', fontWeight: 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {rt.label}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4, paddingLeft: '14px' }}>
                        {rt.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                width: '100%',
                padding: '14px',
                background: downloading ? 'rgba(0,113,227,0.5)' : 'var(--accent)',
                color: '#fff',
                fontWeight: 500,
                fontSize: '14px',
                border: 'none',
                borderRadius: '14px',
                cursor: downloading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {downloading ? (
                <>
                  <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating PDF…
                </>
              ) : (
                <>↓ Download PDF Report</>
              )}
            </button>

            {downloadError && (
              <div style={{ padding: '12px 14px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '12px', fontSize: '12px', color: 'var(--danger)' }}>
                {downloadError}
              </div>
            )}

            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Generated from live federal data
            </div>
          </div>

          {/* Preview panel */}
          <div className="glass-card" style={{ borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {reportType?.label}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-tertiary)' }}>Preview</div>
              </div>
              <div style={{ padding: '4px 12px', background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.2)', borderRadius: '999px', fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: 'var(--accent)', letterSpacing: '0.06em' }}>
                PDF
              </div>
            </div>

            {/* Report preview doc */}
            <div
              style={{
                background: 'rgba(0,0,0,0.025)',
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '24px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '12px',
              }}
            >
              {/* Doc header */}
              <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: reportType?.color, marginBottom: '6px' }}>
                  FinLens — {reportType?.label}
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ color: 'var(--text-tertiary)' }}>
                  Source: CFPB · HMDA 2023 · Census ACS · FDIC
                </div>
              </div>

              {previewError && (
                <div style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '12px' }}>Preview unavailable: {previewError}</div>
              )}

              {preview ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                      Key Findings
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {preview.key_metrics && Object.entries(preview.key_metrics).slice(0, 4).map(([key, val]) => (
                        <div key={key} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {preview.summary && (
                    <div>
                      <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                        Executive Summary
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{preview.summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="shimmer" style={{ height: '12px', borderRadius: '4px', width: '70%' }} />
                  <div className="shimmer" style={{ height: '12px', borderRadius: '4px', width: '50%' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    {[1,2,3,4].map((i) => <div key={i} className="shimmer" style={{ height: '48px', borderRadius: '8px' }} />)}
                  </div>
                </div>
              )}

              {/* Sections */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                  Report Sections
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {reportType?.sections.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: reportType.color, minWidth: '24px' }}>{String(i + 1).padStart(2, '0')}.</span>
                      <span style={{ fontSize: '12px' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                This report is based on publicly available federal datasets and does not constitute financial advice.
              </div>
            </div>

            {/* Section badges */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                Included Sections
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {reportType?.sections.map((s) => (
                  <div
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: reportType.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
