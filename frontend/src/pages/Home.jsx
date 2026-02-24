import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RepoForm from '../components/RepoForm'
import { useStats } from '../hooks/useApi'
import { formatNumber } from '../utils/helpers'

const STEPS = [
  {
    emoji: '🔗',
    step: '1',
    title: 'Paste your GitHub link',
    desc: 'Just copy the URL from your browser — like: github.com/your-name/your-project',
    color: 'sky',
  },
  {
    emoji: '🤖',
    step: '2',
    title: 'AI scans everything',
    desc: 'We look at your code, README, stars, language, and topics to understand your project.',
    color: 'violet',
  },
  {
    emoji: '💰',
    step: '3',
    title: 'Get your matches',
    desc: 'You get a list of grants, sponsorships, and hackathons that fit YOUR project — with tips to apply.',
    color: 'emerald',
  },
]

const FUNDING_TYPES = [
  { icon: '🏛️', label: 'Government Grants', desc: 'India, USA, EU, UK, Germany, Australia & more', badge: 'Free money' },
  { icon: '💎', label: 'Crypto & Web3', desc: 'Solana, Ethereum, Polygon, Chainlink & 40+ protocols', badge: 'Up to $2M' },
  { icon: '🏆', label: 'Hackathons', desc: 'MLH, GSoC, DoraHacks, ETHGlobal & 20+ events', badge: 'Win prizes' },
  { icon: '🐛', label: 'Bug Bounties', desc: 'Google, Apple, GitHub, OpenAI & 25+ programs', badge: 'Up to $1M' },
  { icon: '🚀', label: 'Accelerators', desc: 'YCombinator, NVIDIA, AWS, Google & more', badge: 'Mentorship' },
  { icon: '❤️', label: 'Sponsorships', desc: 'GitHub Sponsors, Open Collective, Patreon & more', badge: 'Recurring' },
]

const FAQ = [
  {
    q: 'What is an open source project?',
    a: 'If your code is publicly visible on GitHub, it\'s open source! Even small personal projects qualify. You don\'t need thousands of stars.',
  },
  {
    q: 'Do I need to be an expert?',
    a: 'No! Many grants specifically target beginners and students. Google Summer of Code, MLH Fellowships, and many foundation grants welcome first-time applicants.',
  },
  {
    q: 'Is this really free?',
    a: 'Yes, completely free. No account needed. Just paste your GitHub URL and go.',
  },
  {
    q: 'How much money can I get?',
    a: 'It varies widely — from $500 bug bounties to $2M+ grants. Most beginner-friendly programs offer $5,000–$50,000.',
  },
  {
    q: 'My project is small / just started. Will it still match?',
    a: 'Yes! Many programs fund early-stage projects. We\'ll show you exactly what your project needs to improve to qualify for more funding.',
  },
]

