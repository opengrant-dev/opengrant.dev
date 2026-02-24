import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_CONFIG = {
  crypto:      { label: 'Crypto & Web3',   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '₿' },
  government:  { label: 'Government',       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     icon: '🏛️' },
  corporate:   { label: 'Corporate',        color: 'text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/20',       icon: '🏢' },
  platform:    { label: 'Platform',         color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', icon: '🚀' },
  nonprofit:   { label: 'Non-Profit',       color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   icon: '💚' },
  foundation:  { label: 'Foundation',       color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: '🏆' },
  vc:          { label: 'VC / Accelerator', color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20',     icon: '⚡' },
  accelerator: { label: 'Accelerator',      color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20',     icon: '🎯' },
}

const TYPE_COLORS = {
  grant:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  hackathon:   'bg-violet-500/15 text-violet-400 border-violet-500/20',
  bounty:      'bg-red-500/15 text-red-400 border-red-500/20',
  sponsorship: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  accelerator: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  fellowship:  'bg-pink-500/15 text-pink-400 border-pink-500/20',
}

function fmt(n) {
  if (!n) return '$0'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

function FunderCard({ funder, idx }) {
  const cat = CATEGORY_CONFIG[funder.category] || { label: funder.category, color: 'text-slate-400', bg: 'bg-white/5 border-white/10', icon: '•' }
  const typeClass = TYPE_COLORS[funder.type] || 'bg-white/10 text-slate-400 border-white/10'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.025, 0.4) }}
      className="glass-card p-5 flex flex-col gap-3 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-sky-400 transition-colors line-clamp-2 flex-1">
          {funder.name}
        </h3>
        <span className="text-lg flex-shrink-0">{cat.icon}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeClass}`}>
          {funder.type}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
          {cat.label}
        </span>
        {funder.is_recurring && (
          <span className="text-xs px-2 py-0.5 rounded-full border bg-white/5 border-white/10 text-slate-400">
            🔄 Recurring
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{funder.description}</p>

      <div className="flex items-center justify-between text-xs mt-auto">
        <div>
          <div className="text-slate-500">Funding range</div>
          <div className="text-white font-semibold">{fmt(funder.min_amount)} – {fmt(funder.max_amount)}</div>
        </div>
        {funder.deadline && (
          <div className="text-right">
            <div className="text-slate-500">Deadline</div>
            <div className="text-slate-300">{funder.deadline}</div>
          </div>
        )}
      </div>

      {funder.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {funder.tags.slice(0, 4).map(t => (
            <span key={t} className="text-xs text-slate-600 bg-white/[0.03] px-1.5 py-0.5 rounded">#{t}</span>
          ))}
        </div>
      )}

      {funder.url && (
        <a href={funder.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 group/link">
          Visit website <span className="group-hover/link:translate-x-0.5 transition-transform">→</span>
        </a>
      )}
    </motion.div>
  )
}

const ALL_CATEGORIES = ['all', 'crypto', 'government', 'corporate', 'platform', 'nonprofit', 'foundation', 'vc', 'accelerator']
const ALL_TYPES = ['all', 'grant', 'hackathon', 'bounty', 'sponsorship', 'accelerator', 'fellowship']

export default function FunderDirectory() {
  const [funders, setFunders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('all')
  const [sortBy, setSortBy] = useState('max')

  useEffect(() => {
    fetch('/api/funding-sources')
      .then(r => r.json())
      .then(data => { setFunders(Array.isArray(data) ? data : data.funding_sources || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let f = funders
    if (search) {
      const q = search.toLowerCase()
      f = f.filter(x => x.name?.toLowerCase().includes(q) || x.description?.toLowerCase().includes(q) || x.tags?.some(t => t.toLowerCase().includes(q)))
    }
    if (category !== 'all') f = f.filter(x => x.category === category)
    if (type !== 'all') f = f.filter(x => x.type === type)
    if (sortBy === 'max') f = [...f].sort((a, b) => (b.max_amount || 0) - (a.max_amount || 0))
    if (sortBy === 'name') f = [...f].sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'type') f = [...f].sort((a, b) => a.type.localeCompare(b.type))
    return f
  }, [funders, search, category, type, sortBy])

  const totalPotential = filtered.reduce((s, f) => s + (f.max_amount || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💰</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Funder <span className="gradient-text">Directory</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm">
          {loading ? 'Loading…' : `${funders.length} funding sources worldwide — grants, hackathons, bug bounties & sponsorships`}
        </p>
      </motion.div>

      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Sources', value: funders.length, icon: '📊' },
            { label: 'Showing', value: filtered.length, icon: '🔍' },
            { label: 'Total Potential', value: `$${(funders.reduce((s, f) => s + (f.max_amount || 0), 0) / 1000000).toFixed(0)}M+`, icon: '💎' },
            { label: 'Filtered Potential', value: `$${(totalPotential / 1000000).toFixed(1)}M`, icon: '🎯' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search funders, tags, descriptions…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-sky-500/50 cursor-pointer">
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : CATEGORY_CONFIG[c]?.label || c}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-sky-500/50 cursor-pointer">
          {ALL_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-sky-500/50 cursor-pointer">
          <option value="max">Sort: Highest Amount</option>
          <option value="name">Sort: A → Z</option>
          <option value="type">Sort: By Type</option>
        </select>
      </motion.div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse h-60">
              <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
              <div className="flex gap-2 mb-3"><div className="h-5 w-16 bg-white/5 rounded-full" /><div className="h-5 w-20 bg-white/5 rounded-full" /></div>
              <div className="space-y-2"><div className="h-3 bg-white/5 rounded" /><div className="h-3 bg-white/5 rounded w-5/6" /></div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <AnimatePresence mode="wait">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((funder, idx) => (
              <FunderCard key={funder.id || funder.name} funder={funder} idx={idx} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">🔍</div>
          <p>No funders match your filters.</p>
          <button onClick={() => { setSearch(''); setCategory('all'); setType('all') }}
            className="mt-4 text-sky-400 hover:text-sky-300 text-sm">Clear all filters</button>
        </div>
      )}
    </div>
  )
}
