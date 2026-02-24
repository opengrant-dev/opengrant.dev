/**
 * VelocityDashboard — track funding readiness velocity.
 * Route: /velocity/:repoId
 */
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

function VelocityGauge({ score }) {
  const pct = Math.min(100, Math.max(0, score))
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#0ea5e9' : pct >= 25 ? '#f59e0b' : '#ef4444'
  const label = pct >= 70 ? 'High Velocity' : pct >= 45 ? 'Building' : pct >= 25 ? 'Early Stage' : 'Needs Work'

  return (
    <div className="flex flex-col items-center">
      {/* Gauge arc */}
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Track */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" strokeLinecap="round" />
        {/* Value */}
        <path
          d={`M 20 100 A 80 80 0 0 1 ${20 + 160 * pct / 100} ${100 - Math.sin(Math.PI * pct / 100) * 80}`}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
        {/* Score text */}
        <text x="100" y="90" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">{pct}</text>
        <text x="100" y="108" textAnchor="middle" fill="#64748b" fontSize="11">{label}</text>
      </svg>
    </div>
  )
}

function BenchmarkBar({ label, yourValue, avgValue, unit = '' }) {
  const pct = avgValue > 0 ? Math.min(200, Math.round((yourValue / avgValue) * 100)) : 0
  const displayPct = Math.min(100, pct)
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-sky-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = pct >= 100 ? 'text-emerald-400' : pct >= 60 ? 'text-sky-400' : pct >= 30 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <div className="flex-1">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${displayPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="text-right shrink-0 w-32">
        <span className={`text-xs font-medium ${textColor}`}>{yourValue.toLocaleString()}{unit}</span>
        <span className="text-xs text-slate-600"> / avg {avgValue.toLocaleString()}{unit}</span>
      </div>
    </div>
  )
}

function PredictionCard({ item, index }) {
  const isReady = item.status === 'ready_now'
  const weeks = item.weeks_away

  return (
    <motion.div
      className={`glass-card p-4 border ${isReady ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white text-sm">{item.grant}</div>
          <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
          {item.gaps?.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {item.gaps.map((g, i) => (
                <li key={i} className="text-xs text-amber-400 flex gap-1">
                  <span>·</span>{g}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="shrink-0 text-right">
          {isReady ? (
            <span className="text-emerald-400 font-bold text-sm">Ready now ✓</span>
          ) : (
            <div>
              <div className="text-2xl font-bold text-white">{weeks === '500+' ? '500+' : weeks}</div>
              <div className="text-xs text-slate-500">weeks away</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function VelocityDashboard() {
  const { repoId } = useParams()
  const [inputId, setInputId] = useState(repoId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const fetchVelocity = async (id) => {
    const target = id || inputId.trim()
    if (!target) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.get(`${API_BASE}/api/repos/${target}/velocity`)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch velocity data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (repoId) fetchVelocity(repoId)
  }, [repoId])

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-sm text-yellow-400 mb-4">
            <span>⚡</span> Velocity Dashboard
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Track your <span className="gradient-text">funding readiness</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            See how fast your project is growing, benchmark against funded OSS averages,
            and predict exactly when you'll qualify for each grant.
          </p>
        </motion.div>

        {/* Input */}
        {!repoId && (
          <motion.div className="max-w-xl mx-auto mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex gap-2">
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchVelocity()}
                placeholder="Enter your repo ID"
                className="flex-1 glass-card px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm bg-transparent"
              />
              <button onClick={() => fetchVelocity()} disabled={loading || !inputId.trim()} className="btn-primary shrink-0">
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : 'Calculate'}
              </button>
            </div>
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
            <div className="text-4xl mb-4 animate-pulse">⚡</div>
            <p>Calculating velocity metrics…</p>
          </div>
        )}

        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {result.repo_name && (
                <p className="text-center text-slate-400 text-sm mb-6">
                  Results for <span className="text-white font-medium">{result.repo_name}</span>
                </p>
              )}

              {/* Velocity Gauge + Score breakdown */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <motion.div className="glass-card p-6 flex flex-col items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <VelocityGauge score={result.velocity_score} />
                  <div className="text-xs text-slate-500 mt-2">Velocity Score</div>
                </motion.div>

                <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h3 className="text-sm font-semibold text-white mb-4">Score Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(result.score_breakdown || {}).map(([dim, val]) => {
                      const color = val >= 70 ? 'bg-emerald-500' : val >= 45 ? 'bg-sky-500' : val >= 25 ? 'bg-amber-500' : 'bg-red-500'
                      return (
                        <div key={dim} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-20 capitalize">{dim}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${color} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{val}</span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Key metrics */}
              <motion.div className="glass-card p-5 mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Project Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: '⭐ Stars', value: result.metrics?.stars?.toLocaleString() },
                    { label: '⑂ Forks', value: result.metrics?.forks?.toLocaleString() },
                    { label: '👥 Contributors', value: result.metrics?.contributors },
                    { label: '📝 Commits/wk', value: result.metrics?.commits_per_week },
                    { label: '📅 Age', value: `${result.metrics?.age_years?.toFixed(1)}y` },
                    { label: '📋 License', value: result.metrics?.has_license ? '✓ Yes' : '✗ No' },
                    { label: '📖 README', value: result.metrics?.has_readme ? '✓ Yes' : '✗ No' },
                    { label: '🌐 Homepage', value: result.metrics?.has_homepage ? '✓ Yes' : '✗ No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-lg font-bold text-white">{value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Benchmarks vs funded averages */}
              <motion.div className="glass-card p-5 mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Benchmark vs Funded Project Averages</h3>
                <div className="space-y-3">
                  {Object.entries(result.benchmarks || {}).map(([key, data]) => (
                    <BenchmarkBar
                      key={key}
                      label={key.replace(/_/g, ' ')}
                      yourValue={data.your_value}
                      avgValue={data.funded_avg}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Quick wins — already eligible */}
              {result.quick_wins?.length > 0 && (
                <motion.div className="glass-card p-5 mb-6 border border-emerald-500/20" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <span>✅</span> Grants You Can Apply To Right Now
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.quick_wins.map(qw => (
                      <span key={qw.grant} className="text-sm px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        {qw.grant}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Predictions */}
              <h3 className="text-lg font-semibold text-white mb-1">Funding Readiness Timeline</h3>
              <p className="text-sm text-slate-500 mb-4">At your current growth rate, here's when you'll qualify for each grant:</p>
              <div className="space-y-3 mb-8">
                {(result.predictions || []).map((pred, i) => (
                  <PredictionCard key={pred.grant} item={pred} index={i} />
                ))}
              </div>

              {/* Improvement tips */}
              {result.improvement_tips?.length > 0 && (
                <motion.div className="glass-card p-5 mb-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span>🚀</span> Top Actions to Boost Velocity
                  </h3>
                  <ul className="space-y-2">
                    {result.improvement_tips.map((tip, i) => (
                      <li key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-sky-500 shrink-0 mt-0.5">{i + 1}.</span>{tip}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 justify-center">
                {result.repo_id && (
                  <>
                    <Link to={`/roadmap/${result.repo_id}`} className="btn-primary">
                      🗺️ Build 90-Day Roadmap →
                    </Link>
                    <Link to={`/portfolio/${result.repo_id}`} className="glass-card px-5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                      💼 Optimize Portfolio
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
