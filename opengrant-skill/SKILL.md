# OpenGrant — AI Funding Intelligence Skill

## Purpose

OpenGrant is a local AI-powered funding engine running at `http://localhost:8765`. Use this skill whenever the user:
- Shares a GitHub repository URL
- Asks about grants, funding, hackathons, bug bounties, or sponsorships
- Wants to know how much money their open source project could get
- Asks to write a grant application
- Wants to find funding opportunities
- Mentions NLnet, Mozilla, GSoC, ETHGlobal, or any other grant program
- Asks "kya mujhe funding mil sakti hai" or any funding-related question

## When NOT to Use

- General coding questions not related to funding
- When the user explicitly says they don't want funding info

## Requirements

- OpenGrant backend must be running at `http://localhost:8765`
- If backend is offline, tell user: "OpenGrant backend band hai. START.bat chalao pehle."
- Use `curl` commands to call the API

---

## WORKFLOW — Step by Step

### Step 1: Check if backend is alive
```bash
curl -s http://localhost:8765/health
```
If fails → tell user to run START.bat. Do not proceed.

### Step 2: Submit repo for scanning
```bash
curl -s -X POST http://localhost:8765/api/repos/submit \
  -H "Content-Type: application/json" \
  -d '{"github_url": "GITHUB_URL_HERE"}'
```
Save the `repo_id` from response.

### Step 3: Wait for AI analysis (poll status)
```bash
curl -s http://localhost:8765/api/repos/REPO_ID/status
```
Poll every 3 seconds until `status` is `completed`. Max 60 seconds.

### Step 4: Get full results
```bash
curl -s http://localhost:8765/api/repos/REPO_ID/results
```

### Step 5: Present results in clean Telegram format

Format results like this:
```
💰 *OpenGrant Analysis*

📦 *Repo:* owner/name
⭐ Stars: X | 🍴 Forks: Y | 📝 Language: Z

🎯 *Fundability Score:* A/100 — [Grade]

💎 *Funding Potential:* $XXK–$XXXK

🏆 *Top Matches:*
1. NLnet Foundation — $50K — 92% match
2. Mozilla MOSS — $25K — 87% match
3. GitHub Sponsors — Unlimited — open

📋 *Apply:* [link to results page]

Want me to:
• 📝 Write a grant application?
• 🧬 DNA match with funded repos?
• 📅 Create a 90-day roadmap?
• ⚡ Check funding velocity?
```

---

## ALL API ENDPOINTS

### Submit & Scan
```bash
# Submit repo
curl -s -X POST http://localhost:8765/api/repos/submit \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/owner/repo"}'

# Check status
curl -s http://localhost:8765/api/repos/{repo_id}/status

# Get results
curl -s http://localhost:8765/api/repos/{repo_id}/results
```

### Advanced Analysis (after scanning)
```bash
# DNA Match — compare with 43+ funded OSS repos
curl -s http://localhost:8765/api/repos/{repo_id}/dna

# Portfolio Optimizer — best grant stack, no conflicts
curl -s http://localhost:8765/api/repos/{repo_id}/portfolio

# Velocity Dashboard — weeks until grant-ready
curl -s http://localhost:8765/api/repos/{repo_id}/velocity

# 90-Day Roadmap (POST with funding IDs)
curl -s -X POST http://localhost:8765/api/repos/{repo_id}/roadmap \
  -H "Content-Type: application/json" \
  -d '{"funding_ids": [1, 2, 3]}'

# Generate Grant Application
curl -s -X POST http://localhost:8765/api/repos/{repo_id}/generate-application \
  -H "Content-Type: application/json" \
  -d '{"funder_name": "NLnet Foundation", "funder_type": "grant"}'
```

### Browse Funders & Stats
```bash
# All 298 funding sources
curl -s http://localhost:8765/api/funding-sources

# Platform stats
curl -s http://localhost:8765/api/stats

# Trending repos with funding potential
curl -s "http://localhost:8765/api/trending?period=weekly"

# Leaderboard — most fundable repos
curl -s "http://localhost:8765/api/leaderboard?limit=10"
```

---

## CONVERSATION EXAMPLES

### User sends GitHub URL:
```
User: https://github.com/torvalds/linux
```
→ Auto-scan immediately. Don't ask for permission. Show full results.

### User asks about funding:
```
User: mujhe apne project ke liye funding chahiye
```
→ Ask for GitHub URL, then scan.

### User asks to write application:
```
User: NLnet ke liye application likh do
```
→ Check if repo already scanned. If yes, call generate-application API.
   If no, ask for GitHub URL first.

### User asks about funders:
```
User: kaun kaun se grants available hain Rust projects ke liye?
```
→ Call /api/funding-sources, filter by relevant ones, present top 10.

### User asks about trending:
```
User: aaj kaunsa repo viral ho raha hai?
```
→ Call /api/trending, show top 5 with funding potential.

---

## RESPONSE FORMATTING FOR TELEGRAM

Always use Telegram markdown:
- `*bold*` for section headers
- `` `code` `` for repo names
- Use emojis liberally — users love them
- Keep responses under 3000 chars for Telegram
- Use numbered lists for grant matches
- Always end with "Aur kya chahiye?" or actionable next step

### Score interpretation:
- 90-100: 🔥 VIRAL — apply immediately to top grants
- 70-89:  ✅ Excellent — strong candidate
- 50-69:  📈 Good — ready for most grants
- 30-49:  🌱 Growing — focus on beginner grants
- 0-29:   💡 Early — GitHub Sponsors + GSoC recommended

### Grade interpretation:
- A+/A: Top 5% — major grant eligible
- B: Good — foundation grants
- C: Average — platform/corporate grants
- D/F: Early stage — micro-grants only

---

## ERROR HANDLING

If backend offline:
> "⚠️ OpenGrant backend chal nahi raha. START.bat double-click karo, phir dobara bhejo."

If GitHub URL invalid:
> "GitHub URL sahi nahi hai. Format: https://github.com/owner/repo"

If repo scan fails:
> "Repo scan nahi ho paya. Private repo toh nahi? Ya phir ek baar try karo."

If rate limited:
> "Thoda wait karo (30 sec) — API limit hit hui. Phir try karo."

---

## PROACTIVE BEHAVIOR

When user shares ANY GitHub URL (even if not asking for funding):
→ Automatically run a quick scan and say:
"GitHub repo dekha! 👀 Kya funding check karoon? OpenGrant se ek second mein pata lag jayega."

When user mentions they just pushed/released code:
→ Suggest scanning for funding opportunities

When user complains about no income from their OSS work:
→ Immediately offer to scan their GitHub profile for funding

---

## DASHBOARD LINK

Always include link to full dashboard for detailed view:
`http://localhost:5173/results/{repo_id}`

For browsing funders: `http://localhost:5173/funders`
For trending: `http://localhost:5173/trending`
For leaderboard: `http://localhost:5173/leaderboard`