const BEGINNER_REPOS = [
  { url: 'https://github.com/fastapi/fastapi', label: 'fastapi/fastapi', tag: 'Python web' },
  { url: 'https://github.com/supabase/supabase', label: 'supabase/supabase', tag: 'Database' },
  { url: 'https://github.com/vercel/next.js', label: 'vercel/next.js', tag: 'React' },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium text-sm">{q}</span>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 ml-3 transition-transform ${open ? 'rotate-45' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 pb-4"
          >
            <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Home() {
  const { stats } = useStats()

  return (
    <div className="animated-gradient">

      {/* ── BEGINNER BANNER ── */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-slate-300">
          <span>👋</span>
          <span>New to open source funding?</span>
          <a href="#how-it-works" className="text-sky-400 hover:text-sky-300 underline underline-offset-2 font-medium">
            Start here — it's easier than you think
          </a>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div
          className="relative mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Trust badge */}
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-400"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            200+ funding sources · Free · No account needed
          </motion.div>

          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Get paid for your{' '}
            <span className="gradient-text">open source</span>{' '}
            project
          </h1>

          <p className="mx-auto mb-4 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Paste your GitHub link. AI finds grants, hackathons, and sponsorships that match your project.
            <strong className="text-white"> Takes 30 seconds.</strong>
          </p>

          {/* Simpler sub-message for beginners */}
          <p className="mx-auto mb-10 max-w-xl text-sm text-slate-500">
            Never applied for funding before? That's okay — we'll show you exactly what to do, step by step.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RepoForm />
          </motion.div>

          {/* What you get */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            {['✅ Funding matches ranked by fit', '✅ Your project\'s score + tips', '✅ Ready-to-use application text', '✅ Free, no login'].map(item => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      {stats && (
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: formatNumber(stats.repos_analyzed || 0), label: 'Repos Analyzed' },
              { value: formatNumber(stats.funding_sources || 0), label: 'Funding Sources' },
              { value: formatNumber(stats.matches_made || 0), label: 'Matches Made' },
              { value: '200+', label: 'Countries Covered' },
            ].map(({ value, label }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-2xl font-bold gradient-text">{value}</div>
                <div className="mt-1 text-xs text-slate-500 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-4 py-20 border-t border-white/5 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-slate-400">Three simple steps. Even if you've never applied for funding before.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ emoji, step, title, desc, color }, i) => (
              <motion.div
                key={step}
                className="glass-card p-7 flex flex-col gap-4 relative"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{emoji}</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400`}>
                    Step {step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>

                {/* Arrow connector */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute -right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xl z-10">→</div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Try an example */}
          <div className="mt-8 glass-card p-5 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">Not sure which repo to try?</span>
            {BEGINNER_REPOS.map(({ url, label, tag }) => (
              <a
                key={url}
                href={`/?url=${encodeURIComponent(url)}`}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-white/10 hover:border-sky-500/30 text-slate-300 hover:text-sky-400 transition-all"
              >
                <span className="font-mono">{label}</span>
                <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{tag}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNDING TYPES ── */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Every type of funding, in one place</h2>
            <p className="text-slate-400">From first-time hackathon to million-dollar grant — we cover it all.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FUNDING_TYPES.map(({ icon, label, desc, badge }, i) => (
              <motion.div
                key={label}
                className="glass-card p-5 flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="text-3xl shrink-0 mt-0.5">{icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">{badge}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVANCED AI TOOLS ── */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 mb-4">
              ✨ New — AI-powered deep analysis
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Go beyond basic matching</h2>
            <p className="text-slate-400">After scanning your repo, unlock 5 tools no other funding platform has.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '🧬',
                title: 'DNA Match',
                desc: 'Compare your project against 45+ historically funded OSS repos across 6 dimensions.',
                badge: 'New',
                color: 'border-purple-500/20 hover:border-purple-500/40',
                glow: 'bg-purple-500/5',
                path: '/dna',
              },
              {
                icon: '💼',
                title: 'Portfolio Optimizer',
                desc: 'Build the perfect grant stack — max funding, zero conflicts between funders.',
                badge: 'Smart',
                color: 'border-sky-500/20 hover:border-sky-500/40',
                glow: 'bg-sky-500/5',
                path: '/portfolio',
              },
              {
                icon: '⚡',
                title: 'Velocity Dashboard',
                desc: 'See exactly how many weeks until you qualify for NSF, Mozilla, Linux Foundation & more.',
                badge: 'Predict',
                color: 'border-amber-500/20 hover:border-amber-500/40',
                glow: 'bg-amber-500/5',
                path: '/velocity',
              },
              {
                icon: '🗺️',
                title: '90-Day Roadmap',
                desc: 'AI builds a week-by-week action plan to prepare for your chosen grants — grant-specific tips included.',
                badge: 'AI',
                color: 'border-emerald-500/20 hover:border-emerald-500/40',
                glow: 'bg-emerald-500/5',
                path: '/roadmap',
              },
            ].map(({ icon, title, desc, badge, color, glow, path }, i) => (
              <motion.a
                key={title}
                href={path}
                className={`glass-card p-5 flex flex-col gap-3 border ${color} ${glow} transition-all cursor-pointer group`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{icon}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{badge}</span>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm mb-1 group-hover:text-sky-300 transition-colors">{title}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
                <div className="text-xs text-sky-400 mt-auto">Try it →</div>
              </motion.a>
            ))}
          </div>
          <div className="mt-6 text-center text-xs text-slate-600">
            Scan your repo first, then these tools unlock automatically with your repo ID.
          </div>
        </div>
      </section>

      {/* ── BEGINNER FAQ ── */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-block text-2xl mb-3">🙋</div>
            <h2 className="text-3xl font-bold text-white mb-3">New here? We've got you.</h2>
            <p className="text-slate-400">Common questions from developers just getting started with funding.</p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQ.map(({ q, a }) => (
              <FaqItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT HAPPENS AFTER ── */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">What you'll see after scanning</h2>
            <p className="text-slate-400">No confusing dashboards. Just clear, actionable results.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '📊', title: 'Fundability Score', desc: 'See your project\'s strengths and what to fix (A to F grade)' },
              { icon: '🎯', title: 'Matched Grants', desc: 'Ranked list of funding that fits your exact project type' },
              { icon: '✍️', title: 'AI Application', desc: 'Full grant application text written by AI — just copy & paste' },
              { icon: '📅', title: 'Deadlines Calendar', desc: 'Never miss a grant deadline with your personal calendar' },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                className="glass-card p-5 text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-3xl mb-3">{icon}</div>
                <div className="font-semibold text-white text-sm mb-1">{title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-24 text-center border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to find your funding?</h2>
          <p className="mb-2 text-slate-400">Free · No account · Takes 30 seconds</p>
          <p className="mb-8 text-slate-500 text-sm">Even if your project is small or just started — give it a try.</p>
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="btn-primary text-base px-8 py-3"
          >
            Find My Funding Now →
          </a>
        </motion.div>
      </section>
    </div>
  )
}
