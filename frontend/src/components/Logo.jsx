/**
 * OpenGrant Logo — SVG component
 * Scales cleanly from 24px (favicon) to 200px (hero).
 * Concept: git branch tree + golden "funded" node = open source growth to funding.
 */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OpenGrant logo"
    >
      <defs>
        <linearGradient id="ogBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="ogGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect width="48" height="48" rx="11" fill="url(#ogBg)" />

      {/* Subtle inner glow overlay */}
      <rect width="48" height="48" rx="11" fill="white" opacity="0.04" />

      {/* ── Git-tree / growth icon ── */}

      {/* Main vertical stem */}
      <line x1="20" y1="38" x2="20" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

      {/* Branch going up-left */}
      <path d="M20 30 Q14 26 13 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />

      {/* Branch going up-right — the "funded" branch */}
      <path d="M20 26 Q26 22 30 15" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" />

      {/* Root node (bottom) */}
      <circle cx="20" cy="39" r="3" fill="white" opacity="0.9" />

      {/* Left branch endpoint */}
      <circle cx="13" cy="19.5" r="2.5" fill="white" opacity="0.65" />

      {/* Main stem top node */}
      <circle cx="20" cy="21" r="2.8" fill="white" opacity="0.9" />

      {/* Gold "funded" node — top right (the winning branch) */}
      <circle cx="30.5" cy="14" r="5" fill="url(#ogGold)" />
      {/* Dollar sign inside gold node */}
      <text
        x="30.5"
        y="17.2"
        textAnchor="middle"
        fill="#92400e"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>
    </svg>
  )
}

/**
 * Full wordmark: logo + "OpenGrant" text
 */
export function LogoWordmark({ size = 32, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span
        style={{ fontSize: size * 0.5, lineHeight: 1 }}
        className="font-bold text-white tracking-tight"
      >
        Open<span className="text-sky-400">Grant</span>
      </span>
    </div>
  )
}
