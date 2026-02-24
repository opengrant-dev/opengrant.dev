/**
 * TimeMachine — 90-day AI funding roadmap generator.
 * Route: /roadmap/:repoId
 */
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const EFFORT_COLOR = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
}

function MilestoneCard({ milestone, index }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <motion.div
      className="glass-card border border-white/10 overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{milestone.week}</div>
            {milestone.theme && (
              <div className="text-xs text-slate-500">{milestone.theme}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-600">{(milestone.actions || []).length} actions</span>
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-4 space-y-3 border-t border-white/5">
              {(milestone.actions || []).map((action, i) => (
                <div key={i} className="flex gap-3 pt-3">
                  <span className="text-sky-500 shrink-0 mt-0.5">→</span>
                  <div className="flex-1">
                    <div className="text-sm text-white">{action.action}</div>
                    {action.impact && (
                      <div className="text-xs text-slate-500 mt-1">{action.impact}</div>
                    )}
                  </div>
                  {action.effort && (
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border capitalize ${EFFORT_COLOR[action.effort] || EFFORT_COLOR.medium}`}>
                      {action.effort}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function TimeMachine() {
  const { repoId } = useParams()
  const [inputId, setInputId] = useState(repoId || '')
  const [matches, setMatches] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  // Load existing matches for grant selector
  const loadMatches = async (id) => {
    const target = id || inputId.trim()
    if (!target) return
    setLoadingMatches(true)
    try {
      const res = await axios.get(`${API_BASE}/api/repos/${target}/matches?limit=20`)
      setMatches(res.data.matches || [])
    } catch {
      // ignore — user may not have matches yet
    } finally {
      setLoadingMatches(false)
    }
  }

  useEffect(() => {
    if (repoId) loadMatches(repoId)
  }, [repoId])

  const toggleGrant = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const generateRoadmap = async () => {
    const target = inputId.trim()
    if (!target || selectedIds.length === 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.post(`${API_BASE}/api/repos/${target}/roadmap`, {
        funding_ids: selectedIds,
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate roadmap.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-400 mb-4">
            <span>🗺️</span> Funding Roadmap
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Your <span className="gradient-text">90-day plan</span> to funding
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Pick up to 5 target grants and our AI builds a week-by-week action plan
            tailored to what each specific funder wants to see.
          </p>
        </motion.div>

        {/* Repo ID input (if no URL param) */}
        {!repoId && (
          <motion.div className="mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex gap-2">
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadMatches()}
                placeholder="Enter your repo ID"
                className="flex-1 glass-card px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm bg-transparent"
              />
              <button
                onClick={() => loadMatches()}
                disabled={loadingMatches || !inputId.trim()}
                className="btn-primary shrink-0"
              >
                {loadingMatches ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : 'Load Matches'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Grant selector */}
        {matches.length > 0 && !result && (
          <motion.div className="glass-card p-5 mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-sm font-semibold text-white mb-1">Select target grants (up to 5)</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedIds.length}/5 selected</p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {matches.map(m => {
                const fs = m.funding_source
                const isSelected = selectedIds.includes(m.funding_id)
                return (
                  <button
                    key={m.funding_id}
                    onClick={() => toggleGrant(m.funding_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-500/40 bg-sky-500/10'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/3'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-sky-500 border-sky-500' : 'border-white/20'
                    }`}>
                      {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{fs?.name}</div>
                      <div className="text-xs text-slate-500">{fs?.category} · Score: {Math.round(m.match_score)}</div>
                    </div>
                    <div className="text-xs text-slate-500 shrink-0">
                      {fs?.max_amount ? `$${Math.round(fs.max_amount / 1000)}K` : ''}
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={generateRoadmap}
              disabled={selectedIds.length === 0 || loading}
              className="w-full mt-4 btn-primary disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Generating roadmap…
                </span>
              ) : `Generate 90-Day Roadmap for ${selectedIds.length} Grant${selectedIds.length !== 1 ? 's' : ''} →`}
            </button>
          </motion.div>
        )}

        {/* No matches prompt */}
        {!loadingMatches && matches.length === 0 && inputId && !result && (
          <div className="text-center text-slate-500 text-sm mb-6">
            No matches found.{' '}
            <Link to="/" className="text-sky-400 hover:underline">Analyze your repo first →</Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-4 animate-pulse">🗺️</div>
            <p>Building your 90-day funding roadmap…</p>
            <p className="text-xs text-slate-600 mt-2">This takes 10-15 seconds</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Header info */}
              <div className="glass-card p-5 mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {(result.target_grants || []).map(g => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">{g}</span>
                  ))}
                </div>
                <p className="text-sm text-slate-300">{result.summary}</p>
              </div>

              {/* Red flags */}
              {result.red_flags?.length > 0 && (
                <motion.div className="glass-card p-5 mb-6 border border-red-500/20" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <span>🚨</span> Fix These First
                  </h3>
                  <ul className="space-y-2">
                    {result.red_flags.map((f, i) => (
                      <li key={i} className="text-sm text-red-300/80 flex gap-2">
                        <span className="shrink-0">•</span>{f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Readiness assessment */}
              {result.readiness_assessment && (
                <motion.div className="glass-card p-5 mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><span>📊</span> Current Readiness</h3>
                  <p className="text-sm text-slate-400">{result.readiness_assessment}</p>
                </motion.div>
              )}

              {/* Timeline */}
              <h3 className="text-lg font-semibold text-white mb-4">90-Day Action Plan</h3>
              <div className="space-y-3 mb-8">
                {(result.milestones || []).map((ms, i) => (
                  <MilestoneCard key={ms.week || i} milestone={ms} index={i} />
                ))}
              </div>

              {/* Grant-specific tips */}
              {result.grant_specific_tips && Object.keys(result.grant_specific_tips).length > 0 && (
                <motion.div className="glass-card p-5 mb-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><span>🎯</span> Grant-Specific Tips</h3>
                  <div className="space-y-4">
                    {Object.entries(result.grant_specific_tips).map(([grant, tip]) => (
                      <div key={grant}>
                        <div className="text-xs font-semibold text-sky-400 mb-1">{grant}</div>
                        <p className="text-sm text-slate-400">{tip}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Estimated date + probability */}
              {(result.estimated_ready_date || result.success_probability) && (
                <motion.div className="grid sm:grid-cols-2 gap-4 mb-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {result.estimated_ready_date && (
                    <div className="glass-card p-4 text-center">
                      <div className="text-xl font-bold text-white">{result.estimated_ready_date}</div>
                      <div className="text-xs text-slate-500 mt-1">Estimated ready date</div>
                    </div>
                  )}
                  {result.success_probability && (
                    <div className="glass-card p-4 text-center">
                      <div className="text-sm font-medium text-emerald-400">{result.success_probability}</div>
                      <div className="text-xs text-slate-500 mt-1">Success probability</div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setResult(null)}
                  className="glass-card px-5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  ← Change Grants
                </button>
                {(repoId || inputId) && (
                  <>
                    <Link to={`/velocity/${repoId || inputId}`} className="glass-card px-5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                      ⚡ Velocity Dashboard
                    </Link>
                    <Link to={`/portfolio/${repoId || inputId}`} className="btn-primary">
                      💼 Optimize Portfolio →
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
