# 🚂 RAILWAY DEPLOYMENT - 5 MINUTES

## ✅ Prerequisites Check

- [ ] Have Railway account? (https://railway.app - sign up free)
- [ ] Have GitHub access to repo?
- [ ] Have Groq API key? (https://console.groq.com)

---

## 🚀 DEPLOYMENT IN 6 STEPS

### **STEP 1: Open Railway Dashboard**

```
https://railway.app/dashboard
```

You should see:
```
┌─────────────────────────────────┐
│  + New Project                  │
│  Your Projects                  │
│  (empty if first time)          │
└─────────────────────────────────┘
```

👉 **Click: + New Project**

---

### **STEP 2: Deploy from GitHub**

You'll see options:
```
[ ] Database
[ ] Deploy from GitHub repo  ← CLICK THIS
[ ] Import Docker image
[ ] Create empty project
```

👉 **Click: Deploy from GitHub repo**

---

### **STEP 3: Select Repository**

```
🔍 Search: opengrant-dev/opengrant.dev
```

You'll see:
```
┌─────────────────────────────────────────┐
│ opengrant-dev/opengrant.dev             │
│ Open source funding operating system    │
│ [Select this repo]                      │
└─────────────────────────────────────────┘
```

👉 **Click the repo**

Then:

👉 **Click: Connect**

---

### **STEP 4: Wait for Deployment**

Railway will automatically:
- Build the Docker image
- Install dependencies
- Start the backend

```
Status: Building...
        Deploying...
        Success! ✓
```

⏳ **Wait 2-3 minutes**

You'll see:
```
✓ Building...
✓ Deploying...
✓ Status: Running
```

---

### **STEP 5: Add Environment Variables**

Once deployment is done:

1. Click: **Variables** tab

2. Click: **Add Variable**

3. Add EACH of these:

```
Name: ENVIRONMENT
Value: production
[Add]

Name: FRONTEND_URL
Value: https://opengrant.tech
[Add]

Name: GROQ_API_KEY
Value: <paste_your_groq_key_here>
[Add]

Name: RATE_LIMIT_PER_MINUTE
Value: 20
[Add]
```

**Get Groq API Key:**
```
1. Go: https://console.groq.com
2. Sign up / login
3. Click: API Keys
4. Create new key
5. Copy the key
6. Paste in Railway
```

**Optional:**
```
Name: GITHUB_TOKEN
Value: <your_github_token>
(for higher API limits)
```

👉 **After adding variables, wait 1-2 minutes for auto-redeploy**

---

### **STEP 6: Get Your Backend URL**

1. Click: **Settings** tab
2. Look for: **Domain**
3. You'll see:
```
https://opengrant-prod-production.up.railway.app
(or similar)
```

📍 **COPY THIS URL** - you'll need it for Vercel!

---

## 🧪 **TEST YOUR RAILWAY BACKEND**

### **Test 1: Health Check**

Open in browser OR terminal:
```
https://opengrant-prod-production.up.railway.app/health
```

Should show:
```json
{"status":"ok","timestamp":"2026-02-26T..."}
```

✅ If you see this, Railway is WORKING!

### **Test 2: Funding Sources**

```
https://opengrant-prod-production.up.railway.app/api/funding-sources
```

Should show JSON with 298 funding sources

✅ Data is loading!

---

## 📊 **WHAT YOU SHOULD SEE**

### **In Railway Dashboard:**
```
✓ Deployment: Running
✓ Status: Success
✓ CPU/Memory: Green
✓ Logs: No errors
✓ Domain: https://opengrant-prod-...
```

### **In Browser (health endpoint):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-26T09:15:22.123456"
}
```

### **Success Signs:**
```
✅ No 404 errors
✅ No CORS errors
✅ No timeout errors
✅ API responds in < 1 second
```

---

## ❌ **IF SOMETHING GOES WRONG**

### **"Deployment Failed"**
```
→ Click: Deployments tab
→ Select failed deployment
→ Click: View Logs
→ Look for the error message
→ Fix locally and push to GitHub
→ Railway auto-redeploys
```

### **"502 Bad Gateway"**
```
→ Wait 1-2 minutes
→ Refresh page
→ Check if variables are set
→ Restart deployment
```

### **"Can't connect to backend"**
```
→ Check: Deployment status is "Running"
→ Check: URL is correct (no typos)
→ Wait: 2-3 minutes for full initialization
→ Test: curl https://your-url/health
```

### **"API Key Error"**
```
→ Check: GROQ_API_KEY is set correctly
→ Check: No extra spaces or quotes
→ Get new key: https://console.groq.com
→ Update variable
→ Railway auto-redeploys
```

---

## 🎯 **AFTER RAILWAY IS LIVE**

```
1. ✅ Railway backend deployed
2. Save the URL: https://opengrant-prod-...
3. Next: Deploy frontend to Vercel
   → Go to https://vercel.com/new
   → Set VITE_API_URL = your Railway URL
4. Then: Connect domain opengrant.tech
```

---

## ⏱️ **TIMELINE**

```
Step 1-2: 1 minute (navigate & select)
Step 3: 1 minute (authorize)
Step 4: 2-3 minutes (build & deploy)
Step 5: 2 minutes (add variables)
Step 6: 1 minute (get URL)
Test: 1 minute (verify)
─────────────────────────
Total: 10-15 minutes
```

---

## 📝 **RAILWAY URL TO SAVE**

Once you complete Step 6, save this:

```
RAILWAY BACKEND URL:
https://opengrant-prod-production.up.railway.app

(Your actual URL may be slightly different)
```

You'll need this for Vercel deployment!

---

## ✨ **YOU'RE DONE WITH RAILWAY!**

When you see ✅ tests passing:

```
✅ Health check working
✅ API endpoints responding
✅ No error logs
✅ Status: Running
```

**Your backend is LIVE!** 🎉

---

## 🚀 **NEXT: VERCEL DEPLOYMENT**

Once Railway is working:

1. Go to: https://vercel.com/new
2. Import: opengrant-dev/opengrant.dev
3. Set: VITE_API_URL = (your Railway URL)
4. Deploy!

Questions? Check DEPLOYMENT_GUIDE.md in the repo.
