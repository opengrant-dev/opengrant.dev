import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138',
  Kotlin: '#A97BFF', Dart: '#00B4AB', 'C#': '#178600', Scala: '#c22d40',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883',
  Jupyter: '#DA5B0B', R: '#198CE7', Elixir: '#6e4a7e', Haskell: '#5e5086',
  Nix: '#7e7eff', Zig: '#ec915c', Lua: '#000080',
}

const SINCE_OPTIONS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
]

const TOP_LANGUAGES = [
  '', 'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java',
  'C++', 'C', 'Ruby', 'Swift', 'Kotlin', 'C#', 'Shell', 'Dart',
]

function LangDot({ lang }) {
  const color = LANG_COLORS[lang] || '#8b949e'
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: color }} />
      {lang}
    </span>
  )
}

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  )
}

function ForkIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
  )
}

function RepoCard({ repo, idx, onFindFunding, loading }) {
  const isLoading = loading === repo.full_name

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="glass-card p-5 flex flex-col gap-3 hover:border-sky-500/30 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={repo.avatar_url}
          alt={repo.owner}
          className="w-9 h-9 rounded-lg flex-shrink-0 border border-white/10"
        />
        <div className="min-w-0 flex-1">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:text-sky-400 transition-colors text-sm leading-tight block truncate"
          >
            {repo.full_name}
          </a>
          {repo.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {repo.description}
            </p>
          )}
        </div>
      </div>

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 4).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {t}
            </span>
          ))}
          {repo.topics.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-500">
              +{repo.topics.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        {repo.language && <LangDot lang={repo.language} />}
        <span className="flex items-center gap-1">
          <StarIcon /> {repo.stars.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <ForkIcon /> {repo.forks.toLocaleString()}
        </span>
        {repo.license && (
          <span className="text-slate-500">{repo.license}</span>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => onFindFunding(repo)}
        disabled={!!loading}
        className="mt-auto w-full btn-primary py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing…
          </>
        ) : (
          <>Find Funding <span className="opacity-70">→</span></>
        )}
      </button>
    </motion.div>
  )
}

export default function TrendingSpotlight() {
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [fetchLoading, setFetchLoading] = useState(false)
  const [findLoading, setFindLoading] = useState(null)
  const [error, setError] = useState('')
  const [since, setSince] = useState('weekly')
  const [language, setLanguage] = useState('')
  const [total, setTotal] = useState(0)

  const fetchTrending = async () => {
    setFetchLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ since })
      if (language) params.set('language', language)
      const res = await fetch(`/api/trending?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to fetch trending repos')
      }
      const data = await res.json()
      setRepos(data.repos || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setFetchLoading(false)
    }
  }

  useEffect(() => {
    fetchTrending()
  }, [since, language])

  const handleFindFunding = async (repo) => {
    setFindLoading(repo.full_name)
    try {
      const res = await fetch('/api/repos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: repo.html_url }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Submission failed')
      }
      const data = await res.json()
      navigate(`/results/${data.repo_id}`)
    } catch (e) {
      setError(e.message)
      setFindLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔥</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Trending <span className="gradient-text">Repo Spotlight</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-xl">
          Discover the hottest open source projects right now — and find funding opportunities for any of them with one click.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3 mb-8"
      >
        {/* Since selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {SINCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSince(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                since === opt.value
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Language selector */}
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500/50 cursor-pointer"
        >
          <option value="">All Languages</option>
          {TOP_LANGUAGES.filter(Boolean).map(lang => (
            <option key={lang} value={lang.toLowerCase()}>{lang}</option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={fetchTrending}
          disabled={fetchLoading}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${fetchLoading ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Refresh
        </button>

        {/* Count badge */}
        {total > 0 && !fetchLoading && (
          <span className="text-xs text-slate-500 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            {total} trending repos
          </span>
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
          >
            <span className="text-lg">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {fetchLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-full" />
                  <div className="h-2 bg-white/5 rounded w-2/3" />
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-14 bg-white/5 rounded-full" />
                <div className="h-5 w-16 bg-white/5 rounded-full" />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="h-3 w-16 bg-white/5 rounded" />
                <div className="h-3 w-12 bg-white/5 rounded" />
              </div>
              <div className="h-8 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Repos grid */}
      {!fetchLoading && repos.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo, idx) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              idx={idx}
              onFindFunding={handleFindFunding}
              loading={findLoading}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!fetchLoading && repos.length === 0 && !error && (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">🔍</div>
          <p>No trending repos found for this filter.</p>
          <button onClick={() => { setSince('weekly'); setLanguage('') }} className="mt-4 text-sky-400 hover:text-sky-300 text-sm">
            Clear filters
          </button>
        </div>
      )}

      {/* Info strip */}
      {!fetchLoading && repos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 text-xs text-slate-500 text-center"
        >
          Data powered by GitHub Search API · Click "Find Funding" to instantly analyze any repo and discover matching grants, hackathons & sponsorships
        </motion.div>
      )}
    </div>
  )
}
