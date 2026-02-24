import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubmitRepo } from '../hooks/useApi'

const EXAMPLES = [
  { url: 'https://github.com/fastapi/fastapi',     label: 'fastapi/fastapi' },
  { url: 'https://github.com/supabase/supabase',   label: 'supabase/supabase' },
  { url: 'https://github.com/vercel/next.js',      label: 'vercel/next.js' },
  { url: 'https://github.com/denoland/deno',       label: 'denoland/deno' },
]

export default function RepoForm() {
  const [url, setUrl]         = useState('')
  const [focused, setFocused] = useState(false)
  const { submit, loading, error } = useSubmitRepo()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    const result = await submit(url.trim())
    if (result?.repo_id) navigate(`/results/${result.repo_id}`)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Input card */}
        <div className={`flex flex-col sm:flex-row gap-0 rounded-2xl border transition-all duration-300 overflow-hidden
          ${focused
            ? 'border-sky-500/50 shadow-lg shadow-sky-500/10 bg-slate-900'
            : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          {/* GitHub icon + input */}
          <div className="flex items-center flex-1 gap-3 px-4">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 fill-slate-500">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="https://github.com/your-name/your-repo"
              className="flex-1 bg-transparent py-4 text-white placeholder-slate-600 focus:outline-none font-mono text-sm"
              disabled={loading}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* Submit button */}
          <div className="p-2 sm:p-1.5">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto btn-primary rounded-xl py-3 px-6 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  Find Funding
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Examples */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span>Try:</span>
          {EXAMPLES.map(({ url: ex, label }) => (
            <button
              key={ex}
              type="button"
              onClick={() => setUrl(ex)}
              className="font-mono text-slate-500 hover:text-sky-400 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
