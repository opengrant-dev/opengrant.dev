# 🔒 Security Policy

## Overview
OpenGrant is designed with security-first principles. This document outlines our security practices and how to report vulnerabilities.

## Security Audit Status
**Last Audit**: February 25, 2026
**Grade**: A- (Excellent)
**Status**: ✅ Production-Ready

**No critical vulnerabilities found.** See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for full details.

---

## How We Keep You Safe

### 🛡️ Input Validation
- **GitHub URLs** validated with strict regex pattern
- All POST requests validated with Pydantic models
- Prevents injection attacks

### 🔐 Database Security
- **SQLAlchemy ORM** used exclusively (no raw SQL queries)
- Parameterized queries prevent SQL injection
- UUID primary keys instead of sequential IDs
- SQLite with proper async handling

### 🌐 API Security
- **CORS** restricted to known origins (no wildcards)
- **Rate limiting** per endpoint:
  - POST /api/repos/submit: 10/minute
  - POST /api/scan: 5/minute
  - GET /api/bounties: 5/minute
- HTTP methods restricted to GET/POST only
- No credentials sent with CORS requests

### 🔒 Secrets Management
- `.env` files are **gitignored** and never committed
- API keys stored locally only
- `.env.example` template provided
- Each user configures their own API key

### 🧩 Extension Security
- Chrome Extension uses content script sandboxing
- Safe HTML sanitization (esc() function)
- No `eval()` or `Function()` calls
- Minimal permissions requested
- Only accesses GitHub and local API

### ✅ Code Quality
- No `eval()`, `exec()`, `__import__()` calls
- No dangerous subprocess patterns
- No file upload endpoints
- Proper error handling without exposing internals

---

## Environment Variables

### Required
```
LLM_API_KEY=<your-groq-api-key>
```
Get free key: https://console.groq.com

### Optional
```
GITHUB_TOKEN=<your-github-token>  # Higher rate limits (optional)
```

### Never Commit `.env` Files
These are automatically ignored by git:
- `backend/.env`
- `frontend/.env`
- `backend/settings.json`

---

## Reporting Vulnerabilities

If you discover a security vulnerability in OpenGrant:

1. **Do NOT create a public GitHub issue**
2. **Email security details to**: ChiranjibAI@users.noreply.github.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact

4. **Expect a response within 48 hours**

---

## Security Audit Results (Feb 25, 2026)

### ✅ PASSED
- Input validation (strict GitHub URL regex)
- Database security (SQLAlchemy ORM only, no raw SQL)
- API security (CORS whitelist, rate limiting)
- Secrets management (gitignore verified)
- XSS protection (sanitized extension code)
- No eval/exec/dangerous patterns

### ⚠️ FIXED
- esbuild vulnerability (npm audit fix --force applied)

### Grade: A- (Excellent) — Production Ready

See full audit: [Audit Report](#audit-report)

---

## Production Deployment Checklist

Before going public:

- [ ] Set `ENVIRONMENT=production` in .env
- [ ] Documentation endpoints disabled
- [ ] HTTPS/TLS enabled
- [ ] Rate limits reviewed
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] Terms of Service ready
- [ ] Privacy Policy ready
- [ ] API key rotated (not dev key)
- [ ] CORS origins updated (not localhost)
- [ ] npm audit shows 0 vulnerabilities
- [ ] pip check shows 0 conflicts

---

## Contributing Security Fixes

Found a security issue? Follow these guidelines:

1. **Do NOT create a public issue**
2. **Email the details privately**
3. We will:
   - Investigate promptly
   - Create a private fix
   - Release a patched version
   - Credit you in release notes (if desired)

---

## Questions?

- 📖 Documentation: See README.md
- 🐛 Bug Reports: GitHub Issues (public bugs only)
- 🔒 Security: ChiranjibAI@users.noreply.github.com

---

**OpenGrant Security Policy**
Made with 🤖 by ChiranjibAI — February 2026
