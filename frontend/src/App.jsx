import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Results from './pages/Results'
import Applications from './pages/Applications'
import OrgScanner from './pages/OrgScanner'
import GrantCalendar from './pages/GrantCalendar'
import DependencyMap from './pages/DependencyMap'
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
          </Routes>
        </main>
        <footer className="border-t border-white/5 py-10 text-slate-500 text-sm">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid sm:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">F</div>
                  <span className="font-semibold text-white text-sm">OpenGrant</span>
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
