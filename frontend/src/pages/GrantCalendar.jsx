/**
 * GrantCalendar — shows all funding deadlines in one place.
 * Supports filtering by category + type, and exports to .ics for Google Calendar.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStats } from '../hooks/useApi'
import { categoryClass, formatAmount } from '../utils/helpers'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const CATEGORIES = ['all', 'foundation', 'corporate', 'government', 'nonprofit', 'crypto', 'platform', 'vc']
const TYPES      = ['all', 'grant', 'sponsorship', 'accelerator']

const DEADLINE_TAG = {
  'Rolling':                   { label: 'Rolling',    class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'Rolling (quarterly rounds)':{ label: 'Quarterly',  class: 'text-sky-400    bg-sky-500/10    border-sky-500/20' },
  'Quarterly':                 { label: 'Quarterly',  class: 'text-sky-400    bg-sky-500/10    border-sky-500/20' },
  'Quarterly rounds':          { label: 'Quarterly',  class: 'text-sky-400    bg-sky-500/10    border-sky-500/20' },
  'Bi-annual':                 { label: 'Bi-annual',  class: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  'Annual':                    { label: 'Annual',     class: 'text-amber-400  bg-amber-500/10  border-amber-500/20' },
}

function deadlineTag(dl) {
  if (!dl) return { label: 'Unknown', class: 'text-slate-500 bg-white/5 border-white/10' }
  for (const [key, val] of Object.entries(DEADLINE_TAG)) {
    if (dl.toLowerCase().includes(key.toLowerCase())) return val
  }
  return { label: 'Specific', value: dl, class: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
}

function generateICS(sources) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const events = sources
    .filter(s => s.deadline && !s.deadline.toLowerCase().includes('rolling') && s.deadline !== 'Variable')
    .map((s, i) => {
      const uid = `fundmatcher-${s.id}-${i}@fundmatcher`
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${new Date().getFullYear()}0101`,
        `SUMMARY:${s.name} Grant Deadline`,
        `DESCRIPTION:${s.description?.slice(0, 200)?.replace(/\n/g, '\\n') || ''}`,
        `URL:${s.url}`,
        'END:VEVENT',
      ].join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FundMatcher//GrantCalendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Grant Deadlines — FundMatcher',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export default function GrantCalendar() {
  const [sources, setSources]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [catFilter, setCat]     = useState('all')
  const [typeFilter, setType]   = useState('all')
  const [search, setSearch]     = useState('')
  const [loaded, setLoaded]     = useState(false)
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' | 'list'

  const load = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/funding-sources`)
      setSources(res.data.funding_sources || [])
      setLoaded(true)
    } catch { }
    finally { setLoading(false) }
  }

  // Auto-load on mount
  if (!loaded && !loading) load()

  const filtered = (sources || []).filter(s => {
    if (catFilter !== 'all' && s.category !== catFilter) return false
    if (typeFilter !== 'all' && s.type !== typeFilter) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    // Rolling last, specific dates first
    const order = { 'Rolling': 99, 'Annual': 3, 'Bi-annual': 2, 'Quarterly': 1 }
    const oa = Object.entries(order).find(([k]) => a.deadline?.includes(k))?.[1] ?? 50
    const ob = Object.entries(order).find(([k]) => b.deadline?.includes(k))?.[1] ?? 50
    return oa - ob
  })

  const exportICS = () => {
    const ics  = generateICS(filtered)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'grant-deadlines.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Grouping for the Calendar Board view
  const grouped = {
    'Rolling': [],
    'Quarterly': [],
    'Bi-annual': [],
    'Annual / Specific': []
  }

  sorted.forEach(s => {
    const tag = deadlineTag(s.deadline)
    if (tag.label === 'Rolling') grouped['Rolling'].push(s)
    else if (tag.label === 'Quarterly') grouped['Quarterly'].push(s)
    else if (tag.label === 'Bi-annual') grouped['Bi-annual'].push(s)
    else grouped['Annual / Specific'].push(s)
  })

  const GrantCard = ({ s, tag, isBoard = false }) => (
    <div className={`glass-card p-4 ${isBoard ? 'mb-3 flex flex-col gap-3 hover:border-sky-500/30' : 'flex flex-wrap items-start gap-4'} transition-colors group`}>
      {/* Left/Top: deadline tag */}
      <div className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border self-start ${tag.class}`}>
        {tag.value || tag.label}
      </div>

      {/* Middle: info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`category-pill ${categoryClass(s.category)}`}>{s.category}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{s.type}</span>
        </div>
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-slate-200 group-hover:text-sky-400 transition-colors leading-tight block mb-1"
        >
          {s.name}
        </a>
        <p className={`text-xs text-slate-500 ${isBoard ? 'line-clamp-3' : 'line-clamp-2'} mt-1`}>{s.description}</p>
      </div>

      {/* Right/Bottom: amount */}
      <div className={`shrink-0 ${isBoard ? 'mt-auto pt-2 border-t border-white/5 flex items-center justify-between' : 'text-right'}`}>
        <div className="text-sm font-semibold text-emerald-400">{formatAmount(s.min_amount, s.max_amount)}</div>
        {(!isBoard && s.deadline && s.deadline !== 'Rolling') && (
          <div className="text-xs text-slate-500 mt-0.5">{s.deadline}</div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-[1400px] mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Grant Calendar
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Never miss a <span className="gradient-text">funding cycle</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Visualize {sources?.length || '50+'} funding opportunities across the year. Filter, track, and export to your calendar.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="glass-card p-4 mb-8 flex flex-wrap gap-3 items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* View Toggle */}
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 mr-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                viewMode === 'calendar' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              Calendar Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              List View
            </button>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search grants…"
            className="input-field flex-1 min-w-[150px] py-2 text-sm"
          />

          {/* Category */}
          <select
            value={catFilter}
            onChange={e => setCat(e.target.value)}
            className="bg-slate-900/80 border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={e => setType(e.target.value)}
            className="bg-slate-900/80 border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50"
          >
            {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>

          {/* Export */}
          <button
            onClick={exportICS}
            className="inline-flex items-center gap-2 text-sm border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 rounded-xl px-4 py-2 transition-all ml-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Export .ics
          </button>
        </motion.div>

        {loading && (
          <div className="text-center py-20 text-slate-400">
            <svg className="w-10 h-10 animate-spin text-sky-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading grant cycles…
          </div>
        )}

        {/* Views */}
        {!loading && sorted.length > 0 && (
          <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
              >
                {/* 4 Columns for the Calendar Board */}
                {Object.entries(grouped).map(([colName, items], colIdx) => (
                  <div key={colName} className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent opacity-50"></div>
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="font-bold text-slate-200">{colName}</h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-white/5">{items.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                      {items.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 text-sm border border-dashed border-white/5 rounded-xl">No grants in this cycle</div>
                      ) : (
                        items.map((s, i) => (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={s.id}>
                            <GrantCard s={s} tag={deadlineTag(s.deadline)} isBoard={true} />
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3 max-w-5xl mx-auto"
              >
                <div className="text-xs text-slate-600 mb-4 font-mono">{sorted.length} grants shown</div>
                {sorted.map((s, i) => (
                  <GrantCard key={s.id} s={s} tag={deadlineTag(s.deadline)} isBoard={false} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

