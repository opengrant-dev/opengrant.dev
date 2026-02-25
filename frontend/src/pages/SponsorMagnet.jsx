import { useState } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import axios from 'axios'

export default function SponsorMagnet() {
    const toast = useToast()
    const [repoUrl, setRepoUrl] = useState('')
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState(null)

    const handleScan = async () => {
        if (!repoUrl) return toast.error('Please enter a repository URL')
        setScanning(true)

        try {
            // Step 1: Submit repo to get/verify repo_id
            const submitResp = await axios.post('http://localhost:8765/api/repos/submit', { github_url: repoUrl })
            const repoId = submitResp.data.repo_id

            // Step 2: Poll status until analyzed (simpler for this UI: just hit the monetize endpoint directly if we assume it might exist)
            // The backend generate_monetize_strategy expects a repo_id
            const response = await axios.post('http://localhost:8765/api/monetize/generate', { repo_id: repoId })
            setResult(response.data)
            toast.success('Optimized monetization strategy generated!')
        } catch (err) {
            console.error('Error generating strategy:', err)
            toast.error('Failed to generate strategy. Please ensure the repo is public.')
        } finally {
            setScanning(false)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard!')
    }

    return (
        <div className="min-h-screen animated-gradient pb-20">
            <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">

                {/* Header */}
                <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-sm text-pink-400 mb-4 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                        <span className="animate-pulse">🧲</span> Passive Income
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                        Sponsor <span className="gradient-text-warm">Magnet</span>
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                        Turn your GitHub stars into recurring revenue. AI writes the perfect funding files and README headers to maximize your conversion.
                    </p>
                </motion.div>

                {/* Action Card */}
                <div className="glass-card p-8 mb-10 border-pink-500/20">
                    <div className="max-w-xl mx-auto text-center">
                        <h3 className="text-xl font-bold text-white mb-6">Enter your Repository URL</h3>
                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                placeholder="https://github.com/username/repo"
                                className="input-field flex-1 border-white/10"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                            />
                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
                            >
                                {scanning ? 'Analyzing...' : 'Generate Magnet ✨'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            AI analyzes your repo's value proposition to write the most convincing sponsorship copy.
                        </p>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">

                        {/* FUNDING.yml */}
                        <div className="glass-card overflow-hidden">
                            <div className="bg-slate-900 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                                <span className="font-mono text-xs text-slate-400">.github/FUNDING.yml</span>
                                <button
                                    onClick={() => copyToClipboard(result.fundingYml)}
                                    className="text-[10px] uppercase font-bold text-pink-400 hover:text-pink-300 transition-colors"
                                >
                                    Copy File
                                </button>
                            </div>
                            <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto">
                                {result.fundingYml}
                            </pre>
                        </div>

                        {/* README Snippet */}
                        <div className="glass-card overflow-hidden">
                            <div className="bg-slate-900 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                                <span className="font-mono text-xs text-slate-400">README.md (Suggested Snippet)</span>
                                <button
                                    onClick={() => copyToClipboard(result.readmeSnippet)}
                                    className="text-[10px] uppercase font-bold text-pink-400 hover:text-pink-300 transition-colors"
                                >
                                    Copy Markdown
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="prose prose-invert max-w-none text-slate-300 bg-white/5 p-4 rounded-lg mb-4">
                                    <h3 className="text-white font-bold mb-2">💖 Support the Project</h3>
                                    <p className="text-sm">If you find this project useful, please consider sponsoring it. Your support helps us maintain the project and build new features!</p>
                                </div>
                                <pre className="text-xs font-mono text-slate-500 bg-slate-950/50 p-4 rounded-lg overflow-x-auto">
                                    {result.readmeSnippet}
                                </pre>
                            </div>
                        </div>

                        {/* AI Tips */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            {result.tips.map((tip, i) => (
                                <div key={i} className="glass-card p-4 bg-pink-500/5 border-pink-500/10">
                                    <div className="text-xl mb-2">💡</div>
                                    <div className="text-xs text-slate-300 leading-relaxed font-medium">
                                        {tip}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </motion.div>
                )}

            </div>
        </div>
    )
}
