# OpenGrant Deployment Guide

## Quick Deploy (Vercel + Railway)

### Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)
- OpenGrant.tech domain (already registered)
- API keys: Groq, OpenAI, or other LLM provider

---

## Step 1: Deploy Backend to Railway

### 1.1 Connect GitHub to Railway
1. Go to https://railway.app
2. Sign up / Log in with GitHub
3. New Project → Deploy from GitHub repo
4. Select: `opengrant-dev/opengrant.dev`
5. Click "Deploy Now"

### 1.2 Configure Environment Variables
In Railway dashboard, go to **Variables**:

```
ENVIRONMENT=production
FRONTEND_URL=https://opengrant.tech
GROQ_API_KEY=your_groq_api_key
# OR use another provider:
# OPENAI_API_KEY=your_openai_key
# ANTHROPIC_API_KEY=your_anthropic_key
GITHUB_TOKEN=your_github_token (optional)
RATE_LIMIT_PER_MINUTE=20
```

### 1.3 Get Backend URL
After deployment, Railway will assign a URL like:
```
https://opengrant-prod.up.railway.app
```
Save this URL - you'll need it for the frontend.

### 1.4 Create Custom Domain (Optional)
In Railway → Settings → Custom Domain
- Add: `api.opengrant.tech`
- Update DNS: Create CNAME record pointing to Railway

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect GitHub to Vercel
1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Import Project → Select `opengrant-dev/opengrant.dev`
4. Configure:
   - **Framework**: Vite
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Root Directory**: `./` (leave blank)

### 2.2 Set Environment Variables
In Vercel → Settings → Environment Variables:

```
VITE_API_URL=https://opengrant-prod.up.railway.app
```

If using custom API domain:
```
VITE_API_URL=https://api.opengrant.tech
```

### 2.3 Deploy
Click "Deploy" - Vercel will build and deploy automatically.

### 2.4 Add Custom Domain
In Vercel → Settings → Domains:
1. Add domain: `opengrant.tech`
2. Follow DNS setup instructions
3. Update your domain registrar (Namecheap, GoDaddy, etc.)

---

## Step 3: Configure CORS for Production

The backend CORS is automatically configured to accept your production domain. Verify in `backend/main.py`:

```python
_ALLOWED_ORIGINS = [
    "https://opengrant.tech",
    "https://www.opengrant.tech",
    "http://localhost:5173",  # dev
]
```

If you need to update, edit the file and push to GitHub - both services will redeploy automatically.

---

## Step 4: Verify Deployment

### Test Backend
```bash
curl https://opengrant-prod.up.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend
1. Open: https://opengrant.tech
2. Enter a GitHub URL
3. Click "Find Funding"
4. Should see results from the backend

### Test API
```bash
curl -X POST https://opengrant-prod.up.railway.app/api/repos/submit \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/torvalds/linux"}'
```

---

## Step 5: Local Development (After Deployment)

Users can still run locally:

### Option A: Use Production API
```bash
cd frontend
export VITE_API_URL=https://opengrant-prod.up.railway.app
npm run dev
```
Opens http://localhost:5173 with production backend

### Option B: Run Everything Locally
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 (optional) - CLI
python opengrant.py
```

---

## Monitoring & Maintenance

### Railway Dashboard
- Check logs: Railway → Deployment → Logs
- Monitor CPU/Memory: Railway → Metrics
- View errors: Railway → Logs tab

### Vercel Dashboard
- Check deployments: Vercel → Deployments
- Monitor performance: Vercel → Analytics
- View errors: Vercel → Function Logs

### Update Code
1. Push changes to GitHub `main` branch
2. Both Vercel and Railway auto-redeploy
3. No manual deployment needed

---

## Troubleshooting

### "Cannot find module" on Railway
- Check `Procfile` - should reference correct path
- Verify `requirements.txt` has all dependencies
- Check Dockerfile uses correct Python version (3.11)

### Frontend shows "OFFLINE" status
- Check `VITE_API_URL` is correctly set in Vercel
- Verify Railway backend is running (check Railway logs)
- Check CORS headers - backend should allow frontend domain

### CORS errors
- Update `_ALLOWED_ORIGINS` in `backend/main.py`
- Include both `opengrant.tech` and `www.opengrant.tech`
- Redeploy by pushing to GitHub

### Rate limiting issues
- Increase `RATE_LIMIT_PER_MINUTE` in Railway env vars
- Default: 20/min (suitable for MVP)

---

## Rollback

If something breaks:

### Vercel
- Deployments → Select previous deployment → "Promote to Production"

### Railway
- Deployments → Select previous deployment → Redeploy

---

## Cost Estimation

| Service | Tier | Cost |
|---------|------|------|
| Railway | Free (up to $5/mo) | $0 / month |
| Vercel | Free | $0 / month |
| Domain | OpenGrant.tech | $15/year (paid separately) |
| **Total** | | **Free (+ domain)** |

Railway and Vercel both offer generous free tiers suitable for MVP.

---

## Support

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- OpenGrant Issues: https://github.com/opengrant-dev/opengrant.dev/issues

---

**Deployment Status**: Ready to deploy ✓
