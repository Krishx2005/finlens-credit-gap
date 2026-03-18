import React, { useState, useEffect } from 'react'
import { getReportPreview, downloadReport } from '../api'

const REPORT_TYPES = [
  {
    key: 'disparity',
    label: 'Disparity Analysis',
    desc: 'Full breakdown of score gaps, denial rates, and geographic disparities.',
    sections: ['Executive Summary', 'Key Metrics', 'Top Disparity Counties', 'Score Gap Distribution', 'Methodology'],
  },
  {
    key: 'credit_desert',
    label: 'Credit Desert Profile',
    desc: 'Counties where high denial rates persist despite adequate income levels.',
    sections: ['Credit Desert Definition', 'Affected Counties', 'Demographic Overlap', 'Bank Access Analysis', 'Recommendations'],
  },
  {
    key: 'complaint',
    label: 'Complaint Summary',
    desc: 'CFPB complaint patterns by product type, company, and geography.',
    sections: ['Complaint Volume Trends', 'Top Companies', 'Issue Breakdown', 'Dispute Rates', 'Resolution Analysis'],
  },
]

function SectionBadge({ label }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-navy-700 rounded-lg">
      <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
      <span className="text-xs text-gray-300">{label}</span>
    </div>
  )
}

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
      const blob = await downloadReport({ report_type: selectedType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finlens_${selectedType}_report.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(err.message || 'PDF generation failed. Is the backend running?')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">Export</div>
        <h1 className="text-4xl font-display font-black text-white">Reports</h1>
        <p className="text-gray-400 mt-2">
          Generate executive-ready PDF reports from federal credit data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">Report Type</h2>
            <div className="space-y-2">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.key}
                  onClick={() => setSelectedType(rt.key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedType === rt.key
                      ? 'bg-accent/10 border-accent/40 text-white'
                      : 'bg-navy-700 border-navy-600 text-gray-300 hover:border-navy-500'
                  }`}
                >
                  <div className="text-sm font-medium mb-0.5">{rt.label}</div>
                  <div className="text-xs text-gray-400 leading-snug">{rt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-4 bg-accent text-white font-medium rounded-xl hover:bg-blue-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF…
              </>
            ) : (
              <>
                <span>↓</span> Download PDF Report
              </>
            )}
          </button>

          {downloadError && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger">
              {downloadError}
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            Reports are generated from live federal data
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-display font-semibold text-white">{reportType?.label}</h2>
                <div className="text-xs text-gray-400 font-mono mt-0.5">Preview</div>
              </div>
              <div className="px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-xs text-accent font-mono">
                PDF
              </div>
            </div>

            {/* Mock report preview */}
            <div className="bg-navy-950 rounded-xl border border-navy-700 p-6 font-mono text-xs">
              {/* Report header */}
              <div className="border-b border-navy-700 pb-4 mb-4">
                <div className="text-accent font-bold text-base mb-1">FinLens — {reportType?.label}</div>
                <div className="text-gray-400">Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div className="text-gray-500 mt-1">Source: CFPB · HMDA 2023 · Census ACS · FDIC</div>
              </div>

              {/* Key metrics from preview */}
              {previewError && (
                <div className="text-xs text-warning mb-3">Preview unavailable: {previewError}</div>
              )}
              {preview ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-gray-400 uppercase tracking-wider text-xs mb-2">Key Findings</div>
                    <div className="grid grid-cols-2 gap-3">
                      {preview.key_metrics && Object.entries(preview.key_metrics).slice(0, 4).map(([key, val]) => (
                        <div key={key} className="bg-navy-800 rounded-lg p-3">
                          <div className="text-gray-500 text-xs mb-1">{key.replace(/_/g, ' ')}</div>
                          <div className="text-white font-bold">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {preview.summary && (
                    <div>
                      <div className="text-gray-400 uppercase tracking-wider text-xs mb-2">Executive Summary</div>
                      <p className="text-gray-300 leading-relaxed text-xs">{preview.summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 bg-navy-800 rounded w-3/4" />
                  <div className="h-3 bg-navy-800 rounded w-1/2" />
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-navy-800 rounded" />
                    ))}
                  </div>
                </div>
              )}

              {/* Sections list */}
              <div className="mt-5">
                <div className="text-gray-400 uppercase tracking-wider text-xs mb-2">Report Sections</div>
                <div className="space-y-1">
                  {reportType?.sections.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-400">
                      <span className="text-accent">{String(i + 1).padStart(2, '0')}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-navy-700 text-gray-600">
                This report is based on publicly available federal datasets and does not constitute financial advice.
                All data sources are cited in the Methodology section.
              </div>
            </div>

            {/* Included sections */}
            <div className="mt-5">
              <div className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-3">Included Sections</div>
              <div className="flex flex-wrap gap-2">
                {reportType?.sections.map((s) => <SectionBadge key={s} label={s} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
