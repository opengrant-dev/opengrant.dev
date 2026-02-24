/**
 * BadgeCard — shows the README badge for a repo with copy-ready markdown.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function BadgeCard({ repoName, matchCount, topScore }) {
  const [copied, setCopied] = useState(false)

  if (!repoName) return null

  const badgeUrl = `${window.location.origin}/badge/${repoName}.svg`
  const resultsUrl = `${window.location.origin}/results`
  const markdown = `[![OpenGrant](${badgeUrl})](${resultsUrl})`

  const copy = () => {
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="glass-card p-5 mb-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            README Badge
          </div>
          <div className="text-white font-semibold text-sm mb-1">
            Show funding opportunities in your README
          </div>
          <p className="text-xs text-slate-500">
            Add this dynamic badge to your GitHub README — it auto-updates with your match count.
          </p>
        </div>

        {/* Badge preview */}
        <div className="shrink-0">
          <img
            src={`/badge/${repoName}.svg`}
            alt="OpenGrant badge"
            className="h-5"
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
      </div>

      {/* Code block */}
      <div className="mt-4 flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3">
        <code className="flex-1 text-xs text-emerald-400 font-mono break-all">{markdown}</code>
        <button
          onClick={copy}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-sky-500/30 text-slate-400 hover:text-sky-400 transition-all"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </motion.div>
  )
}
