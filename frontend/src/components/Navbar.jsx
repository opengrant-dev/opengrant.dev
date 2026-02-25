import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Logo from './Logo'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: '🏠', tip: 'Find funding for your repo', color: 'emerald' },
  { to: '/applications', label: 'Tracker', icon: '📋', tip: 'Track your applications', color: 'amber' },
  { to: '/calendar', label: 'Deadlines', icon: '📅', tip: 'Grant deadline calendar', color: 'orange' },
  { to: '/org', label: 'OrgScan', icon: '🔍', tip: 'Scan all repos in an org', color: 'cyan' },
  { to: '/dependencies', label: 'DepMap', icon: '🗺️', tip: 'Dependency funding map', color: 'violet' },
  { to: '/dna', label: 'DNA', icon: '🧬', tip: 'Compare to funded repos', color: 'green' },
  { to: '/portfolio', label: 'Portfolio', icon: '💼', tip: 'Optimize your grant stack', color: 'blue' },
  { to: '/velocity', label: 'Velocity', icon: '⚡', tip: 'Track funding velocity', color: 'yellow' },
  { to: '/roadmap', label: 'Roadmap', icon: '🗺️', tip: '90-day funding plan', color: 'rose' },
  { to: '/trending', label: 'Trending', icon: '🔥', tip: 'Hot repos + instant funding scan', color: 'red' },
  { to: '/funders', label: 'Funders', icon: '💰', tip: 'Browse all 298 funding sources', color: 'gold' },
  { to: '/bounties', label: 'Bounties', icon: '🎯', tip: 'Earn by solving paid issues', color: 'emerald' },
  { to: '/magnet', label: 'Magnet', icon: '🧲', tip: 'Boost your sponsorship conversion', color: 'rose' },
  { to: '/leaderboard', label: 'TopRepos', icon: '🏆', tip: 'Most fundable repos on OpenGrant', color: 'purple' },
]

const ACTIVE_CLS = {
  emerald: 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400/70 shadow-[0_0_12px_-4px_rgba(74,222,128,0.5)]',
  amber: 'text-amber-400   bg-amber-500/10   border-b-2 border-amber-400/70   shadow-[0_0_12px_-4px_rgba(251,191,36,0.5)]',
  orange: 'text-orange-400  bg-orange-500/10  border-b-2 border-orange-400/70  shadow-[0_0_12px_-4px_rgba(251,146,60,0.5)]',
  cyan: 'text-cyan-400    bg-cyan-500/10    border-b-2 border-cyan-400/70    shadow-[0_0_12px_-4px_rgba(34,211,238,0.5)]',
  violet: 'text-violet-400  bg-violet-500/10  border-b-2 border-violet-400/70  shadow-[0_0_12px_-4px_rgba(167,139,250,0.5)]',
  green: 'text-green-400   bg-green-500/10   border-b-2 border-green-400/70   shadow-[0_0_12px_-4px_rgba(74,222,128,0.4)]',
  blue: 'text-blue-400    bg-blue-500/10    border-b-2 border-blue-400/70    shadow-[0_0_12px_-4px_rgba(96,165,250,0.5)]',
  yellow: 'text-yellow-400  bg-yellow-500/10  border-b-2 border-yellow-400/70  shadow-[0_0_12px_-4px_rgba(250,204,21,0.5)]',
  rose: 'text-rose-400    bg-rose-500/10    border-b-2 border-rose-400/70    shadow-[0_0_12px_-4px_rgba(251,113,133,0.5)]',
  red: 'text-red-400     bg-red-500/10     border-b-2 border-red-400/70     shadow-[0_0_12px_-4px_rgba(248,113,113,0.5)]',
  gold: 'text-yellow-300  bg-yellow-400/10  border-b-2 border-yellow-300/70  shadow-[0_0_12px_-4px_rgba(253,224,71,0.5)]',
  purple: 'text-purple-400  bg-purple-500/10  border-b-2 border-purple-400/70  shadow-[0_0_12px_-4px_rgba(192,132,252,0.5)]',
}

