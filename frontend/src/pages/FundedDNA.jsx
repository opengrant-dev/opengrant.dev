/**
 * FundedDNA — compare your repo to profiles of 45+ funded OSS projects.
 * Route: /dna/:repoId
 */
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

function ScoreMeter({ score, label, size = 'lg' }) {
  const pct = Math.min(100, Math.max(0, score))
  const color = pct >= 70 ? 'from-emerald-500 to-green-400'
    : pct >= 45 ? 'from-sky-500 to-blue-400'
    : pct >= 25 ? 'from-amber-500 to-yellow-400'
    : 'from-red-500 to-orange-400'

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="url(#dnaGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="dnaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={pct >= 70 ? '#10b981' : pct >= 45 ? '#0ea5e9' : pct >= 25 ? '#f59e0b' : '#ef4444'} />
                <stop offset="100%" stopColor={pct >= 70 ? '#4ade80' : pct >= 45 ? '#60a5fa' : pct >= 25 ? '#fbbf24' : '#fb923c'} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{pct}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>
        {label && <span className="text-sm text-slate-400 font-medium">{label}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}</span>
    </div>
  )
}

function MatchCard({ match, index }) {
  const sim = match.similarity
  const color = sim >= 70 ? 'border-emerald-500/30 bg-emerald-500/5'
    : sim >= 45 ? 'border-sky-500/30 bg-sky-500/5'
    : 'border-white/10 bg-white/3'

  const textColor = sim >= 70 ? 'text-emerald-400'
    : sim >= 45 ? 'text-sky-400'
    : 'text-slate-400'

  return (
    <motion.div
      className={`glass-card p-4 border ${color}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <a
            href={`https://github.com/${match.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:text-sky-400 transition-colors text-sm"
          >
            {match.project_name}
          </a>
          <div className="text-xs text-slate-500 mt-0.5">
            {match.language} · {match.category} · ★ {(match.approximate_stars || 0).toLocaleString()}
          </div>
        </div>
        <span className={`text-lg font-bold ${textColor} shrink-0`}>{sim}%</span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-1.5 mb-3">
        {Object.entries(match.dimensions || {}).map(([dim, val]) => (
          <div key={dim} className="grid grid-cols-[80px_1fr] items-center gap-2">
            <span className="text-xs text-slate-600 capitalize">{dim}</span>
            <ScoreMeter score={val} size="sm" />
          </div>
        ))}
      </div>

      {/* Funder badges */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
        {(match.funders || []).map(f => (
          <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {f}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function FundedDNA() {
  const { repoId } = useParams()
  const [inputId, setInputId] = useState(repoId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const fetchDNA = async (id) => {
    const target = id || inputId.trim()
    if (!target) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.get(`${API_BASE}/api/repos/${target}/dna`)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch DNA analysis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (repoId) fetchDNA(repoId)
  }, [repoId])

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-400 mb-4">
            <span>🧬</span> Funded DNA
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Match your repo to <span className="gradient-text">funded projects</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            We compare your project against 45+ known funded OSS repos across 6 dimensions
            to reveal which funders historically back projects like yours.
          </p>
        </motion.div>

        {/* Input */}
        {!repoId && (
          <motion.div className="max-w-xl mx-auto mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex gap-2">
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchDNA()}
                placeholder="Paste your repo ID from the analysis page"
                className="flex-1 glass-card px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm bg-transparent"
              />
              <button onClick={() => fetchDNA()} disabled={loading || !inputId.trim()} className="btn-primary shrink-0">
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : 'Analyze'}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              Or <Link to="/" className="text-sky-400 hover:underline">submit your repo</Link> first to get a repo ID.
            </p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-xl mx-auto mb-6 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-4xl mb-4 animate-pulse">🧬</div>
            <p>Comparing DNA with 45+ funded projects…</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* DNA Score + Repo name */}
              <div className="text-center mb-10">
                {result.repo_name && (
                  <p className="text-slate-400 text-sm mb-4">
                    Results for <span className="text-white font-medium">{result.repo_name}</span>
                  </p>
                )}
                <ScoreMeter score={result.dna_score} label="DNA Match Score" />
                <p className="text-xs text-slate-500 mt-2">
                  Compared against {result.total_projects_compared} funded OSS projects
                </p>
              </div>

              {/* Insights */}
              {result.insights?.length > 0 && (
                <motion.div className="glass-card p-5 mb-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span>💡</span> Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {result.insights.map((ins, i) => (
                      <li key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-sky-500 shrink-0 mt-0.5">→</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Top Funder Frequency */}
              {result.funder_frequency && Object.keys(result.funder_frequency).length > 0 && (
                <motion.div className="glass-card p-5 mb-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span>🏦</span> Funders That Back Similar Projects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.funder_frequency).map(([funder, count]) => (
                      <span key={funder} className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {funder}
                        <span className="text-xs bg-indigo-500/20 rounded-full px-1.5">{count}</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Top matches grid */}
              <h3 className="text-lg font-semibold text-white mb-4">Closest Funded Project Matches</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {(result.top_matches || []).map((match, i) => (
                  <MatchCard key={match.project_name} match={match} index={i} />
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-3 mt-8 justify-center">
                {result.repo_id && (
                  <>
                    <Link to={`/portfolio/${result.repo_id}`} className="btn-primary">
                      Optimize Grant Stack →
                    </Link>
                    <Link to={`/velocity/${result.repo_id}`} className="glass-card px-5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                      ⚡ Velocity Dashboard
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
