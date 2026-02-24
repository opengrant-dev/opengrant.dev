import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Logo from './Logo'

const NAV_LINKS = [
  { to: '/',             label: 'Home',       icon: '🏠', tip: 'Find funding for your repo' },
  { to: '/applications', label: 'My Tracker', icon: '📋', tip: 'Track your applications' },
  { to: '/calendar',     label: 'Deadlines',  icon: '📅', tip: 'Grant deadline calendar' },
  { to: '/org',          label: 'Org Scan',   icon: '🔍', tip: 'Scan all repos in an org' },
  { to: '/dependencies', label: 'Deps',       icon: '🗺️',  tip: 'Dependency funding map' },
  { to: '/dna',          label: 'DNA Match',  icon: '🧬', tip: 'Compare to funded repos' },
  { to: '/portfolio',    label: 'Portfolio',  icon: '💼', tip: 'Optimize grant stack' },
  { to: '/velocity',     label: 'Velocity',   icon: '⚡', tip: 'Track funding progress' },
  { to: '/roadmap',      label: 'Roadmap',    icon: '🗺️', tip: '90-day funding plan' },
  { to: '/trending',    label: 'Trending',   icon: '🔥', tip: 'Hot repos + instant funding scan' },
  { to: '/funders',    label: 'Funders',    icon: '💰', tip: 'Browse all 298 funding sources' },
  { to: '/leaderboard', label: 'Top Repos', icon: '🏆', tip: 'Most fundable repos on OpenGrant' },
]

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <Logo size={32} />
          <span className="font-semibold text-white group-hover:text-sky-400 transition-colors">
            Open<span className="text-sky-400">Grant</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1 text-sm">
          {NAV_LINKS.map(({ to, label, icon, tip }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                title={tip}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? 'bg-sky-500/15 text-sky-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}

          {/* Ctrl+K hint */}
          <button
            className="ml-1 flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 transition-colors text-xs"
            title="Open command palette"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          >
            <span>⌘K</span>
          </button>

          {/* CTA */}
          <Link
            to="/"
            className="ml-2 btn-primary py-2 px-4 text-sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Scan Repo →
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          className="sm:hidden text-slate-400 hover:text-white p-2"
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
        <div className="sm:hidden border-t border-white/5 bg-slate-950/95 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ to, label, icon, tip }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-sm"
              onClick={() => setMenuOpen(false)}
            >
              <span className="text-xl leading-none">{icon}</span>
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-xs text-slate-500">{tip}</div>
              </div>
            </Link>
          ))}
          <Link
            to="/"
            className="mt-2 btn-primary text-center py-2.5"
            onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >
            Scan Your Repo →
          </Link>
        </div>
      )}
    </nav>
  )
}
