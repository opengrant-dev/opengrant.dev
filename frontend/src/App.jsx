import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Logo from './components/Logo'
import AuroraBackground from './components/AuroraBackground'
import ScrollProgress from './components/ScrollProgress'
import CommandPalette from './components/CommandPalette'
import { ToastProvider } from './components/Toast'
import Home from './pages/Home'
import Results from './pages/Results'
import Applications from './pages/Applications'
import OrgScanner from './pages/OrgScanner'
import GrantCalendar from './pages/GrantCalendar'
import DependencyMap from './pages/DependencyMap'
import FundedDNA from './pages/FundedDNA'
import TimeMachine from './pages/TimeMachine'
import Portfolio from './pages/Portfolio'
import VelocityDashboard from './pages/VelocityDashboard'
import TrendingSpotlight from './pages/TrendingSpotlight'
import FunderDirectory from './pages/FunderDirectory'
import Leaderboard from './pages/Leaderboard'
import BountyHunter from './pages/BountyHunter'
import SponsorMagnet from './pages/SponsorMagnet'
import Settings from './pages/Settings'
import Navbar from './components/Navbar'
import DeveloperSeal from './components/DeveloperSeal'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen flex flex-col relative">
          <AuroraBackground />
          <ScrollProgress />
          <CommandPalette />
          <DeveloperSeal />
          <Navbar />
          <main className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results/:repoId" element={<Results />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/org" element={<OrgScanner />} />
              <Route path="/calendar" element={<GrantCalendar />} />
              <Route path="/dependencies" element={<DependencyMap />} />
              <Route path="/dna" element={<FundedDNA />} />
              <Route path="/dna/:repoId" element={<FundedDNA />} />
              <Route path="/roadmap" element={<TimeMachine />} />
              <Route path="/roadmap/:repoId" element={<TimeMachine />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio/:repoId" element={<Portfolio />} />
              <Route path="/velocity" element={<VelocityDashboard />} />
              <Route path="/velocity/:repoId" element={<VelocityDashboard />} />
              <Route path="/trending" element={<TrendingSpotlight />} />
              <Route path="/funders" element={<FunderDirectory />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/bounties" element={<BountyHunter />} />
              <Route path="/magnet" element={<SponsorMagnet />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
          <footer className="border-t border-white/5 py-10 text-slate-500 text-sm relative z-10">
            <div className="max-w-5xl mx-auto px-4">
              <div className="grid sm:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Logo size={28} />
                    <span className="font-semibold text-white text-sm">Open<span className="text-sky-400">Grant</span></span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    AI-powered tool to match open source projects with grants, hackathons, bug bounties, and sponsorships worldwide.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                    <kbd className="border border-white/10 rounded px-1.5 py-0.5 text-slate-500">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="border border-white/10 rounded px-1.5 py-0.5 text-slate-500">K</kbd>
                    <span className="text-slate-600">to open command palette</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-400 text-xs uppercase tracking-wider mb-3">Tools</div>
                  <div className="flex flex-col gap-2">
                    {[
                      { to: '/', label: '🏠 Find Funding' },
                      { to: '/applications', label: '📋 My Tracker' },
                      { to: '/calendar', label: '📅 Deadlines Calendar' },
                      { to: '/org', label: '🔍 Org Scanner' },
                      { to: '/dependencies', label: '🗺️ Dependency Map' },
                      { to: '/dna', label: '🧬 DNA Match' },
                      { to: '/portfolio', label: '💼 Portfolio Optimizer' },
                      { to: '/velocity', label: '⚡ Velocity Dashboard' },
                      { to: '/roadmap', label: '🗺️ 90-Day Roadmap' },
                      { to: '/trending', label: '🔥 Trending Spotlight' },
                      { to: '/funders', label: '💰 Funder Directory' },
                      { to: '/bounties', label: '🎯 Bounty Hunter' },
                      { to: '/magnet', label: '🧲 Sponsor Magnet' },
                      { to: '/leaderboard', label: '🏆 Leaderboard' },
                      { to: '/settings', label: '⚙️ API Configuration' },
                    ].map(({ to, label }) => (
                      <Link key={to} to={to} className="text-xs text-slate-600 hover:text-sky-400 transition-colors">{label}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-400 text-xs uppercase tracking-wider mb-3">Funding Types</div>
                  <div className="flex flex-col gap-2 text-xs text-slate-600">
                    <span>🏛️ Government Grants (India, USA, EU, UK…)</span>
                    <span>💎 Crypto & Web3 (40+ protocols)</span>
                    <span>🏆 Hackathons (MLH, GSoC, ETHGlobal…)</span>
                    <span>🐛 Bug Bounties (Google, Apple, GitHub…)</span>
                    <span>🚀 Accelerators & Sponsorships</span>
                    <span>🌍 298 sources across 50+ countries</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-6 text-center text-xs text-slate-600">
                OpenGrant &mdash; Built with ❤️ by <a href="https://github.com/Chiranjib" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors">Chiranjib</a> &bull; Free for all developers &bull; No account needed
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
