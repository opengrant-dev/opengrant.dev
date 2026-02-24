import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const COMMANDS = [
  { icon: '🏠', label: 'Home — Find Funding',        path: '/' },
  { icon: '🔥', label: 'Trending — Hot Repos',        path: '/trending' },
  { icon: '📋', label: 'My Tracker',                  path: '/applications' },
  { icon: '📅', label: 'Deadline Calendar',            path: '/calendar' },
  { icon: '🔍', label: 'Org Scanner',                  path: '/org' },
  { icon: '🗺️', label: 'Dependency Map',              path: '/dependencies' },
  { icon: '🧬', label: 'DNA Match',                    path: '/dna' },
  { icon: '💼', label: 'Portfolio Optimizer',          path: '/portfolio' },
  { icon: '⚡', label: 'Velocity Dashboard',           path: '/velocity' },
  { icon: '🗺️', label: '90-Day Roadmap',              path: '/roadmap' },
  { icon: '💰', label: 'Funder Directory',             path: '/funders' },
  { icon: '🏆', label: 'Leaderboard — Top Repos',     path: '/leaderboard' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )

  const go = useCallback((path) => {
    navigate(path)
    setOpen(false)
    setQuery('')
    setIdx(0)
  }, [navigate])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
        setIdx(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => { setIdx(0) }, [query])

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[idx]) go(filtered[idx].path)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-start justify-center pt-20 px-4"
          style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
              <span className="text-slate-500 text-lg">🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search pages, tools…"
                className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
              />
              <kbd className="text-xs text-slate-600 border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">No results</div>
              )}
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.path}
                  onClick={() => go(cmd.path)}
                  onMouseEnter={() => setIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                    i === idx
                      ? 'bg-sky-500/15 text-sky-400'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base w-6 text-center">{cmd.icon}</span>
                  <span>{cmd.label}</span>
                  {i === idx && <span className="ml-auto text-sky-500/50 text-xs">↵</span>}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5 flex gap-4 text-xs text-slate-600">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
              <span className="ml-auto">Ctrl+K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
