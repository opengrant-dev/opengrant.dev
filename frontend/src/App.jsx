import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Logo from './components/Logo'
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
import Navbar from './components/Navbar'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
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
          </Routes>
        </main>
        <footer className="border-t border-white/5 py-10 text-slate-500 text-sm">
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
                </div>
              </div>
            </div>
            <div className="border-t border-white/5 pt-6 text-center text-xs text-slate-600">
              OpenGrant &mdash; Free for all developers &bull; No account needed &bull; Built with ❤️ for the OSS community
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}
