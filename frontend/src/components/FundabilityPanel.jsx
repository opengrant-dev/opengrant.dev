/**
 * FundabilityPanel — shows a repo's fundability score with improvement tips.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'

const IMPACT_COLORS = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low:      'text-slate-400 bg-white/5 border-white/10',
}

const GRADE_COLORS = {
  'A+': 'text-emerald-400',
  'A':  'text-emerald-400',
  'B':  'text-sky-400',
  'C':  'text-amber-400',
  'D':  'text-orange-400',
  'F':  'text-red-400',
}

function ScoreBar({ label, score, max }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function FundabilityPanel({ data, loading, error }) {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return (
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded shimmer" />
            <div className="h-2 w-48 rounded shimmer" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) return null

  const gradeColor = GRADE_COLORS[data.grade] || 'text-slate-400'
  const cats = data.categories || {}
  const tips = data.tips || []
  const criticalCount = data.tip_counts?.critical || 0
  const highCount = data.tip_counts?.high || 0

  return (
    <motion.div
      className="glass-card mb-6 overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Grade circle */}
        <div className={`shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-bold ${gradeColor} border-current bg-current/10`}>
          <span className="text-xl leading-none">{data.grade}</span>
          <span className="text-[10px] opacity-70">{data.total_score}/100</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white font-semibold">Fundability Score</span>
            {criticalCount > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">
                {criticalCount} critical issue{criticalCount > 1 ? 's' : ''}
              </span>
            )}
            {criticalCount === 0 && highCount > 0 && (
              <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-full px-2 py-0.5">
                {highCount} high priority tip{highCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 truncate">{data.verdict}</p>
        </div>

        <svg
          className={`shrink-0 w-5 h-5 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/5"
        >
          {/* Category scores */}
          <div className="p-5 grid sm:grid-cols-2 gap-x-8 gap-y-3 border-b border-white/5">
            {Object.entries(cats).map(([name, { score, max }]) => (
              <ScoreBar key={name} label={name} score={score} max={max} />
            ))}
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="p-5 space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Improvement Tips ({tips.length})
              </div>
              {tips.map((tip, i) => (
                <motion.div
                  key={i}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 ${IMPACT_COLORS[tip.impact]}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="shrink-0 mt-0.5">
                    {tip.impact === 'critical' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                    {tip.impact === 'high' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    )}
                    {(tip.impact === 'medium' || tip.impact === 'low') && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-70 mb-0.5">
                      {tip.area} · {tip.impact}
                    </div>
                    <div className="text-sm leading-relaxed">{tip.tip}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {tips.length === 0 && (
            <div className="p-5 text-center text-emerald-400 text-sm">
              🎉 No issues found — your repo is highly fundable!
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
