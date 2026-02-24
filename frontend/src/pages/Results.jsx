import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRepoStatus, useMatches, useFundability, useGenerateApplication } from '../hooks/useApi'
import {
  scoreClass, scoreLabel, formatAmount,
  categoryClass, capitalize, buildShareUrl, formatNumber, truncate,
} from '../utils/helpers'
import FundabilityPanel from '../components/FundabilityPanel'
import ApplicationModal from '../components/ApplicationModal'
import BadgeCard from '../components/BadgeCard'

// ── Tracker helpers (localStorage) ──────────────────────────────────────────
function getTracker() {
  try { return JSON.parse(localStorage.getItem('fundmatcher_tracker') || '[]') } catch { return [] }
}
function saveToTracker(entry) {
  const existing = getTracker()
  const dupe = existing.find(e => e.repoId === entry.repoId && e.fundingId === entry.fundingId)
  if (dupe) return false
  localStorage.setItem('fundmatcher_tracker', JSON.stringify([...existing, { ...entry, id: crypto.randomUUID(), dateAdded: new Date().toISOString(), dateApplied: null, notes: '', status: 'saved' }]))
  return true
}

// ── Small sub-components ────────────────────────────────────────────────────

function Spinner({ label = 'Analyzing…' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
      <svg className="w-10 h-10 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  )
}

function StatPill({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <span className="text-slate-500">{icon}</span>
      <span className="font-semibold">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  )
}

function MatchCard({ match, index, repoId, repoData }) {
  const { funding_source: fs, match_score, reasoning, strengths = [], gaps = [], application_tips } = match
  const { generate, loading: genLoading } = useGenerateApplication()
  const [appData, setAppData] = useState(null)
  const [saved, setSaved] = useState(() => {
    const tracker = getTracker()
    return tracker.some(e => e.repoId === repoId && e.fundingId === fs.id)
  })

  const handleGenerate = async () => {
    const result = await generate(repoId, fs.id)
    if (result) setAppData(result)
  }

  const handleSaveToTracker = () => {
    const added = saveToTracker({
      repoId,
      repoName: repoData?.repo_name || repoId,
      fundingId: fs.id,
      fundingName: fs.name,
      fundingUrl: fs.url,
      category: fs.category,
      matchScore: match_score,
      minAmount: fs.min_amount,
      maxAmount: fs.max_amount,
    })
    if (added) setSaved(true)
  }

  return (
    <motion.div
      className="glass-card p-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`category-pill ${categoryClass(fs.category)}`}>
              {fs.category}
            </span>
            <span className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 capitalize">
              {fs.type}
            </span>
            {fs.is_recurring && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                Recurring
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white truncate">{fs.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{truncate(fs.description, 140)}</p>
        </div>

        {/* Score badge */}
        <div className={`shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl ${scoreClass(match_score)}`}>
          <span className="text-2xl font-bold">{Math.round(match_score)}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">score</span>
        </div>
      </div>

      {/* Amount + deadline */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-300">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span className="font-medium">{formatAmount(fs.min_amount, fs.max_amount)}</span>
        </div>
        {fs.deadline && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{fs.deadline}</span>
          </div>
        )}
        <div className="ml-auto">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${scoreClass(match_score)}`}>
            {scoreLabel(match_score)}
          </span>
        </div>
      </div>

      {/* Tags */}
      {fs.focus_areas?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fs.focus_areas.map(tag => (
            <span key={tag} className="text-xs bg-white/5 border border-white/10 text-slate-400 rounded-full px-2.5 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Reasoning */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-sm text-slate-300 leading-relaxed">{reasoning}</p>
      </div>

      {/* Strengths + Gaps */}
      {(strengths.length > 0 || gaps.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {strengths.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Strengths</div>
              <ul className="space-y-1">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {gaps.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Gaps</div>
              <ul className="space-y-1">
                {gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Application tips */}
      {application_tips && (
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4">
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1.5">Application Tips</div>
          <p className="text-sm text-slate-300 leading-relaxed">{application_tips}</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="border-t border-white/5 pt-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2">
          {/* Generate Application */}
          <button
            onClick={handleGenerate}
            disabled={genLoading}
            className="inline-flex items-center gap-1.5 text-sm bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 rounded-xl px-3 py-2 transition-all disabled:opacity-50"
          >
            {genLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Writing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Write Application
              </>
            )}
          </button>

          {/* Save to Tracker */}
          <button
            onClick={handleSaveToTracker}
            disabled={saved}
            className={`inline-flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 border transition-all ${saved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default' : 'bg-white/5 border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30'}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {saved ? <polyline points="20 6 9 17 4 12"/> : <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>}
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <a
          href={fs.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary py-2 px-5 text-sm"
        >
          Apply Now
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
          </svg>
        </a>
      </div>

      {/* Application modal */}
      {appData && (
        <ApplicationModal
          app={appData}
          fundingName={fs.name}
          onClose={() => setAppData(null)}
          onSaveToTracker={() => { handleSaveToTracker(); setAppData(null) }}
        />
      )}
    </motion.div>
  )
}

// ── Main Results page ────────────────────────────────────────────────────────

export default function Results() {
  const { repoId } = useParams()
  const { repo, loading: repoLoading, error: repoError } = useRepoStatus(repoId)
  const isReady = repo?.status === 'analyzed'
  const { matches, loading: matchesLoading, error: matchesError } = useMatches(repoId, isReady)
  const { data: fundability, loading: fundLoading } = useFundability(repoId, isReady)

  const isPending = !repo || repo.status === 'pending'
  const isError = repo?.status === 'error' || repoError || matchesError
  const topics = Array.isArray(repo?.topics) ? repo.topics : []

  // Share URL using top match
  const topMatch = matches[0]
  const shareUrl = repo && topMatch
    ? buildShareUrl(repo.repo_name, Math.round(topMatch.match_score), topMatch.funding_source?.name)
    : null

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* ── Breadcrumb ── */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-400 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to home
          </Link>
        </div>

        {/* ── Error state ── */}
        {isError && (
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Analysis Failed</h2>
            <p className="text-slate-400 mb-6 text-sm">
              {repo?.error_message || repoError || matchesError || 'Something went wrong during analysis.'}
            </p>
            <Link to="/" className="btn-primary">
              Try Another Repo
            </Link>
          </div>
        )}

        {/* ── Pending / loading ── */}
        {!isError && isPending && (
          <div className="glass-card p-12 text-center">
            <Spinner label="AI is scanning your repo…" />
            <p className="text-slate-500 text-sm mt-3">This takes 15–30 seconds.</p>
            <div className="mt-6 grid sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto">
              {[
                { icon: '📂', text: 'Reading your README and code' },
                { icon: '🔍', text: 'Checking 200+ funding sources' },
                { icon: '🤖', text: 'AI matching to your project' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 rounded-xl px-3 py-2">
                  <span className="text-base">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {!isError && !isPending && repo && (
          <AnimatePresence>
            {/* Repo info card */}
            <motion.div
              key="repo-card"
              className="glass-card p-6 mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <a
                      href={repo.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold text-white hover:text-sky-400 transition-colors truncate"
                    >
                      {repo.repo_name}
                    </a>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-slate-400 mb-3">{truncate(repo.description, 160)}</p>
                  )}
                  <div className="flex flex-wrap gap-4">
                    <StatPill icon="★" value={formatNumber(repo.stars)} label="stars" />
                    <StatPill icon="⑂" value={formatNumber(repo.forks)} label="forks" />
                    {repo.language && <StatPill icon="◎" value={repo.language} label="" />}
                    {repo.contributors_count > 0 && (
                      <StatPill icon="👥" value={formatNumber(repo.contributors_count)} label="contributors" />
                    )}
                    {repo.license_name && (
                      <StatPill icon="⚖" value={repo.license_name} label="" />
                    )}
                  </div>
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {topics.map(t => (
                        <span key={t} className="text-xs bg-white/5 border border-white/10 text-slate-400 rounded-full px-2.5 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Share button */}
                {shareUrl && (
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 text-sm border border-white/10 hover:border-sky-500/50 text-slate-400 hover:text-sky-400 rounded-xl px-4 py-2 transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X
                  </a>
                )}
              </div>
            </motion.div>

            {/* Fundability Panel */}
            {isReady && (
              <FundabilityPanel data={fundability} loading={fundLoading} />
            )}

            {/* Badge Card */}
            {isReady && repo?.repo_name && !matchesLoading && (
              <BadgeCard
                repoName={repo.repo_name}
                matchCount={matches.length}
                topScore={matches[0]?.match_score || 0}
              />
            )}

            {/* Match count header */}
            {matchesLoading && <Spinner label="Loading matches…" />}

            {!matchesLoading && matches.length > 0 && (
              <>
                <motion.div
                  key="match-header"
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-white">
                      🎉 {matches.length} Funding {matches.length === 1 ? 'Match' : 'Matches'} Found!
                    </h2>
                    <span className="text-sm text-slate-500">sorted by best fit</span>
                  </div>
                  {/* Beginner guide */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm text-slate-300">
                    <span className="font-semibold text-emerald-400">What to do next:</span>
                    {' '}Click <span className="text-purple-400 font-medium">Write Application</span> on any match to get AI-written application text ready to copy. Then click <span className="text-sky-400 font-medium">Apply Now</span> to go to the fund's website. Use <span className="text-amber-400 font-medium">Save</span> to track it in your Tracker.
                  </div>
                </motion.div>

                <div className="flex flex-col gap-6">
                  {matches.map((match, i) => (
                    <MatchCard key={match.id} match={match} index={i} repoId={repoId} repoData={repo} />
                  ))}
                </div>
              </>
            )}

            {!matchesLoading && matches.length === 0 && (
              <motion.div
                key="no-matches"
                className="glass-card p-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No matches found</h2>
                <p className="text-slate-400 text-sm mb-6">
                  We couldn't find strong funding matches for this repo right now.
                  Try again with a different repo or check back as we add more funding sources.
                </p>
                <Link to="/" className="btn-primary">
                  Try Another Repo
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
