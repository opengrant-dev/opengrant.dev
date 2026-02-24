;(function () {
  // Only on github.com/owner/repo pages
  const path = window.location.pathname.split('/').filter(Boolean)
  if (path.length !== 2) return
  if (document.getElementById('og-panel')) return

  const [owner, repo] = path

  // ── Build floating panel ──
  const panel = document.createElement('div')
  panel.id = 'og-panel'
  panel.innerHTML = `
    <div id="og-header">
      <span id="og-logo">💰</span>
      <div id="og-title">
        <div id="og-name">Open<span style="color:#38bdf8">Grant</span></div>
        <div id="og-sub">${owner}/${repo}</div>
      </div>
      <button id="og-min" title="Minimize">—</button>
    </div>
    <div id="og-body">
      <div id="og-score-row">
        <div id="og-ring">
          <div id="og-score-val">–</div>
          <div id="og-score-lbl">VIRAL</div>
        </div>
        <div id="og-stats">
          <div class="og-stat"><span id="og-stars">–</span> ⭐ stars</div>
          <div class="og-stat"><span id="og-forks">–</span> 🍴 forks</div>
          <div class="og-stat"><span id="og-issues">–</span> 💬 issues</div>
        </div>
      </div>
      <div id="og-bar-wrap">
        <div id="og-bar-fill"></div>
      </div>
      <div id="og-verdict">⚡ Fetching GitHub data…</div>
      <button id="og-btn">💰 Find Funding →</button>
      <div id="og-footer">Powered by OpenGrant AI · 298 sources</div>
    </div>
  `
  document.body.appendChild(panel)

  // ── Minimize toggle ──
  let minimized = false
  document.getElementById('og-min').addEventListener('click', () => {
    minimized = !minimized
    document.getElementById('og-body').style.display = minimized ? 'none' : 'block'
    document.getElementById('og-min').textContent = minimized ? '+' : '—'
  })

  // ── Fetch GitHub public API ──
  fetch(`https://api.github.com/repos/${owner}/${repo}`)
    .then(r => {
      if (!r.ok) throw new Error('rate_limit')
      return r.json()
    })
    .then(d => {
      const stars    = d.stargazers_count || 0
      const forks    = d.forks_count || 0
      const issues   = d.open_issues_count || 0
      const watchers = d.watchers_count || 0
      const pushed   = d.pushed_at ? new Date(d.pushed_at) : null

      // ── Viral Score Algorithm (0–100) ──
      let score = 0

      // Stars → 0–35
      if      (stars >= 10000) score += 35
      else if (stars >= 5000)  score += 28
      else if (stars >= 1000)  score += 20
      else if (stars >= 500)   score += 14
      else if (stars >= 100)   score += 8
      else                     score += Math.min(Math.round(stars / 10), 5)

      // Fork ratio → 0–20
      const fr = forks / Math.max(stars, 1)
      if      (fr > 0.3)  score += 20
      else if (fr > 0.15) score += 15
      else if (fr > 0.05) score += 8
      else                score += 3

      // Watchers → 0–15
      if      (watchers >= 1000) score += 15
      else if (watchers >= 500)  score += 10
      else if (watchers >= 100)  score += 5
      else                       score += 2

      // Open issues (activity signal) → 0–10
      if      (issues >= 50) score += 10
      else if (issues >= 20) score += 7
      else if (issues >= 5)  score += 4
      else                   score += 1

      // Has description + topics → 0–10
      if (d.description)               score += 5
      if (d.topics && d.topics.length) score += 5

      // Recent push → 0–10
      if (pushed) {
        const days = (Date.now() - pushed.getTime()) / 86400000
        if      (days < 1)  score += 10
        else if (days < 7)  score += 7
        else if (days < 30) score += 4
        else                score += 1
      }

      score = Math.min(score, 100)

      // ── Color + label ──
      let color, verdict, glow
      if      (score >= 76) { color = '#f87171'; verdict = '🔥 Going Viral — Apply NOW'; glow = 'rgba(248,113,113,0.4)' }
      else if (score >= 56) { color = '#4ade80'; verdict = '✅ Funding Ready';            glow = 'rgba(74,222,128,0.4)' }
      else if (score >= 31) { color = '#fbbf24'; verdict = '📈 Growing — Build Momentum'; glow = 'rgba(251,191,36,0.4)' }
      else                  { color = '#94a3b8'; verdict = '🌱 Early Stage';              glow = 'rgba(148,163,184,0.3)' }

      const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

      document.getElementById('og-score-val').textContent = score
      document.getElementById('og-score-val').style.color = color
      document.getElementById('og-ring').style.borderColor = color
      document.getElementById('og-ring').style.boxShadow = `0 0 18px ${glow}, inset 0 0 8px ${glow}`
      document.getElementById('og-bar-fill').style.width = score + '%'
      document.getElementById('og-bar-fill').style.background = `linear-gradient(90deg, ${color}88, ${color})`
      document.getElementById('og-verdict').textContent = verdict
      document.getElementById('og-verdict').style.color = color
      document.getElementById('og-stars').textContent = fmt(stars)
      document.getElementById('og-forks').textContent = fmt(forks)
      document.getElementById('og-issues').textContent = fmt(issues)
    })
    .catch(() => {
      document.getElementById('og-verdict').textContent = '⚠️ API rate limit — tap to scan anyway'
      document.getElementById('og-verdict').style.color = '#f59e0b'
    })

  // ── Find Funding button ──
  document.getElementById('og-btn').addEventListener('click', async () => {
    const btn     = document.getElementById('og-btn')
    const verdict = document.getElementById('og-verdict')
    btn.disabled  = true
    btn.textContent = '⏳ Scanning…'
    verdict.textContent = '🔄 Connecting to OpenGrant…'
    verdict.style.color = '#94a3b8'

    try {
      const res = await fetch('http://localhost:8765/api/repos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: window.location.href }),
      })
      if (!res.ok) throw new Error('api_error')
      const data = await res.json()
      btn.textContent = '✅ Opening results…'
      verdict.textContent = '🚀 Dashboard launching!'
      verdict.style.color = '#4ade80'
      window.open(`http://localhost:5173/results/${data.repo_id}`, '_blank')
    } catch {
      btn.textContent = '💰 Find Funding →'
      verdict.textContent = '❌ Start OpenGrant (START.bat) first!'
      verdict.style.color = '#f87171'
    } finally {
      setTimeout(() => {
        btn.disabled = false
        btn.textContent = '💰 Find Funding →'
      }, 2500)
    }
  })
})()