const HOVER_CLS = {
  emerald: 'hover:text-emerald-400 hover:bg-emerald-500/8',
  amber: 'hover:text-amber-400   hover:bg-amber-500/8',
  orange: 'hover:text-orange-400  hover:bg-orange-500/8',
  cyan: 'hover:text-cyan-400    hover:bg-cyan-500/8',
  violet: 'hover:text-violet-400  hover:bg-violet-500/8',
  green: 'hover:text-green-400   hover:bg-green-500/8',
  blue: 'hover:text-blue-400    hover:bg-blue-500/8',
  yellow: 'hover:text-yellow-400  hover:bg-yellow-500/8',
  rose: 'hover:text-rose-400    hover:bg-rose-500/8',
  red: 'hover:text-red-400     hover:bg-red-500/8',
  gold: 'hover:text-yellow-300  hover:bg-yellow-400/8',
  purple: 'hover:text-purple-400  hover:bg-purple-500/8',
}

const STATUS_TICKER =
  '> OPENGRANT_SYS [v2.0]  ◈  AI_ENGINE:READY  ◈  SOURCES:298  ◈  COUNTRIES:50+  ◈  GRANTS:LIVE  ◈  HACKATHONS:INDEXED  ◈  BOUNTIES:ACTIVE  ◈  STATUS:●ONLINE  ◈  '

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setBlink(v => !v), 700)
    return () => clearInterval(t)
  }, [])

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/95 backdrop-blur-md">

      {/* ── Terminal ticker bar ── */}
      <div className="h-7 overflow-hidden flex items-center bg-slate-950 border-b border-emerald-500/10 select-none">
        <div className="terminal-ticker font-mono text-[10px] text-emerald-500/60 whitespace-nowrap">
          {STATUS_TICKER.repeat(5)}
        </div>
      </div>

      {/* ── Main nav ── */}
      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <Logo size={30} />
          <div className="flex items-center gap-0.5 leading-none">
            <span className="font-mono text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors tracking-tight">
              Open
            </span>
            <span className="font-bold text-sm bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Grant
            </span>
          </div>
          {/* Online indicator */}
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${blink ? 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]' : 'bg-emerald-400/20'}`}
            title="System online"
          />
        </Link>

        {/* Desktop nav — scrollable, icons + short labels */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 mx-2 overflow-x-auto scrollbar-none">
          {NAV_LINKS.map(({ to, label, icon, tip, color }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                title={tip}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg whitespace-nowrap font-mono text-[11px] tracking-wide transition-all duration-150 ${active
                  ? ACTIVE_CLS[color] || 'text-sky-400 bg-sky-500/10 border-b-2 border-sky-400'
                  : `text-slate-500 ${HOVER_CLS[color] || 'hover:text-white hover:bg-white/5'}`
                  }`}
              >
                <span className="leading-none text-sm">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-600 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors text-[10px] font-mono tracking-widest"
            title="Open command palette (Ctrl+K)"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          >
            ⌘K
          </button>

          <Link
            to="/"
            className="btn-primary py-2 px-4 text-xs font-mono tracking-wide"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            &gt; SCAN_REPO
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-slate-400 hover:text-emerald-400 p-2 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t border-emerald-500/10 bg-slate-950/98 px-4 py-3 flex flex-col gap-0.5 max-h-[80vh] overflow-y-auto">
          <div className="text-[9px] font-mono text-emerald-500/50 mb-2 tracking-widest px-1">// NAVIGATION_MATRIX</div>
          {NAV_LINKS.map(({ to, label, icon, tip, color }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-mono ${active
                  ? (ACTIVE_CLS[color] || 'text-sky-400 bg-sky-500/10') + ' !border-b-0 !shadow-none border border-current/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-xl leading-none w-7 text-center">{icon}</span>
                <div>
                  <div className="font-semibold text-[11px] tracking-widest">{label.toUpperCase()}</div>
                  <div className="text-[10px] text-slate-600 font-normal">{tip}</div>
                </div>
              </Link>
            )
          })}
          <Link
            to="/"
            className="mt-3 btn-primary text-center py-2.5 font-mono text-xs tracking-widest"
            onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >
            &gt; SCAN_REPO →
          </Link>
        </div>
      )}
    </nav>
  )
}
