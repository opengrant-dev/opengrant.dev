import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { formatAmount } from '../utils/helpers'

const MOCK_BOUNTIES = [
    {
        id: 'b1',
        title: 'Migrate to React 18 & replace enzyme with RTL',
        repo: 'facebook/react-native',
        amount: 500,
        tags: ['react', 'testing', 'migration'],
        level: 'Advanced',
        platform: 'Gitcoin',
        url: 'https://gitcoin.co',
        posted: '2 days ago'
    },
    {
        id: 'b2',
        title: 'Fix memory leak in websocket reconnection logic',
        repo: 'fastapi/fastapi',
        amount: 150,
        tags: ['python', 'websockets', 'asyncio'],
        level: 'Intermediate',
        platform: 'Bountysource',
        url: 'https://bountysource.com',
        posted: '5 hours ago'
    },
    {
        id: 'b3',
        title: 'Implement OAuth2 login for GitHub/Google',
        repo: 'supabase/supabase',
        amount: 300,
        tags: ['auth', 'oauth', 'typescript'],
        level: 'Intermediate',
        platform: 'Supabase OSS',
        url: 'https://supabase.com/oss',
        posted: '1 week ago'
    },
    {
        id: 'b4',
        title: 'Add dark mode support to the CLI documentation',
        repo: 'vercel/next.js',
        amount: 50,
        tags: ['css', 'documentation', 'good-first-issue'],
        level: 'Beginner',
        platform: 'HackerOne',
        url: 'https://hackerone.com',
        posted: 'Just now'
    }
]

export default function BountyHunter() {
    const [bounties, setBounties] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, beginner, intermediate, advanced

    useEffect(() => {
        const fetchBounties = async () => {
            try {
                const response = await axios.get('http://localhost:8765/api/bounties')
                setBounties(response.data.bounties)
            } catch (err) {
                console.error('Error fetching bounties:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchBounties()
    }, [])

    const filtered = bounties.filter(b => filter === 'all' || b.level.toLowerCase() === filter)

    return (
        <div className="min-h-screen animated-gradient">
            <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">

                {/* Header */}
                <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <span className="animate-pulse">🎯</span> Active Income
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                        The <span className="gradient-text">Bounty</span> Hunter
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                        Stop waiting for grants. Earn fast cash by solving open-source issues instantly. We scan platforms to find exact matches for your tech stack.
                    </p>
                </motion.div>

                {/* AI Scanner Input (Mocked UX) */}
                <motion.div
                    className="glass-card p-6 mb-10 max-w-2xl mx-auto text-center border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                >
                    <div className="font-mono text-sm text-emerald-400 mb-3 tracking-wider">
                        &gt; SYNC_GITHUB_PROFILE
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="github.com/your-username"
                            className="input-field flex-1"
                            defaultValue="github.com/developer"
                        />
                        <button className="btn-primary whitespace-nowrap px-6">
                            Scan Skills ✨
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                        AI is currently filtering <strong className="text-slate-300 font-mono">1,429</strong> live bounties to match your commit history.
                    </p>
                </motion.div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Live Matches <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">{filtered.length}</span>
                    </h2>
                    <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                        {['all', 'beginner', 'intermediate', 'advanced'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${filter === f ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bounties List */}
                {loading ? (
                    <div className="py-20 text-center">
                        <span className="text-4xl animate-bounce inline-block mb-4">🎯</span>
                        <div className="text-emerald-400 font-mono text-sm animate-pulse tracking-widest">HUNTING_BOUNTIES...</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {filtered.map((b, i) => (
                                <motion.div
                                    key={b.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card p-5 group hover:border-emerald-500/30 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                {b.platform}
                                            </span>
                                            <span className="text-xs text-slate-500">{b.posted}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                                {b.level}
                                            </span>
                                        </div>
                                        <a href={b.url} target="_blank" rel="noreferrer" className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors block mb-1">
                                            {b.title}
                                        </a>
                                        <div className="text-sm font-mono text-slate-400 mb-3 block">
                                            <span className="text-slate-500">repo: </span>{b.repo}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {b.tags.map(t => (
                                                <span key={t} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">#{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:text-right shrink-0 bg-slate-900/50 p-4 rounded-xl border border-white/5 w-full md:w-auto flex md:flex-col items-center justify-between md:justify-center gap-4">
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Bounty</div>
                                            <div className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                                                ${b.amount}
                                            </div>
                                        </div>
                                        <a href={b.url} target="_blank" rel="noreferrer" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors mt-2">
                                            Claim Issue →
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="glass-card py-16 text-center border-dashed">
                                    <div className="text-4xl mb-3 opacity-50">🧭</div>
                                    <h3 className="text-lg font-bold text-white mb-1">No bounties found</h3>
                                    <p className="text-slate-400 text-sm">Try changing your filter settings or updating your skills.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

            </div>
        </div>
    )
}
