/**
 * Portfolio — optimal grant stack optimizer.
 * Route: /portfolio/:repoId
 */
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

function formatUSD(n) {
  if (!n) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n.toLocaleString()}`
}

function ScoreBar({ score }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-sky-500' : score >= 30 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-slate-500 w-7 text-right">{Math.round(score)}</span>
    </div>
  )
}

function GrantCard({ grant, step, isSelected = true }) {
  const borderColor = isSelected ? 'border-sky-500/30' : 'border-red-500/20 opacity-60'
  const amtText = grant.max_amount
    ? `${formatUSD(grant.min_amount)} – ${formatUSD(grant.max_amount)}`
    : grant.min_amount ? `from ${formatUSD(grant.min_amount)}` : 'Variable'

  return (
    <motion.div
      className={`glass-card p-4 border ${borderColor}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: step * 0.06 }}
    >
      <div className="flex items-start gap-3">
        {step !== undefined && isSelected && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm font-bold">
            {step}
          </div>
        )}
        {!isSelected && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-sm">
            ✗
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white text-sm">{grant.name}</span>
            <span className="text-emerald-400 text-sm font-medium shrink-0">{amtText}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-600">Match score</span>
            <div className="flex-1">
              <ScoreBar score={grant.match_score || grant.score || 0} />
            </div>
          </div>
          {grant.effort_weeks && (
            <div className="text-xs text-slate-600 mt-1">
              ~{grant.effort_weeks} week{grant.effort_weeks !== 1 ? 's' : ''} to apply
            </div>
          )}
          {!isSelected && grant.excluded_reason && (
            <div className="text-xs text-red-400 mt-1">{grant.excluded_reason}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Portfolio() {
  const { repoId } = useParams()
  const [inputId, setInputId] = useState(repoId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const fetchPortfolio = async (id) => {
    const target = id || inputId.trim()
    if (!target) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.get(`${API_BASE}/api/repos/${target}/portfolio`)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to optimize portfolio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (repoId) fetchPortfolio(repoId)
  }, [repoId])

  const orderMap = {}
  if (result?.application_order) {
    result.application_order.forEach((name, i) => { orderMap[name] = i + 1 })
  }

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400 mb-4">
            <span>💼</span> Portfolio Optimizer
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Your optimal <span className="gradient-text">grant stack</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            We score all your matches, resolve funder conflicts, and build the maximum-value
            application stack in the right order.
          </p>
        </motion.div>

        {/* Input */}
        {!repoId && (
          <motion.div className="max-w-xl mx-auto mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex gap-2">
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchPortfolio()}
                placeholder="Enter your repo ID"
                className="flex-1 glass-card px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm bg-transparent"
              />
              <button onClick={() => fetchPortfolio()} disabled={loading || !inputId.trim()} className="btn-primary shrink-0">
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : 'Optimize'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-xl mx-auto mb-6 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
            {error.includes('analyzed') && (
              <div className="mt-2">
                <Link to="/" className="text-sky-400 hover:underline text-xs">→ Submit your repo for analysis first</Link>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-4xl mb-4 animate-pulse">💼</div>
            <p>Building your optimal grant stack…</p>
          </div>
        )}

        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Total potential */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Potential', value: formatUSD(result.total_potential_usd), color: 'text-emerald-400', icon: '💰' },
                  { label: 'Grants Selected', value: result.grants_selected, color: 'text-sky-400', icon: '✅' },
                  { label: 'Grants Reviewed', value: result.total_grants_considered, color: 'text-slate-400', icon: '🔍' },
                ].map(({ label, value, color, icon }) => (
                  <motion.div key={label} className="glass-card p-4 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Strategy notes */}
              {result.strategy_notes?.length > 0 && (
                <motion.div className="glass-card p-5 mb-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><span>🧠</span> Strategy</h3>
                  <ul className="space-y-2">
                    {result.strategy_notes.map((note, i) => (
                      <li key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-sky-500 shrink-0 mt-0.5">→</span>{note}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Conflict warnings */}
              {result.conflict_warnings?.length > 0 && (
                <motion.div className="glass-card p-5 mb-8 border border-amber-500/20" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2"><span>⚠️</span> Conflict Warnings</h3>
                  <ul className="space-y-2">
                    {result.conflict_warnings.map((w, i) => (
                      <li key={i} className="text-sm text-amber-300/80 flex gap-2">
                        <span className="shrink-0">•</span>{w}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Optimal stack — application order */}
              <h3 className="text-lg font-semibold text-white mb-1">Optimal Application Order</h3>
              <p className="text-sm text-slate-500 mb-4">Apply in this order to maximize ROI and avoid overlapping reviewer fatigue.</p>
              <div className="space-y-3 mb-8">
                {(result.application_order || []).map((name, i) => {
                  const grant = (result.optimal_stack || []).find(g => g.name === name) || { name }
                  return <GrantCard key={name} grant={grant} step={i + 1} isSelected={true} />
                })}
              </div>

              {/* Excluded grants */}
              {result.excluded?.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-white mb-1">Excluded Due to Conflicts</h3>
                  <p className="text-sm text-slate-500 mb-4">Consider these after receiving results from conflicting grants.</p>
                  <div className="space-y-3 mb-8">
                    {result.excluded.map((g, i) => (
                      <GrantCard key={g.name} grant={g} step={i} isSelected={false} />
                    ))}
                  </div>
                </>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 justify-center">
                {result.repo_id && (
                  <>
                    <Link to={`/dna/${result.repo_id}`} className="glass-card px-5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                      🧬 DNA Match
                    </Link>
                    <Link to={`/velocity/${result.repo_id}`} className="glass-card px-5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                      ⚡ Velocity Dashboard
                    </Link>
                    <Link to={`/results/${result.repo_id}`} className="btn-primary">
                      View All Matches →
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
