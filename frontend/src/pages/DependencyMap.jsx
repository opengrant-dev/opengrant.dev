/**
 * DependencyMap — paste your package.json or requirements.txt
 * and discover which of your dependencies are underfunded.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const RISK_STYLE = {
  high:   { label: 'High Risk',   class: 'text-red-400    bg-red-500/10    border-red-500/20'   },
  medium: { label: 'Medium Risk', class: 'text-amber-400  bg-amber-500/10  border-amber-500/20' },
  low:    { label: 'Low Risk',    class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

const EXAMPLE_PKG = `{
  "dependencies": {
    "axios": "^1.7.0",
    "react": "^18.3.0",
    "framer-motion": "^11.0.0",
    "lodash": "^4.17.21"
  }
}`

const EXAMPLE_PIP = `fastapi>=0.115.0
httpx>=0.28.0
sqlalchemy>=2.0.0
pydantic>=2.10.0
openai>=1.58.0`

function PkgCard({ pkg, index }) {
  const risk = RISK_STYLE[pkg.risk] || RISK_STYLE.low

  return (
    <motion.div
      className="glass-card p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${risk.class}`}>
              {risk.label}
            </span>
            {pkg.has_sponsors && (
              <span className="text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5">
                Has Sponsors ✓
              </span>
            )}
          </div>
          <div className="font-semibold text-white">{pkg.package}</div>
          {pkg.github_url ? (
            <a
              href={pkg.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
            >
              {pkg.github_url.replace('https://github.com/', '')} ↗
            </a>
          ) : (
            <span className="text-xs text-slate-600">No GitHub repo found</span>
          )}
        </div>
        <div className="text-right shrink-0">
          {pkg.stars > 0 && <div className="text-sm text-slate-300">★ {pkg.stars.toLocaleString()}</div>}
          {pkg.language && <div className="text-xs text-slate-600">{pkg.language}</div>}
        </div>
      </div>

      {pkg.risk_reasons.length > 0 && (
        <div className="space-y-1">
          {pkg.risk_reasons.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-red-400">•</span> {r}
            </div>
          ))}
        </div>
      )}

      {pkg.github_url && !pkg.has_sponsors && (
        <div className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
          Consider sponsoring this project on GitHub Sponsors or Open Collective
        </div>
      )}
    </motion.div>
  )
}

export default function DependencyMap() {
  const [content, setContent]   = useState('')
  const [ecosystem, setEco]     = useState('npm')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [result, setResult]     = useState(null)

  const analyze = async () => {
    if (!content.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.post(`${API_BASE}/api/dependencies/analyze`, {
        content: content.trim(),
        ecosystem,
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  const fillExample = () => {
    setContent(ecosystem === 'npm' ? EXAMPLE_PKG : EXAMPLE_PIP)
  }

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-4">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            Dependency Funding Map
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Which of your <span className="gradient-text">dependencies</span> need support?
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Paste your <code className="text-sky-400">package.json</code> or <code className="text-sky-400">requirements.txt</code> —
            we'll check each dependency's funding health and flag the ones at risk.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Ecosystem toggle */}
          <div className="flex gap-2 mb-4">
            {['npm', 'pip'].map(e => (
              <button
                key={e}
                onClick={() => { setEco(e); setContent('') }}
                className={`text-sm px-4 py-2 rounded-xl border transition-all font-medium ${ecosystem === e ? 'bg-sky-500/20 border-sky-500/30 text-sky-400' : 'border-white/10 text-slate-500 hover:text-white'}`}
              >
                {e === 'npm' ? '📦 package.json' : '🐍 requirements.txt'}
              </button>
            ))}
            <button
              onClick={fillExample}
              className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition-colors underline"
            >
              Load example
            </button>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={ecosystem === 'npm'
              ? 'Paste your package.json content here…'
              : 'Paste your requirements.txt content here…'}
            rows={10}
            className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500/50 font-mono resize-none"
          />

          {error && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={analyze}
            disabled={loading || !content.trim()}
            className="btn-primary mt-4 w-full justify-center"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Analyzing dependencies…
              </>
            ) : 'Analyze Funding Health'}
          </button>
        </motion.div>

        {/* Results */}
        {result && !loading && (
          <AnimatePresence>
            {/* Summary */}
            <motion.div
              className="grid grid-cols-3 gap-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-white">{result.total}</div>
                <div className="text-xs text-slate-500 mt-1">Total Packages</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{result.high_risk}</div>
                <div className="text-xs text-slate-500 mt-1">High Risk</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{result.medium_risk}</div>
                <div className="text-xs text-slate-500 mt-1">Medium Risk</div>
              </div>
            </motion.div>

            {result.high_risk > 0 && (
              <motion.div
                className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ⚠ {result.high_risk} of your dependencies are at high funding risk — consider sponsoring them to ensure continued maintenance.
              </motion.div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {result.packages.map((pkg, i) => (
                <PkgCard key={pkg.package} pkg={pkg} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
