;(function () {
  if (document.getElementById('og-copilot')) return

  /* ── Parse GitHub URL ─────────────────────────────────── */
  const p = window.location.pathname.split('/').filter(Boolean)
  const isRepo    = p.length >= 2 && p[1] && !p[1].includes('.')
  const isProfile = p.length === 1 && p[0] && !p[0].includes('.')
  const isIssues  = p.length >= 3 && p[2] === 'issues'
  const isTrending = window.location.pathname === '/trending'
  const owner = p[0] || ''
  const repo  = p[1] || ''

  /* ── Create toggle tab ─────────────────────────────────── */
  const tab = document.createElement('button')
  tab.id = 'og-tab'
  tab.innerHTML = `<span id="og-tab-icon">💰</span><span id="og-tab-label">Fund</span>`
  document.body.appendChild(tab)

  /* ── Create sidebar ────────────────────────────────────── */
  const sidebar = document.createElement('div')
  sidebar.id = 'og-copilot'
  sidebar.innerHTML = `
    <div id="og-hdr">
      <div id="og-hdr-left">
        <span id="og-hdr-logo">💰</span>
        <div>
          <div id="og-hdr-title">Open<span class="og-sky">Grant</span> <span class="og-dim">Copilot</span></div>
          <div id="og-hdr-sub">AI Funding Intelligence</div>
        </div>
      </div>
      <button id="og-close" title="Close">✕</button>
    </div>
    <div id="og-mode-bar">
      <div id="og-mode-label">LOADING…</div>
      <div id="og-online"><span class="og-dot"></span>LIVE</div>
    </div>
    <div id="og-body">
      <div class="og-loading">
        <div class="og-spinner-ring"></div>
        <div class="og-loading-txt">Analyzing…</div>
      </div>
    </div>
    <div id="og-footer-bar">298 funding sources · 50+ countries · AI-powered</div>
  `
  document.body.appendChild(sidebar)

  /* ── Toggle logic ──────────────────────────────────────── */
  let open = false
  function openSidebar()  { open = true;  sidebar.classList.add('og-open');  tab.classList.add('og-tab-active') }
  function closeSidebar() { open = false; sidebar.classList.remove('og-open'); tab.classList.remove('og-tab-active') }

  tab.addEventListener('click', () => open ? closeSidebar() : openSidebar())
  document.getElementById('og-close').addEventListener('click', closeSidebar)

  /* ── Route to correct mode ─────────────────────────────── */
  if (isRepo && !isIssues)  { setMode('REPO ANALYSIS'); initRepo(owner, repo) }
  else if (isProfile)       { setMode('DEV FUNDING PROFILE'); initProfile(owner) }
  else if (isIssues)        { setMode('BOUNTY SCANNER'); initIssues(owner, repo) }
  else if (isTrending)      { setMode('TRENDING INTEL'); initTrending() }
  else                      { setMode('FUNDING COPILOT'); initGeneric() }

  function setMode(txt) {
    document.getElementById('og-mode-label').textContent = txt
  }
  function setBody(html) {
    document.getElementById('og-body').innerHTML = html
  }
  // Safe text helper — never use for user-controlled content in HTML attributes
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /* ══════════════════════════════════════════════════════════
     MODE 1 — REPO ANALYSIS
  ══════════════════════════════════════════════════════════ */
  async function initRepo(owner, repo) {
    let gh = {}
    try {
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
      if (r.ok) gh = await r.json()
    } catch {}

    const stars    = gh.stargazers_count || 0
    const forks    = gh.forks_count || 0
    const issues   = gh.open_issues_count || 0
    const watchers = gh.watchers_count || 0
    const lang     = gh.language || 'Unknown'
    const topics   = gh.topics || []
    const desc     = gh.description || ''
    const pushed   = gh.pushed_at ? new Date(gh.pushed_at) : null
    const license  = gh.license?.spdx_id || 'None'
    const archived = gh.archived || false

    const vs = viralScore({ stars, forks, watchers, issues, pushed, hasDesc: !!desc, hasTopics: topics.length > 0 })

    let fundPot = Math.round(vs * 2400)
    const langMult = { Rust: 1.6, C: 1.5, 'C++': 1.4, Go: 1.3, Python: 1.1, Haskell: 1.3, Zig: 1.4 }
    fundPot = Math.round(fundPot * (langMult[lang] || 1.0))
    if (topics.some(t => ['security','privacy','cryptography'].includes(t))) fundPot = Math.round(fundPot * 1.3)
    if (topics.some(t => ['ethereum','blockchain','web3','defi'].includes(t))) fundPot = Math.round(fundPot * 1.5)
    if (archived) fundPot = 0

    const { color, glow, verdict, level } = scoreColor(vs)
    const funders = matchFunders(lang, topics, desc, vs)
    const isBeginnerScore = vs < 35

    setBody(`
      <div class="og-repo-wrap">

        <div class="og-repo-name">${esc(owner)}/<strong>${esc(repo)}</strong></div>
        ${topics.length ? `<div class="og-topics">${topics.slice(0,4).map(t => `<span class="og-topic">${esc(t)}</span>`).join('')}</div>` : ''}

        <div class="og-score-section">
          <div class="og-ring" style="border-color:${color};box-shadow:0 0 24px ${glow}">
            <div class="og-ring-num" style="color:${color}">${vs}</div>
            <div class="og-ring-sub">VIRAL</div>
          </div>
          <div class="og-score-right">
            <div class="og-verdict" style="color:${color}">${verdict}</div>
            <div class="og-level-badge" style="background:${glow};border-color:${color}33">${level}</div>
            <div class="og-mini-stats">
              <span>⭐ ${fmtNum(stars)}</span>
              <span>🍴 ${fmtNum(forks)}</span>
              <span>💬 ${fmtNum(issues)}</span>
            </div>
          </div>
        </div>

        <div class="og-progress-wrap">
          <div class="og-progress-fill" style="width:${vs}%;background:linear-gradient(90deg,${color}88,${color})"></div>
        </div>
        <div class="og-progress-labels"><span>0</span><span style="color:${color}">${vs}/100</span><span>100</span></div>

        <div class="og-pot-box" style="border-color:${color}22">
          <div class="og-pot-label">💎 FUNDING POTENTIAL</div>
          <div class="og-pot-val" style="color:${color}">${fmtMoney(fundPot)}</div>
          <div class="og-pot-sub">per successful application · ${lang} · ${license}</div>
        </div>

        <div class="og-sec-title">🎯 GRANT MATCHES</div>
        <div class="og-funder-list">
          ${funders.slice(0,5).map((f,i) => `
            <div class="og-funder-row ${i===0?'og-funder-top':''}">
              <div class="og-funder-info">
                <div class="og-funder-name">${i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''}${f.name}</div>
                <div class="og-funder-meta">${f.type} · ${f.amount}</div>
              </div>
              <div class="og-funder-pct">
                <div class="og-match-num">${f.match}%</div>
                <div class="og-match-bar-outer"><div class="og-match-bar-inner" style="width:${f.match}%"></div></div>
              </div>
            </div>
          `).join('')}
        </div>

        ${isBeginnerScore ? `
        <div class="og-beginner-box">
          <div class="og-beg-title">💡 QUICK WINS FOR YOU</div>
          <div class="og-beg-list">
            <div class="og-beg-item">🟢 <strong>GitHub Sponsors</strong> — Start today, no min stars</div>
            <div class="og-beg-item">🟢 <strong>GSoC</strong> — $3K–$6.6K, students welcome</div>
            <div class="og-beg-item">🟢 <strong>MLH Fellowship</strong> — $5K, any skill level</div>
            <div class="og-beg-item">🟡 <strong>Gitcoin Grants</strong> — Web3 micro-funding</div>
          </div>
        </div>
        ` : ''}

        <div class="og-actions">
          <button class="og-btn-primary" id="og-full-btn">🚀 Full AI Analysis</button>
          <button class="og-btn-ghost" id="og-apply-btn">📝 Generate Application</button>
        </div>

        <div class="og-shortcut-grid">
          <div class="og-shortcut" onclick="window.open('http://localhost:5173/dna?repo=${encodeURIComponent('https://github.com/'+owner+'/'+repo)}','_blank')">🧬 DNA Match</div>
          <div class="og-shortcut" onclick="window.open('http://localhost:5173/velocity','_blank')">⚡ Velocity</div>
          <div class="og-shortcut" onclick="window.open('http://localhost:5173/portfolio','_blank')">💼 Portfolio</div>
          <div class="og-shortcut" onclick="window.open('http://localhost:5173/roadmap','_blank')">🗺️ Roadmap</div>
        </div>
      </div>
    `)

    document.getElementById('og-full-btn')?.addEventListener('click', () => scanRepo())
    document.getElementById('og-apply-btn')?.addEventListener('click', () =>
      window.open(`http://localhost:5173/applications`, '_blank')
    )
  }

  /* ══════════════════════════════════════════════════════════
     MODE 2 — DEVELOPER PROFILE
  ══════════════════════════════════════════════════════════ */
  async function initProfile(username) {
    setBody(`<div class="og-loading"><div class="og-spinner-ring"></div><div class="og-loading-txt">Scanning @${username}…</div></div>`)

    let user = {}, repos = []
    try {
      const [ur, rr] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=30&sort=stars&type=owner`)
      ])
      if (ur.ok) user = await ur.json()
      if (rr.ok) repos = await rr.json()
    } catch {}

    if (user.message === 'Not Found') { setBody(`<div class="og-empty">Profile not found.</div>`); return }

    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0)
    const langs = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 5)
    const topRepos = repos.slice(0, 6).map(r => {
      const vs = viralScore({
        stars: r.stargazers_count, forks: r.forks_count, watchers: r.watchers_count,
        issues: r.open_issues_count, pushed: r.pushed_at ? new Date(r.pushed_at) : null,
        hasDesc: !!r.description, hasTopics: (r.topics || []).length > 0
      })
      return { name: r.name, vs, pot: Math.round(vs * 2200), lang: r.language }
    }).sort((a, b) => b.vs - a.vs)

    const totalPot = topRepos.reduce((s, r) => s + r.pot, 0)
    const avgVs = topRepos.length ? Math.round(topRepos.reduce((s, r) => s + r.vs, 0) / topRepos.length) : 0
    const { color } = scoreColor(avgVs)

    setBody(`
      <div class="og-profile-wrap">
        <div class="og-profile-hdr">
          ${/^https:\/\/avatars\.githubusercontent\.com\//.test(user.avatar_url || '') ? `<img src="${esc(user.avatar_url)}" class="og-avatar" />` : '<div class="og-avatar-placeholder">👤</div>'}
          <div class="og-profile-info">
            <div class="og-profile-name">@${esc(username)}</div>
            <div class="og-profile-bio">${user.bio ? esc(user.bio.slice(0,60)) : 'Open Source Developer'}</div>
            ${user.location ? `<div class="og-profile-loc">📍 ${user.location}</div>` : ''}
          </div>
        </div>

        <div class="og-profile-stats">
          <div class="og-pstat"><div class="og-pstat-v">${user.public_repos || 0}</div><div class="og-pstat-l">Repos</div></div>
          <div class="og-pstat"><div class="og-pstat-v">${fmtNum(totalStars)}</div><div class="og-pstat-l">Stars</div></div>
          <div class="og-pstat"><div class="og-pstat-v">${fmtNum(user.followers || 0)}</div><div class="og-pstat-l">Followers</div></div>
          <div class="og-pstat"><div class="og-pstat-v og-pstat-score" style="color:${color}">${avgVs}</div><div class="og-pstat-l">Avg Score</div></div>
        </div>

        ${langs.length ? `<div class="og-topics og-profile-langs">${langs.map(l => `<span class="og-topic">${l}</span>`).join('')}</div>` : ''}

        <div class="og-pot-box" style="border-color:#4ade8033">
          <div class="og-pot-label">💰 TOTAL FUNDING POTENTIAL</div>
          <div class="og-pot-val" style="color:#4ade80">${fmtMoney(totalPot)}</div>
          <div class="og-pot-sub">across ${topRepos.length} top repos combined</div>
        </div>

        <div class="og-sec-title">🏆 MOST FUNDABLE REPOS</div>
        <div class="og-repo-list">
          ${topRepos.map(r => {
            const { color: c } = scoreColor(r.vs)
            return `
              <div class="og-repo-row" onclick="window.location.href='https://github.com/${username}/${r.name}'">
                <div class="og-repo-row-name">${r.name}${r.lang ? `<span class="og-repo-lang">${r.lang}</span>` : ''}</div>
                <div class="og-repo-row-right">
                  <span class="og-repo-vs" style="color:${c}">${r.vs}</span>
                  <span class="og-repo-pot">${fmtMoney(r.pot)}</span>
                </div>
              </div>
            `
          }).join('')}
        </div>

        <div class="og-actions">
          <button class="og-btn-primary" onclick="window.open('http://localhost:5173/org?org=${username}','_blank')">🔍 Scan All Repos</button>
        </div>
      </div>
    `)
  }

  /* ══════════════════════════════════════════════════════════
     MODE 3 — ISSUES / BOUNTY SCANNER
  ══════════════════════════════════════════════════════════ */
  function initIssues(owner, repo) {
    setBody(`
      <div class="og-issues-wrap">
        <div class="og-sec-title">💰 BOUNTY INTELLIGENCE</div>

        <div class="og-bounty-types">
          <div class="og-btype"><span class="og-btag og-btag-help">help wanted</span><span>→ IssueHunt, Gitcoin, Bountysource</span></div>
          <div class="og-btype"><span class="og-btag og-btag-good">good first issue</span><span>→ GSoC, MLH, Outreachy</span></div>
          <div class="og-btype"><span class="og-btag og-btag-bug">bug</span><span>→ HackerOne, Bugcrowd</span></div>
          <div class="og-btype"><span class="og-btag og-btag-feat">enhancement</span><span>→ Bountysource, IssueHunt</span></div>
        </div>

        <div class="og-sec-title">🚀 POST A BOUNTY</div>
        <div class="og-platform-links">
          <a href="https://issuehunt.io" target="_blank" class="og-plink">💎 IssueHunt</a>
          <a href="https://gitcoin.co" target="_blank" class="og-plink">🌱 Gitcoin</a>
          <a href="https://www.bountysource.com" target="_blank" class="og-plink">🎯 Bountysource</a>
          <a href="https://polar.sh" target="_blank" class="og-plink">🐻 Polar.sh</a>
        </div>

        <div class="og-sec-title">📊 EXPECTED BOUNTY RANGES</div>
        <div class="og-bounty-ranges">
          <div class="og-brange"><span>🟢 Easy bug fix</span><span>$50–$500</span></div>
          <div class="og-brange"><span>🟡 Feature request</span><span>$500–$2K</span></div>
          <div class="og-brange"><span>🔴 Security vuln</span><span>$1K–$100K</span></div>
          <div class="og-brange"><span>⭐ Major feature</span><span>$2K–$10K</span></div>
        </div>

        <div class="og-actions">
          <button class="og-btn-primary" id="og-scan-issue-btn">🚀 Full Repo Analysis</button>
        </div>
      </div>
    `)

    document.getElementById('og-scan-issue-btn')?.addEventListener('click', () =>
      scanRepo('https://github.com/' + owner + '/' + repo)
    )

    // Inject bounty badges on issue rows
    injectIssueBadges()
  }

  function injectIssueBadges() {
    setTimeout(() => {
      document.querySelectorAll('[id^="issue_"], .js-issue-row').forEach(row => {
        if (row.querySelector('.og-issue-badge')) return
        const labels = [...row.querySelectorAll('[class*="Label"], .IssueLabel')]
          .map(l => l.textContent.toLowerCase().trim())
        const isBountifiable = labels.some(l =>
          l.includes('bounty') || l.includes('help wanted') || l.includes('good first issue')
        )
        if (isBountifiable) {
          const badge = document.createElement('span')
          badge.className = 'og-issue-badge'
          badge.textContent = '💰 Bountifiable'
          const title = row.querySelector('a[data-hovercard-type="issue"], .js-issue-title, h3 a')
          if (title) title.insertAdjacentElement('afterend', badge)
        }
      })
    }, 1500)
  }

  /* ══════════════════════════════════════════════════════════
     MODE 4 — TRENDING PAGE
  ══════════════════════════════════════════════════════════ */
  function initTrending() {
    setBody(`
      <div class="og-trending-wrap">
        <div class="og-sec-title">🔥 TRENDING INTEL</div>
        <p class="og-info-text">Trending repos are prime funding targets. Most have never applied for grants.</p>
        <div class="og-trending-tips">
          <div class="og-ttip">⚡ <strong>Viral repos</strong> get 3× faster grant approvals</div>
          <div class="og-ttip">🎯 <strong>Trending today</strong> → apply within 48hrs for best odds</div>
          <div class="og-ttip">💎 <strong>Niche languages</strong> (Rust, Zig, Haskell) = premium grants</div>
        </div>
        <div class="og-actions">
          <button class="og-btn-primary" onclick="window.open('http://localhost:5173/trending','_blank')">🔥 Open Trend Dashboard</button>
        </div>
      </div>
    `)
  }

  /* ══════════════════════════════════════════════════════════
     MODE 5 — GENERIC
  ══════════════════════════════════════════════════════════ */
  function initGeneric() {
    setBody(`
      <div class="og-generic-wrap">
        <p class="og-info-text">Navigate to any GitHub repository or profile to see AI funding analysis.</p>
        <div class="og-generic-modes">
          <div class="og-gmode">📁 <strong>Repo page</strong> → Viral score + grant matches</div>
          <div class="og-gmode">👤 <strong>Profile page</strong> → Developer funding potential</div>
          <div class="og-gmode">🐛 <strong>Issues page</strong> → Bounty opportunities</div>
          <div class="og-gmode">🔥 <strong>Trending page</strong> → Funding intel</div>
        </div>
        <div class="og-actions">
          <button class="og-btn-primary" onclick="window.open('http://localhost:5173','_blank')">Open Dashboard →</button>
        </div>
      </div>
    `)
  }

  /* ══════════════════════════════════════════════════════════
     ALGORITHMS
  ══════════════════════════════════════════════════════════ */
  function viralScore({ stars=0, forks=0, watchers=0, issues=0, pushed, hasDesc, hasTopics }) {
    let s = 0
    if      (stars >= 10000) s += 35
    else if (stars >= 5000)  s += 28
    else if (stars >= 1000)  s += 20
    else if (stars >= 500)   s += 14
    else if (stars >= 100)   s += 8
    else                     s += Math.min(Math.round(stars / 10), 5)

    const fr = forks / Math.max(stars, 1)
    if      (fr > 0.3)  s += 20
    else if (fr > 0.15) s += 15
    else if (fr > 0.05) s += 8
    else                s += 3

    if      (watchers >= 1000) s += 15
    else if (watchers >= 500)  s += 10
    else if (watchers >= 100)  s += 5
    else                       s += 2

    if      (issues >= 50) s += 10
    else if (issues >= 20) s += 7
    else if (issues >= 5)  s += 4
    else                   s += 1

    if (hasDesc)   s += 5
    if (hasTopics) s += 5

    if (pushed) {
      const d = (Date.now() - pushed.getTime()) / 86400000
      if      (d < 1)  s += 10
      else if (d < 7)  s += 7
      else if (d < 30) s += 4
      else             s += 1
    }
    return Math.min(s, 100)
  }

  function scoreColor(vs) {
    if      (vs >= 76) return { color: '#f87171', glow: 'rgba(248,113,113,0.35)', verdict: '🔥 Going Viral',     level: 'VIRAL'  }
    else if (vs >= 56) return { color: '#4ade80', glow: 'rgba(74,222,128,0.35)',  verdict: '✅ Funding Ready',   level: 'READY'  }
    else if (vs >= 31) return { color: '#fbbf24', glow: 'rgba(251,191,36,0.35)',  verdict: '📈 Growing Fast',    level: 'GROWING'}
    else               return { color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', verdict: '🌱 Early Stage',     level: 'EARLY'  }
  }

  function matchFunders(lang, topics, desc, vs) {
    const all = [...topics.map(t => t.toLowerCase()), (lang||'').toLowerCase(), ...desc.toLowerCase().split(/\s+/)].filter(Boolean)
    const DB = [
      { name: 'GitHub Sponsors',       amount: 'Unlimited', type: 'sponsorship', kw: ['any'],                                                      base: 85 },
      { name: 'NLnet Foundation',       amount: '$50K',      type: 'grant',       kw: ['rust','privacy','security','decentralization','networking'], base: 72 },
      { name: 'Sovereign Tech Fund',    amount: '$350K',     type: 'grant',       kw: ['infrastructure','critical','dependency','library','tools'],  base: 65 },
      { name: 'Open Tech Fund',         amount: '$960K',     type: 'grant',       kw: ['privacy','censorship','security','freedom','circumvention'], base: 60 },
      { name: 'Mozilla MOSS',           amount: '$25K',      type: 'grant',       kw: ['firefox','web','privacy','security','browser','rust'],       base: 62 },
      { name: 'Linux Foundation',       amount: '$100K',     type: 'grant',       kw: ['linux','kernel','networking','cloud','infrastructure'],      base: 58 },
      { name: 'CNCF',                   amount: '$150K',     type: 'grant',       kw: ['kubernetes','cloud','container','devops','microservices'],   base: 55 },
      { name: 'Ethereum Foundation',    amount: '$250K',     type: 'grant',       kw: ['ethereum','web3','blockchain','defi','solidity','evm'],      base: 50 },
      { name: 'Protocol Labs',          amount: '$500K',     type: 'grant',       kw: ['ipfs','filecoin','distributed','p2p','libp2p'],              base: 48 },
      { name: 'Google Summer of Code',  amount: '$6.6K',     type: 'fellowship',  kw: ['any'],                                                      base: 70 },
      { name: 'MLH Fellowship',         amount: '$5K',       type: 'fellowship',  kw: ['any'],                                                      base: 67 },
      { name: 'Gitcoin Grants',         amount: 'Variable',  type: 'bounty',      kw: ['web3','ethereum','open source','any'],                       base: 62 },
      { name: 'Rust Foundation',        amount: '$20K',      type: 'grant',       kw: ['rust','cargo','crates','rustlang'],                          base: 45 },
      { name: 'Django Software Found.', amount: '$10K',      type: 'grant',       kw: ['python','django','web'],                                    base: 40 },
    ]
    return DB.map(f => {
      let match = f.base
      if (f.kw.includes('any')) {
        match = Math.min(f.base + Math.round(vs * 0.15), 97)
      } else {
        const hits = f.kw.filter(k => all.some(c => c.includes(k))).length
        match = Math.min(f.base + hits * 10 + Math.round(vs * 0.08), 98)
      }
      return { ...f, match }
    }).sort((a, b) => b.match - a.match)
  }

  /* ── Scan repo via OpenGrant API ───────────────────────── */
  async function scanRepo(url) {
    const btn = document.getElementById('og-full-btn')
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Scanning…' }
    try {
      const res = await fetch('http://localhost:8765/api/repos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: url || window.location.href }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      window.open(`http://localhost:5173/results/${data.repo_id}`, '_blank')
    } catch {
      if (btn) { btn.textContent = '❌ Start OpenGrant first!'; btn.style.background = 'rgba(239,68,68,0.15)' }
      setTimeout(() => {
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Full AI Analysis'; btn.style.background = '' }
      }, 3000)
    }
  }

  /* ── Formatters ────────────────────────────────────────── */
  function fmtNum(n) { return n >= 1000 ? (n/1000).toFixed(1) + 'k' : String(n||0) }
  function fmtMoney(n) {
    if (!n) return '$0'
    if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M'
    if (n >= 1000)    return '$' + Math.round(n/1000) + 'K'
    return '$' + n
  }
})()
