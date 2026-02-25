# OpenGrant Windows Setup Guide

## If Windows Blocks the Batch Files

Windows SmartScreen may block SETUP.bat and START.bat. Here's how to unblock them:

### Method 1: Unblock Files (Recommended)

1. **Right-click SETUP.bat** → **Properties**
2. At the bottom, check if there's an **"Unblock"** button/checkbox
3. Click **Unblock** → **Apply** → **OK**
4. Repeat for START.bat

Now you can double-click the batch files normally.

### Method 2: Run as Administrator

1. Right-click SETUP.bat → **Run as administrator**
2. Click **Run** if prompted
3. Same for START.bat

### Method 3: PowerShell (If Batch Files Won't Run)

Open PowerShell as Administrator and run:

```powershell
cd "C:\Users\black\Desktop\Open source fund"
.\SETUP.bat
```

Then after setup:
```powershell
.\START.bat
```

## Verify Everything Works

### After Running SETUP.bat

- ✓ Python packages installed
- ✓ Node.js packages installed
- ✓ backend\.env created with API key

### After Running START.bat

You should see:
1. **Backend window** opens with "Uvicorn running on http://0.0.0.0:8765"
2. **Frontend window** opens with "Local: http://localhost:5173"
3. **Browser opens** to http://localhost:5173

### If localhost doesn't open:

1. Go to http://localhost:5173 in your browser manually
2. Check that both backend and frontend windows are running
3. If backend shows errors, check your API key in backend\.env

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Python not found" | Install Python 3.10+ and add to PATH |
| "Node.js not found" | Install Node.js 18+ from nodejs.org |
| "npm install failed" | Delete frontend\node_modules and run SETUP.bat again |
| Backend won't start | Check Python version: `python --version` |
| Frontend won't start | Check Node.js version: `node --version` |
| Localhost not opening | Manually visit http://localhost:5173 in browser |
| API errors | Check API key in backend\.env matches your provider |

## Which LLM Provider to Use?

Edit `backend\.env` and uncomment ONE provider:

```
# Free options:
GROQ_API_KEY=gsk_...          # Recommended - get from console.groq.com
NVIDIA_API_KEY=nvapi-...      # Free from build.nvidia.com

# Premium options:
OPENAI_API_KEY=sk-...         # ChatGPT - from platform.openai.com
ANTHROPIC_API_KEY=sk-ant-...  # Claude - from console.anthropic.com
GEMINI_API_KEY=...            # Gemini - from aistudio.google.com

# Local option:
OLLAMA_BASE_URL=http://localhost:11434/v1  # Run locally, no API key needed
```

## Getting Your API Key

### Groq (FREE, Recommended)
1. Go to https://console.groq.com
2. Sign up with Google
3. Create API Key → Copy → Paste in SETUP.bat popup

### OpenAI (ChatGPT)
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy and paste in backend\.env

### Anthropic (Claude)
1. Go to https://console.anthropic.com
2. Create API key
3. Copy and paste in backend\.env

### Google Gemini
1. Go to https://aistudio.google.com/apikey
2. Create API key
3. Copy and paste in backend\.env

### NVIDIA NIM (FREE)
1. Go to https://build.nvidia.com
2. Create API key
3. Copy and paste in backend\.env

### Local Ollama
1. Download Ollama from https://ollama.ai
2. Run: `ollama run llama2`
3. Ollama auto-runs on localhost:11434 (no API key needed)

## Next Steps

Once everything is running:

- **Website**: http://localhost:5173
- **API Docs**: http://localhost:8765/docs
- **Dashboard**: Full funding analysis dashboard
- **Chrome Extension**: Load unpacked from `extension/` folder

---

**Need help?** Check GitHub Issues or review the main README.md
