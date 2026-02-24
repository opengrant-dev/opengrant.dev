<div align="center">

```
 ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗  █████╗ ███╗   ██╗████████╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝ ██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║  ███╗██████╔╝███████║██╔██╗ ██║   ██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║╚██╗██║   ██║
╚██████╔╝██║     ███████╗██║ ╚████║╚██████╔╝██║  ██║██║  ██║██║ ╚████║   ██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝
```

#### The open source funding discovery platform, powered by AI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Stars](https://img.shields.io/github/stars/ChiranjibAI/opengrant?style=social)](https://github.com/ChiranjibAI/opengrant/stargazers)

**[View Demo](https://github.com/ChiranjibAI/opengrant) · [Report Bug](https://github.com/ChiranjibAI/opengrant/issues) · [Request Feature](https://github.com/ChiranjibAI/opengrant/issues)**

</div>

---

## What is OpenGrant?

> Paste your GitHub repo URL → AI scans it → Get matched with **183+ funding sources** in 30 seconds. Free.

OpenGrant is a **free, self-hostable, open source** platform that uses AI to match your GitHub repository with grants, hackathons, bug bounties, sponsorships, and accelerators worldwide — from government programs to Web3 protocols to global foundations.

Works with **any OpenAI-compatible API** — Groq free tier recommended (no credit card needed).

---

## Demo

```
$ Input: github.com/your-org/your-repo

  Fetching repo data...                    done in 1.3s
  Running AI matching (183 sources)...     done in 28s

  24 funding matches found!

  #1  Sovereign Tech Fund       94/100   $100K–$1M      Rolling
  #2  NLnet Foundation          91/100   $5K–$50K       Quarterly
  #3  Mozilla MOSS              88/100   $10K–$500K     Rolling
  #4  Google Summer of Code     85/100   $1.5K–$6.6K    Annual
  #5  NSF SBIR/STTR             82/100   $250K–$2M      Quarterly
  ...19 more matches

  Fundability Grade: B+  (74/100)
  Top tip: Add FUNDING.yml to enable GitHub Sponsors (+12 pts)
```

---

## Features

| Feature | Description |
|---|---|
| 🤖 **AI Matching** | LLM scores your repo against 183+ sources with reasoning, strengths & gaps |
| ✍️ **Application Writer** | AI generates complete, ready-to-submit grant applications per source |
| 📊 **Fundability Score** | Rule-based A–F grade with specific actionable improvement tips |
| 📋 **Application Tracker** | Kanban board: Saved → Applied → Following Up → Won |
| 📅 **Deadline Calendar** | All deadlines in one view + Google Calendar export (.ics) |
| 🔍 **Org Scanner** | Bulk scan every repo in a GitHub org/user account at once |
| 🗺️ **Dependency Map** | Check if your npm/pip dependencies are funded or at risk |
| 🏷️ **README Badge** | Dynamic SVG badge showing live funding match count for your repo |

---

## 183+ Funding Sources

```
GOVERNMENT
  India    Startup India · MeitY Startup Hub · iDEX · Kerala Startup Mission
  USA      NSF SBIR/STTR ($2M) · ARPA-E · Knight Foundation · Omidyar Network
  EU       Horizon Europe ($10M) · Sovereign Tech Fund · NLnet · Prototype Fund
  UK       Innovate UK · UKRI Digital Security · Open UK
  Canada   NRC IRAP · Canada Digital Adoption Program
  More     Australia (CSIRO) · Singapore (EDG) · Japan (IPA MITOU) · UAE · Africa

CRYPTO / WEB3  (40+ protocols)
  Ethereum · Solana · Polygon · Chainlink · Uniswap ($2M) · Aave · Compound
  StarkNet · zkSync · Aptos · Sui · Arbitrum · Cardano · TON · LayerZero · more

HACKATHONS  (20+ events)
  MLH · Google Summer of Code · ETHGlobal · DoraHacks · HackMIT · TreeHacks
  NASA Space Apps · IBM Call for Code · Buildspace · Encode Club · and more

BUG BOUNTIES  (25+ programs)
  Google · Apple ($1M) · GitHub · OpenAI · Microsoft · Meta · Coinbase
  Binance ($1M) · Ethereum · Solana ($1M) · Uniswap ($2M) · Shopify · Stripe

GLOBAL ORGANIZATIONS
  UNDP (91 countries) · UNICEF · World Bank · Digital Public Goods Alliance
  Mozilla · Ford Foundation · Shuttleworth · CZI (EOSS) · Schmidt Futures

ACCELERATORS & SPONSORSHIPS
  Y Combinator · NVIDIA Inception · AWS Activate · Google for Startups
  GitHub Sponsors · Open Collective · Patreon · Tidelift · Ko-fi
```

---

## Quick Start

**Windows — double click**

```
1. Download ZIP and extract
2. Open backend/.env → add your API key
3. Double-click SETUP.bat    (installs everything, run once)
4. Double-click START.bat    (launches app + opens browser)
```

**Mac / Linux — terminal**

```bash
git clone https://github.com/ChiranjibAI/opengrant
cd opengrant

# Backend
cd backend
cp .env.example .env     # add your LLM_API_KEY
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd ../frontend
npm install && npm run dev

# Open http://localhost:5173
```

---

## API Key Setup — Free

| Provider | Speed | Cost | Link |
|---|---|---|---|
| **Groq** ⭐ recommended | ⚡ Fastest | **Free** | [console.groq.com](https://console.groq.com) |
| Together AI | Fast | Free $25 credit | [api.together.ai](https://api.together.ai) |
| OpenRouter | Fast | Free tier | [openrouter.ai](https://openrouter.ai) |
| Mistral | Fast | Free tier | [console.mistral.ai](https://console.mistral.ai) |
| OpenAI | Medium | Paid | [platform.openai.com](https://platform.openai.com) |

```env
# backend/.env
LLM_API_KEY=your_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

---

## Tech Stack

```
Backend                          Frontend
───────────────────────────────  ─────────────────────────────
FastAPI          REST API        React 18        UI framework
SQLAlchemy       ORM             Vite            build tool
SQLite           database        TailwindCSS     styling
OpenAI SDK       LLM client      Framer Motion   animations
httpx            async HTTP      React Router    navigation
slowapi          rate limiting   axios           API calls
```

---

## Project Structure

```
opengrant/
├── backend/
│   ├── main.py                FastAPI app + all API endpoints
│   ├── matcher.py             AI matching engine (LLM scoring)
│   ├── funding_db.py          183+ funding sources database
│   ├── application_writer.py  AI grant application generator
│   ├── fundability.py         rule-based repo scoring
│   ├── org_scanner.py         GitHub org bulk scanner
│   ├── badge.py               SVG badge generator
│   ├── github_api.py          GitHub API client
│   ├── models.py              SQLAlchemy models
│   └── .env.example           configuration template
├── frontend/src/
│   ├── pages/                 Home · Results · Applications · Calendar · OrgScanner · DepsMap
│   ├── components/            Navbar · MatchCard · FundabilityPanel · ApplicationModal
│   └── hooks/                 useApi · useStats
├── SETUP.bat                  Windows one-click installer
├── START.bat                  Windows one-click launcher
├── HOW_TO_USE.txt             full user guide
└── CONTRIBUTING.md            contribution guidelines
```

---

## Contributing

Any contribution is **greatly appreciated**.

**Easy first contributions:**
- 💰 Add a funding source you know in `backend/funding_db.py`
- 🌍 Translate HOW_TO_USE.txt to your language
- 🐛 Report a bug via [Issues](https://github.com/ChiranjibAI/opengrant/issues)
- ⭐ Star the repo to help others discover it

```bash
git checkout -b feature/your-feature
git commit -m "feat: add amazing feature"
git push origin feature/your-feature
# Open a Pull Request
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## License

MIT License — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

<div align="center">

**If OpenGrant helped you find funding, please ⭐ star this repo — it helps the whole OSS community discover it!**

Built with ❤️ by [ChiranjibAI](https://github.com/ChiranjibAI) · Open to all contributions

</div>
