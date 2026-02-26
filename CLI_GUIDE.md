# OpenGrant CLI Tool Guide

**Command:** `python opengrant.py`

---

## Starting the CLI

```bash
cd "C:\Users\black\Desktop\Open source fund"
python opengrant.py
```

This launches the **CHIRANJIB COMMAND CENTER** interactive menu.

---

## Available Features

### 📡 FULL SYSTEM SCAN (Grants + Metrics)
- Analyzes a GitHub repository
- Calculates fundability score (0-100)
- Shows best funding matches
- Displays key metrics: contributors, commit frequency, health grade

**Input:** GitHub repository URL

### 📅 GENERATE 90-DAY ROADMAP (Calendar)
- Creates a strategic 90-day development roadmap
- AI-powered predictions
- Timeline-based milestones

**Input:** GitHub repository URL

### 💼 OPTIMIZE GRANT PORTFOLIO
- Analyzes multiple grants together
- Avoids conflicts between funders
- Suggests optimal combination
- Uses greedy optimization algorithm

**Input:** GitHub repository URL

### 🎯 SEARCH LIVE BOUNTIES
- Finds active GitHub bounties/funding
- Searches with custom queries
- Shows amount, title, link

**Input:** Search query (default: `label:bounty`)

### 📝 DRAFT PRO APPLICATION
- Generates professional grant applications
- AI-written sections:
  - Executive Summary
  - Technical Merit
  - Impact Statement
  - Budget Justification

**Input:** Repository URL + Funding Source ID

### 💰 GENERATE MONETIZATION STRATEGY
- Suggests revenue models for your project
- Multiple monetization channels
- Generates funding.yml config

**Input:** GitHub repository URL

### 🌐 DEPLOY WEB INTERFACE
- Launches the web app (React frontend + FastAPI backend)
- Opens port 5173 (frontend) and 8765 (backend)
- Equivalent to running `START.bat`

### ⚙️  API CONFIGURATION
- Configure LLM providers (Groq, OpenAI, Anthropic, etc.)
- Set GitHub token
- View current settings

---

## Requirements

**Python dependencies:**
- `typer` - CLI framework
- `questionary` - Interactive menu
- `rich` - Beautiful terminal output
- `dotenv` - Environment variables

All included in project dependencies.

**API Keys:**
At least one LLM provider must be configured:
1. **Groq** (FREE, recommended) - `GROQ_API_KEY`
2. **OpenAI** - `OPENAI_API_KEY`
3. **Anthropic** - `ANTHROPIC_API_KEY`
4. **Google Gemini** - `GEMINI_API_KEY`
5. **NVIDIA NIM** - `NVIDIA_API_KEY`
6. **OpenRouter** - `OPENROUTER_API_KEY`
7. **Ollama** (local) - `OLLAMA_BASE_URL`

**GitHub Token:**
Optional but recommended for higher API rate limits:
- Set `GITHUB_TOKEN` in `backend/.env`
- Get it from: https://github.com/settings/tokens

---

## Usage Examples

### Example 1: Scan a Repository
```
python opengrant.py
→ Select: "📡 FULL SYSTEM SCAN (Grants + Metrics)"
→ Enter: https://github.com/owner/repo
→ View: Fundability score, metrics, best matches
```

### Example 2: Generate 90-Day Roadmap
```
python opengrant.py
→ Select: "📅 GENERATE 90-DAY ROADMAP (Calendar)"
→ Enter: https://github.com/owner/repo
→ View: Strategic timeline with milestones
```

### Example 3: Find Bounties
```
python opengrant.py
→ Select: "🎯 SEARCH LIVE BOUNTIES"
→ Enter: "python" (or custom search term)
→ View: Active bounties with amounts
```

### Example 4: Configure API
```
python opengrant.py
→ Select: "⚙️  API CONFIGURATION"
→ Choose your LLM provider
→ Paste API key
→ Save
```

---

## Notes

- **Menu-driven:** All features accessible through interactive menu
- **Interactive:** Uses `questionary` for prompts
- **Real-time:** Connects to GitHub API and AI providers
- **Async:** Uses asyncio for non-blocking operations
- **Status Updates:** Shows progress spinners during processing

---

## Troubleshooting

**"Module not found" errors:**
```bash
pip install -r backend/requirements.txt
```

**"No API key detected" warning:**
- Run CLI tool
- Select "⚙️  API CONFIGURATION"
- Choose provider and enter key

**Unicode encoding errors (Windows):**
- Already fixed in latest version
- If still occurring, ensure Python 3.8+

**GITHUB_TOKEN invalid:**
- Generate new token at: https://github.com/settings/tokens
- Update in `backend/.env`
- Restart CLI

---

**Developer:** Chiranjib
**Version:** 2.0 Pro
**Status:** ✓ Production Ready
