/**
 * Applications — Grant application pipeline tracker.
 * Uses localStorage so data persists across sessions (no backend needed).
 *
 * Pipeline stages:
 *   saved → applied → following_up → won / lost
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatAmount, categoryClass, scoreClass, scoreLabel } from '../utils/helpers'

const STAGES = [
  { id: 'saved',        label: 'Saved',        color: 'text-slate-400',  bg: 'bg-slate-500/10  border-slate-500/20' },
  { id: 'applied',      label: 'Applied',       color: 'text-sky-400',    bg: 'bg-sky-500/10    border-sky-500/20'   },
  { id: 'following_up', label: 'Following Up',  color: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/20' },
  { id: 'won',          label: 'Won 🎉',         color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20'},
  { id: 'lost',         label: 'Lost',          color: 'text-red-400',    bg: 'bg-red-500/10    border-red-500/20'   },
]

function useTracker() {
  const [apps, setApps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fundmatcher_tracker') || '[]')
    } catch { return [] }
  })

  const save = (updated) => {
    setApps(updated)
    localStorage.setItem('fundmatcher_tracker', JSON.stringify(updated))
  }

  const update = (id, changes) => save(apps.map(a => a.id === id ? { ...a, ...changes } : a))
  const remove  = (id) => save(apps.filter(a => a.id !== id))

  return { apps, update, remove }
}

function NotesEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value || '')

  const handleSave = () => {
    onSave(text)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add notes…"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={handleSave} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Save</button>
          <button onClick={() => { setText(value || ''); setEditing(false) }} className="text-xs text-slate-500 hover:text-slate-400">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors text-left"
    >
      {value ? <span className="text-slate-400">{value}</span> : '+ Add notes'}
    </button>
  )
}

function AppCard({ app, onUpdate, onRemove }) {
  const currentStage = STAGES.find(s => s.id === app.status) || STAGES[0]
  const nextStages = STAGES.filter(s => s.id !== app.status && s.id !== 'lost')

  return (
    <motion.div
      layout
      className="glass-card p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentStage.bg} ${currentStage.color}`}>
              {currentStage.label}
            </span>
            <span className={`category-pill ${categoryClass(app.category)}`}>
              {app.category}
            </span>
          </div>
          <div className="font-semibold text-white text-sm leading-snug">{app.fundingName}</div>
          <Link
            to={`/results/${app.repoId}`}
            className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
          >
            {app.repoName}
          </Link>
        </div>
        <div className={`shrink-0 text-center rounded-xl px-2 py-1 ${scoreClass(app.matchScore)}`}>
          <div className="text-sm font-bold">{Math.round(app.matchScore)}</div>
          <div className="text-[9px] opacity-70">score</div>
        </div>
      </div>

      {/* Amount */}
      <div className="text-xs text-slate-400">
        {formatAmount(app.minAmount, app.maxAmount)}
      </div>

      {/* Notes */}
      <NotesEditor value={app.notes} onSave={notes => onUpdate(app.id, { notes })} />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap border-t border-white/5 pt-3">
        {/* Move to next stage */}
        <div className="flex gap-1 flex-wrap flex-1">
          {nextStages.slice(0, 3).map(s => (
            <button
              key={s.id}
              onClick={() => onUpdate(app.id, { status: s.id, ...(s.id === 'applied' ? { dateApplied: new Date().toISOString() } : {}) })}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${s.bg} ${s.color} hover:opacity-80`}
            >
              → {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <a
            href={app.fundingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            Apply ↗
          </a>
          <button onClick={() => onRemove(app.id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors">
            Remove
          </button>
        </div>
      </div>

      {/* Date info */}
      <div className="text-[10px] text-slate-700">
        Saved {new Date(app.dateAdded).toLocaleDateString()}
        {app.dateApplied && ` · Applied ${new Date(app.dateApplied).toLocaleDateString()}`}
      </div>
    </motion.div>
  )
}

export default function Applications() {
  const { apps, update, remove } = useTracker()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)
  const counts = STAGES.reduce((acc, s) => {
    acc[s.id] = apps.filter(a => a.status === s.id).length
    return acc
  }, {})

  const totalPotential = apps
    .filter(a => a.status !== 'lost')
    .reduce((sum, a) => sum + (a.maxAmount || a.minAmount || 0), 0)

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Application Tracker</h1>
            <p className="text-slate-400 text-sm">
              {apps.length} grant{apps.length !== 1 ? 's' : ''} tracked
              {totalPotential > 0 && ` · Up to $${(totalPotential / 1000).toFixed(0)}k potential funding`}
            </p>
          </div>
          <Link to="/" className="btn-primary py-2 px-4 text-sm">
            + Find More Grants
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="space-y-6">
            <div className="glass-card p-10 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-semibold text-white mb-2">Your tracker is empty</h2>
              <p className="text-slate-400 text-sm mb-6">
                Once you find funding matches, click <strong className="text-white">Save</strong> on any match to track it here.
              </p>
              <Link to="/" className="btn-primary">Find My Funding Now →</Link>
            </div>

            {/* Beginner how-to */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-4">How the tracker works</h3>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { icon: '🔍', step: '1', title: 'Scan your repo', desc: 'Paste your GitHub link on the Home page' },
                  { icon: '💰', step: '2', title: 'Find matches', desc: 'AI finds grants & hackathons that fit you' },
                  { icon: '💾', step: '3', title: 'Save grants', desc: 'Click Save on any grant you want to apply for' },
                  { icon: '✅', step: '4', title: 'Track progress', desc: 'Move from Saved → Applied → Won!' },
                ].map(({ icon, step, title, desc }) => (
                  <div key={step} className="text-center">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Step {step}</div>
                    <div className="text-sm font-medium text-white mb-1">{title}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stage filter tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`text-sm px-4 py-2 rounded-xl border transition-all ${filter === 'all' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-500 hover:text-white'}`}
              >
                All ({apps.length})
              </button>
              {STAGES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setFilter(s.id)}
                  className={`text-sm px-4 py-2 rounded-xl border transition-all ${filter === s.id ? `${s.bg} ${s.color} border-current` : 'border-white/5 text-slate-500 hover:text-white'}`}
                >
                  {s.label} {counts[s.id] > 0 && `(${counts[s.id]})`}
                </button>
              ))}
            </div>

            {/* Cards grid */}
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  className="text-center py-16 text-slate-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  No applications in this stage yet.
                </motion.div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map(app => (
                    <AppCard
                      key={app.id}
                      app={app}
                      onUpdate={update}
                      onRemove={remove}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Stats bar */}
            {apps.length > 0 && (
              <motion.div
                className="mt-10 glass-card p-5 grid grid-cols-2 sm:grid-cols-5 gap-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {STAGES.map(s => (
                  <div key={s.id} className="text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{counts[s.id]}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
