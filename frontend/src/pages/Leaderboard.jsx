import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
}

function fmt(n) {
  if (!n) return '$0'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-sky-400' : 'text-amber-400'
  return <span className={`font-bold text-lg ${color}`}>{score}%</span>
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/leaderboard?limit=25')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load leaderboard'); setLoading(false) })
  }, [])

  const board = data?.leaderboard || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏆</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Funding <span className="gradient-text">Leaderboard</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm">
          {data ? `${data.total_repos_analyzed} repos analyzed — ranked by funding match quality` : 'Loading…'}
        </p>
      </motion.div>

      {/* Top 3 podium */}
      {!loading && board.length >= 3 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10">
          {[board[1], board[0], board[2]].map((repo, i) => {
            const rank = [2, 1, 3][i]
            const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
            const heights = ['h-28', 'h-36', 'h-24']
            return (
              <motion.div key={repo.repo_id} whileHover={{ y: -4 }}
                onClick={() => navigate(`/results/${repo.repo_id}`)}
                className={`glass-card p-4 text-center cursor-pointer hover:border-sky-500/30 transition-all flex flex-col items-center justify-end ${heights[i]}`}>
                <div className="text-2xl mb-1">{medals[rank]}</div>
                <div className="font-semibold text-white text-xs truncate w-full text-center">
                  {repo.repo_name.split('/')[1] || repo.repo_name}
                </div>
                <div className="text-sky-400 text-sm font-bold">{repo.top_score}%</div>
                <div className="text-slate-500 text-xs">{fmt(repo.total_potential_usd)}</div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse flex gap-4 items-center">
              <div className="w-8 h-8 bg-white/10 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
              <div className="h-8 w-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card p-6 text-center text-red-400">
          <div className="text-3xl mb-2">⚠️</div>
          <p>{error}</p>
          <p className="text-sm text-slate-500 mt-2">Scan some repos first to populate the leaderboard!</p>
        </div>
      )}

      {!loading && !error && board.length === 0 && (
        <div className="glass-card p-10 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-white font-semibold mb-2">Leaderboard is empty</h2>
          <p className="text-slate-400 text-sm mb-6">Scan some GitHub repos to see which ones are most fundable!</p>
          <button onClick={() => navigate('/')} className="btn-primary px-6 py-2">Scan Your First Repo →</button>
        </div>
      )}

      {!loading && board.length > 0 && (
        <div className="space-y-3">
          {board.map((repo, idx) => (
            <motion.div key={repo.repo_id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
              onClick={() => navigate(`/results/${repo.repo_id}`)}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-sky-500/30 transition-all group">
              <div className="w-10 text-center">
                {idx < 3
                  ? <span className="text-xl">{['🥇', '🥈', '🥉'][idx]}</span>
                  : <span className="text-slate-500 font-mono text-sm">#{idx + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm group-hover:text-sky-400 transition-colors truncate">
                    {repo.repo_name}
                  </span>
                  {repo.language && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: LANG_COLORS[repo.language] || '#8b949e' }} />
                      {repo.language}
                    </span>
                  )}
                </div>
                {repo.description && <p className="text-xs text-slate-500 truncate">{repo.description}</p>}
              </div>
              <div className="flex items-center gap-6 flex-shrink-0 text-center">
                <div><div className="text-xs text-slate-500">Top Match</div><ScoreBadge score={repo.top_score} /></div>
                <div><div className="text-xs text-slate-500">Matches</div><div className="font-semibold text-white">{repo.match_count}</div></div>
                <div className="hidden sm:block"><div className="text-xs text-slate-500">Potential</div><div className="font-semibold text-sky-400">{fmt(repo.total_potential_usd)}</div></div>
                <span className="text-slate-600 group-hover:text-sky-400 transition-colors">→</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && board.length > 0 && (
        <p className="text-center text-slate-600 text-xs mt-8">
          Rankings based on AI match scores · {data?.total_repos_analyzed} repos analyzed on this instance
        </p>
      )}
    </div>
  )
}
