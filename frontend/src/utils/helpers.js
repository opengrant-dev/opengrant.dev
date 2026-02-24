/**
 * Shared utility functions for the frontend.
 */

/** Return Tailwind class string for a score value */
export function scoreClass(score) {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-moderate'
  return 'score-weak'
}

/** Return a text label for a score */
export function scoreLabel(score) {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Strong Match'
  if (score >= 40) return 'Moderate Match'
  return 'Weak Match'
}

/** Format USD amount range */
export function formatAmount(min, max) {
  const fmt = (n) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(0)}k`
      : `$${n}`

  if (!min && !max) return 'Variable'
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (max) return `Up to ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return 'Variable'
}

/** Map category string to Tailwind pill class */
export function categoryClass(cat) {
  const map = {
    platform:   'cat-platform',
    foundation: 'cat-foundation',
    corporate:  'cat-corporate',
    government: 'cat-government',
    crypto:     'cat-crypto',
    nonprofit:  'cat-nonprofit',
    vc:         'cat-vc',
  }
  return map[cat] || 'cat-platform'
}

/** Capitalize first letter */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Build a shareable Twitter/X intent URL for results */
export function buildShareUrl(repoName, topScore, topFundName) {
  const text = encodeURIComponent(
    `Just matched ${repoName} with funding opportunities using AI!\n` +
    `Top match: ${topFundName} (${topScore}% fit)\n` +
    `Find funding for your OSS project:`
  )
  return `https://twitter.com/intent/tweet?text=${text}`
}

/** Truncate a string with ellipsis */
export function truncate(str, maxLen = 120) {
  if (!str || str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + '…'
}

/** Format a number with commas */
export function formatNumber(n) {
  if (n === null || n === undefined) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
