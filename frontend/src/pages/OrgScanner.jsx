/**
 * OrgScanner — scan all public repos in a GitHub org/user and rank by fundability.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const GRADE_COLOR = {
  'A+': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'A':  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'B':  'text-sky-400    bg-sky-500/10    border-sky-500/30',
  'C':  'text-amber-400  bg-amber-500/10  border-amber-500/30',
  'D':  'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'F':  'text-red-400    bg-red-500/10    border-red-500/20',
}

const POPULAR_ORGS = ['vercel', 'supabase', 'fastapi', 'vuejs', 'sveltejs', 'remix-run']

function RepoCard({ repo, index }) {
  const gc = GRADE_COLOR[repo.fundability_grade] || GRADE_COLOR['F']

  return (
    <motion.div
      className="glass-card p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="flex items-start gap-3">
        {/* Grade */}
        <div className={`shrink-0 w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-bold text-sm ${gc}`}>
          <span className="text-base leading-none">{repo.fundability_grade}</span>
          <span className="text-[9px] opacity-60">{repo.fundability_score}</span>
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={repo.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:text-sky-400 transition-colors text-sm leading-snug block truncate"
          >
            {repo.repo_name.split('/')[1] || repo.repo_name}
          </a>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{repo.description || 'No description'}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span>★ {repo.stars.toLocaleString()}</span>
        <span>⑂ {repo.forks}</span>
        {repo.language && <span className="text-slate-400">{repo.language}</span>}
        {repo.license && <span>{repo.license}</span>}
        {repo.critical_issues > 0 && (
          <span className="text-red-400">{repo.critical_issues} critical issue{repo.critical_issues > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Verdict */}
      <p className="text-xs text-slate-500 leading-relaxed">{repo.fundability_verdict}</p>

      {/* Actions */}
      <div className="flex gap-2 border-t border-white/5 pt-2">
        <Link
          to={`/?url=${encodeURIComponent(repo.github_url)}`}
          onClick={() => { sessionStorage.setItem('prefill_url', repo.github_url) }}
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          Get AI Matches →
        </Link>
        <a
          href={repo.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors ml-auto"
        >
          GitHub ↗
        </a>
      </div>
    </motion.div>
  )
}

export default function OrgScanner() {
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [result, setResult]     = useState(null)
  const [filter, setFilter]     = useState('all')

  const scan = async (orgName) => {
    const target = orgName || input.trim()
    if (!target) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.post(`${API_BASE}/api/org/scan`, { org: target })
      setResult(res.data)
      setInput(target)
    } catch (err) {
      setError(err.response?.data?.detail || 'Scan failed. Check the org name and try again.')
    } finally {
      setLoading(false)
    }
  }

  const repos = result?.repos || []
  const filtered = filter === 'all'
    ? repos
    : filter === 'ready'
    ? repos.filter(r => r.fundability_score >= 60)
    : repos.filter(r => r.critical_issues > 0)

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-400 mb-4">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            Org Scanner
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Scan an entire <span className="gradient-text">GitHub org</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Enter any GitHub organization or username — we'll analyze all their repos and rank them by funding potential instantly.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          className="max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-2">
            <div className="flex-1 glass-card flex items-center px-4 gap-3">
              <svg className="w-5 h-5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scan()}
                placeholder="vercel  /  microsoft  /  github.com/vuejs"
                className="flex-1 bg-transparent py-3 text-white placeholder-slate-600 focus:outline-none text-sm"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => scan()}
              disabled={loading || !input.trim()}
              className="btn-primary shrink-0"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : 'Scan Org'}
            </button>
          </div>

          {/* Popular orgs */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <span className="text-xs text-slate-600">Try:</span>
            {POPULAR_ORGS.map(o => (
              <button
                key={o}
                onClick={() => { setInput(o); scan(o) }}
                className="text-xs text-slate-500 hover:text-sky-400 transition-colors underline underline-offset-2"
              >
                {o}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-slate-400">
            <svg className="w-10 h-10 animate-spin text-sky-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p>Scanning repos…</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <AnimatePresence>
            {/* Org header */}
            <motion.div className="flex flex-wrap items-center gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {result.avatar_url && (
                <img src={result.avatar_url} alt={result.org} className="w-14 h-14 rounded-2xl" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{result.name || result.org}</h2>
                <p className="text-slate-400 text-sm">{result.description || ''}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {result.total_analyzed} repos analyzed · {repos.filter(r => r.fundability_score >= 60).length} funding-ready
                </p>
              </div>
            </motion.div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'all',     label: `All (${repos.length})` },
                { id: 'ready',   label: `Funding Ready (${repos.filter(r => r.fundability_score >= 60).length})` },
                { id: 'issues',  label: `Need Work (${repos.filter(r => r.critical_issues > 0).length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-sm px-4 py-2 rounded-xl border transition-all ${filter === f.id ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-500 hover:text-white'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Repo grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((repo, i) => (
                <RepoCard key={repo.repo_name} repo={repo} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
