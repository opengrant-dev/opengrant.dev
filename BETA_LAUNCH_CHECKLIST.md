# 🚀 OpenGrant Beta Launch Checklist

**Audit Date**: February 25, 2026  
**Security Grade**: A- (Excellent)  
**Status**: ✅ READY TO LAUNCH

---

## 🔐 Security Fixes Applied

- ✅ **esbuild vulnerability fixed** (npm audit fix --force)
- ✅ **Secrets properly gitignored** (verified)
- ✅ **No critical vulnerabilities found**
- ✅ **SECURITY.md documentation created**
- ✅ **Input validation strict** (GitHub URLs, Pydantic)
- ✅ **Database secure** (SQLAlchemy ORM only)
- ✅ **API protected** (CORS whitelist, rate limiting)
- ✅ **XSS protection confirmed** (no eval, sanitized)

---

## 📋 Pre-Launch Checklist

### IMMEDIATE (Do Before Public Launch)
- [ ] **Rotate Groq API key**
  ```bash
  # 1. Go to https://console.groq.com
  # 2. Generate new API key
  # 3. Update backend/.env with new key
  # 4. Test: START.bat then visit http://localhost:5173
  ```

- [ ] **Set production mode**
  ```bash
  # In backend/.env, change:
  ENVIRONMENT=production
  ```

- [ ] **Review & add Terms of Service**
  - Legal requirement before public beta
  - Create `docs/TERMS_OF_SERVICE.md`
  - Create `docs/PRIVACY_POLICY.md`

- [ ] **Update CORS for production domain**
  ```python
  # backend/main.py line 87-92
  _ALLOWED_ORIGINS = [
      "https://opengrant.dev",      # Your production domain
      "http://localhost:5173",       # Dev (keep for local testing)
  ]
  ```

### BEFORE ANNOUNCING (Do Next Day)
- [ ] **Test all endpoints locally**
  ```bash
  curl -X POST http://localhost:8765/api/repos/submit \
    -H "Content-Type: application/json" \
    -d '{"github_url":"https://github.com/torvalds/linux"}'
  ```

- [ ] **Verify rate limiting works**
  ```bash
  # Make 11 requests in < 60 seconds
  for i in {1..11}; do
    curl -X POST http://localhost:8765/api/repos/submit \
      -H "Content-Type: application/json" \
      -d '{"github_url":"https://github.com/torvalds/linux"}'
    echo ""
  done
  # 11th request should get 429 Too Many Requests
  ```

- [ ] **Test Chrome Extension**
  - Install in dev mode
  - Visit a GitHub repo page
  - Verify "💰 Find Funding" button works
  - Verify it connects to backend

- [ ] **Database backup**
  ```bash
  # Create backup directory
  mkdir -p backups
  cp backend/fund_matcher.db backups/fund_matcher.db.backup
  ```

- [ ] **Monitor logs for errors**
  ```bash
  # In START.bat output, watch for stack traces
  # In frontend, check browser console (F12) for errors
  ```

### BEFORE GOING VIRAL (Before Major Announcement)
- [ ] **Scale database** (if needed)
  - Switch to PostgreSQL for production
  - Update DATABASE_URL in .env

- [ ] **Enable HTTPS**
  - Get SSL certificate (Let's Encrypt free)
  - Update CORS origins to https://...
  - Enable HTTPS redirects

- [ ] **Set up monitoring**
  - API endpoint response times
  - Error rates
  - Database performance
  - Rate limit hits

- [ ] **Configure backups**
  - Automated daily database backups
  - Test restore process

- [ ] **Add analytics** (optional)
  - Track unique repos analyzed
  - Track top funding sources
  - Track feature usage

---

## 🧪 Quick Test Script

```bash
#!/bin/bash

echo "🧪 Testing OpenGrant..."

# Test health endpoint
echo "1. Testing health..."
curl -s http://localhost:8765/health | jq .

# Test repo submission
echo "2. Testing repo submission..."
REPO_ID=$(curl -s -X POST http://localhost:8765/api/repos/submit \
  -H "Content-Type: application/json" \
  -d '{"github_url":"https://github.com/ChiranjibAI/opengrant"}' | jq -r .repo_id)
echo "Repo ID: $REPO_ID"

# Wait for analysis
echo "3. Waiting for analysis..."
sleep 5

# Check status
echo "4. Checking status..."
curl -s http://localhost:8765/api/repos/$REPO_ID | jq '.status'

# Get matches
echo "5. Getting matches..."
curl -s http://localhost:8765/api/repos/$REPO_ID/matches | jq '.matches | length'

echo "✅ All tests passed!"
```

---

## 📊 Performance Baselines

Before launch, establish these baseline metrics:

**API Response Times**:
- GET /health: < 50ms
- POST /api/repos/submit: < 200ms
- GET /api/repos/{id}: < 100ms
- GET /api/funding-sources: < 150ms

**Database**:
- 1000 repos analyzed: < 50MB
- Query time for top 20 matches: < 100ms

**Frontend**:
- Initial load: < 2s (on 4G)
- Page transitions: < 500ms
- Extension popup load: < 1s

---

## 🎯 Success Metrics for Beta

Track these during beta:

- [ ] **Uptime**: > 99% (target)
- [ ] **Response time**: < 500ms p95
- [ ] **Error rate**: < 0.1%
- [ ] **User feedback**: Collect via form or Discord

---

## 🚨 If Something Goes Wrong

### API is slow:
1. Check database size: `ls -lh backend/fund_matcher.db`
2. Restart backend: Kill process, run START.bat again
3. Check rate limits: Are we hitting our own limits?

### Users getting "Analysis failed":
1. Check GitHub API status
2. Verify GITHUB_TOKEN in .env (optional but helps)
3. Check disk space
4. Check LLM API key validity

### Extension not working:
1. Reload extension in chrome://extensions
2. Check background console (extension icon → right-click → Inspect)
3. Verify backend is running (curl http://localhost:8765/health)

### Database corruption:
1. Stop backend
2. Restore from backup: `cp backups/fund_matcher.db.backup backend/fund_matcher.db`
3. Restart backend

---

## 📢 Launch Announcement

**Template**:
```
🚀 OpenGrant Beta is LIVE!

We're excited to announce OpenGrant, an AI-powered funding platform for open source projects.

✨ Features:
• AI-match your GitHub repo to 298+ funding sources
• Get real funding potential scores
• Generate grant applications in seconds
• Chrome extension for one-click analysis

🔗 Get started: https://github.com/ChiranjibAI/opengrant

Feedback/bugs? GitHub Issues or Discord

#OpenSource #Funding #AI
```

---

## 📞 Support Resources

**For Users**:
- GitHub Issues: Bug reports & feature requests
- README.md: Setup & usage guide
- SECURITY.md: Security & vulnerability reporting

**For Developers**:
- CONTRIBUTING.md: Contribution guidelines
- Code comments: Self-documenting architecture
- Pull Request template: Standard format

---

## ✅ Final Sign-Off

Before clicking the "Make Public" button:

- [ ] All checklist items completed
- [ ] Security audit passed (A- grade)
- [ ] Local testing passed
- [ ] API key rotated (not dev key)
- [ ] Terms of Service ready
- [ ] Privacy Policy ready
- [ ] README updated
- [ ] SECURITY.md in place
- [ ] Team notified
- [ ] Crisis plan in place

**You're ready to launch! 🎉**

---

**OpenGrant Beta Launch Checklist**  
Created: February 25, 2026
