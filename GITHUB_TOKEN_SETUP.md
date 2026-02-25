# GitHub Token Setup Guide

## Why You Need a GitHub Token

When analyzing repositories, OpenGrant makes API calls to GitHub to fetch:
- Repository statistics
- README files
- Topics
- Contributors count
- Commit activity

**Without a GitHub Token:**
- ⚠️ Rate limited to **60 requests per hour**
- ❌ Scans fail after ~5-10 repos
- 🚫 Error: `401 Unauthorized` or `403 Rate Limit Exceeded`

**With a GitHub Token:**
- ✅ Rate limit: **5000 requests per hour**
- ✅ Analyze 100+ repos without issues
- ✅ Faster API responses

**TL;DR:** You don't *need* a token, but analysis will fail after ~5-10 repos without one.

---

## Getting Your GitHub Token (FREE)

### Step 1: Go to GitHub Settings
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**

### Step 2: Configure the Token
1. **Token name:** `OpenGrant` (or any name)
2. **Expiration:** `No expiration` (optional, can set 90 days)
3. **Scopes:** Uncheck all boxes except:
   - ✅ `repo` (only check read access - you don't need write)
   - Actually, uncheck `repo` entirely and check only:
   - ✅ `public_repo` (read-only access to public repos)

### Step 3: Copy & Save
1. Click **"Generate token"**
2. **Copy the token immediately** (you won't see it again)
3. Keep it safe - don't share it publicly

---

## Adding Token to OpenGrant

### Option 1: Edit .env File (Easiest)
1. Open `backend/.env` in a text editor
2. Find this line:
   ```
   # GITHUB_TOKEN=ghp_...
   ```
3. Uncomment and paste your token:
   ```
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```
4. Save the file
5. Restart the backend (close and reopen START.bat)

### Option 2: Set Environment Variable
**Windows Command Prompt:**
```cmd
set GITHUB_TOKEN=ghp_your_token_here
START.bat
```

**Windows PowerShell:**
```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
.\START.bat
```

### Option 3: Run SETUP.bat Again
1. If you didn't get prompted for GitHub token during setup
2. Run SETUP.bat again
3. It will ask for your GitHub token

---

## Verify It Works

After setting the token:

1. Open http://localhost:5173 in your browser
2. Try analyzing a repo
3. If it works, you should see results instantly
4. If it fails, check:
   - Token is correct (copy-pasted exactly)
   - Token hasn't expired
   - Backend is running (http://localhost:8765/docs)

### Check Rate Limit Status

Visit this URL in your browser:
```
http://localhost:8765/api/stats
```

You should see your rate limit info.

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Token is invalid/expired | Check token is correct, regenerate if needed |
| `403 Rate Limit Exceeded` | No token or token expired | Add/update token in .env |
| `404 Not Found` | Repo doesn't exist | Check GitHub URL is correct |
| Slow analysis | Using free tier (60/hour) | Add GitHub token to speed up |

---

## Token Security

⚠️ **IMPORTANT:**
- `.env` file is in `.gitignore` — it's never committed to git ✅
- Keep your token private — anyone with it can access your public repos
- If you accidentally commit a token:
  - Regenerate it immediately at https://github.com/settings/tokens
  - The old one becomes useless

---

## Optional: Create Separate Token

You can create multiple tokens for different purposes:

1. One token for OpenGrant (read-only, public repos only)
2. One for GitHub CLI (full access)
3. One for other apps

This way, if one leaks, you only revoke that specific token.

---

## Next Steps

✅ Token added → Restart backend → Try analyzing repos!

If you don't want to set up a token:
- You can still use OpenGrant
- Analysis just fails after ~5-10 repos
- Then you'll get the 401/403 error and add the token

Recommended: **Spend 1 minute now to add the token, save yourself frustration later!** 🚀
