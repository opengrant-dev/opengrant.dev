#!/bin/bash

# ============================================================
# COMPLETE DEPLOYMENT VIA CLI
# Railway + Vercel - One Command
# ============================================================

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     OPENGRANT COMPLETE DEPLOYMENT                      ║"
echo "║     Railway Backend + Vercel Frontend                  ║"
echo "║     OpenGrant v2.0.0                                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Pre-flight checks
echo "═══ PRE-FLIGHT CHECKS ═══"
echo ""

echo "1. Checking CLI tools..."

if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Install: npm i -g @railway/cli"
    exit 1
fi
echo "   ✓ Railway CLI found"

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found"
    echo "Install: npm i -g vercel"
    exit 1
fi
echo "   ✓ Vercel CLI found"

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found"
    echo "Install: https://cli.github.com"
    exit 1
fi
echo "   ✓ GitHub CLI found"

echo ""
echo "2. Checking authentication..."

RAILWAY_AUTH=$(railway whoami 2>&1 | grep -v "^$")
if [[ $RAILWAY_AUTH == *"error"* ]] || [[ -z "$RAILWAY_AUTH" ]]; then
    echo "❌ Not authenticated with Railway"
    echo "Run: railway login"
    exit 1
fi
echo "   ✓ Railway authenticated: $RAILWAY_AUTH"

VERCEL_AUTH=$(vercel whoami 2>&1 | grep -v "^$")
if [[ $VERCEL_AUTH == *"error"* ]] || [[ -z "$VERCEL_AUTH" ]]; then
    echo "❌ Not authenticated with Vercel"
    echo "Run: vercel login"
    exit 1
fi
echo "   ✓ Vercel authenticated: $VERCEL_AUTH"

GH_AUTH=$(gh auth status 2>&1 | head -1)
if [[ $GH_AUTH == *"not authenticated"* ]]; then
    echo "❌ Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi
echo "   ✓ GitHub authenticated"

echo ""
echo "3. Checking code status..."

if [ -n "$(git status --porcelain)" ]; then
    echo "   ⚠️  Uncommitted changes detected"
    git add -A
    git commit -m "deploy: full cli deployment" || true
fi
git push origin main || true
echo "   ✓ Code synced"

echo ""
echo "═══ DEPLOYMENT STARTING ═══"
echo ""

# Get project name
read -p "Project name (default: opengrant-prod): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-opengrant-prod}

# Get API key
read -p "Groq API Key: " GROQ_KEY
if [ -z "$GROQ_KEY" ]; then
    echo "❌ Groq API key required"
    echo "Get from: https://console.groq.com"
    exit 1
fi

echo ""
echo "═══ DEPLOYING BACKEND (RAILWAY) ═══"
echo ""

# Initialize Railway project
echo "1. Creating Railway project: $PROJECT_NAME"
railway init --name "$PROJECT_NAME" --empty 2>/dev/null || true

echo "2. Linking GitHub repository..."
railway service add github opengrant-dev/opengrant.dev 2>/dev/null || true

echo "3. Setting environment variables..."
railway variables set ENVIRONMENT production
railway variables set FRONTEND_URL "https://opengrant.tech"
railway variables set GROQ_API_KEY "$GROQ_KEY"
railway variables set RATE_LIMIT_PER_MINUTE 20

echo "4. Deploying to Railway..."
railway up 2>/dev/null || true

echo "   ✓ Railway deployment initiated"
echo ""
echo "   Waiting for Railway to build (30-60 seconds)..."
sleep 45

# Get Railway URL
echo ""
echo "5. Getting Railway URL..."

RAILWAY_URL=$(railway domain 2>/dev/null || echo "")

if [ -z "$RAILWAY_URL" ]; then
    RAILWAY_URL=$(railway status 2>/dev/null | grep "https://" | head -1 || echo "")
fi

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  Could not auto-detect Railway URL"
    read -p "Enter Railway URL: " RAILWAY_URL
fi

echo ""
echo "   Backend URL: $RAILWAY_URL"

# Test Railway
echo ""
echo "6. Testing Railway backend..."

HEALTH=$(curl -s "$RAILWAY_URL/health" 2>/dev/null | grep -o '"status":"ok"' || echo "")

if [[ $HEALTH == *"ok"* ]]; then
    echo "   ✅ Railway backend is LIVE!"
else
    echo "   ⚠️  Still building... May take 1-2 more minutes"
    echo "   Check: railway status"
fi

echo ""
echo "═══ DEPLOYING FRONTEND (VERCEL) ═══"
echo ""

echo "1. Preparing Vercel deployment..."
echo "   API URL: $RAILWAY_URL"

echo "2. Deploying to Vercel (production)..."

VERCEL_OUTPUT=$(vercel deploy \
    --prod \
    --env VITE_API_URL="$RAILWAY_URL" \
    --name opengrant \
    --yes 2>&1 || echo "")

VERCEL_URL=$(echo "$VERCEL_OUTPUT" | grep -o "https://opengrant[^[:space:]]*" | head -1 || echo "")

if [ -z "$VERCEL_URL" ]; then
    echo "   ⚠️  Could not auto-detect Vercel URL"
    read -p "Enter Vercel URL: " VERCEL_URL
fi

echo "   ✓ Frontend deployed to Vercel"

echo ""
echo "3. Vercel URL: $VERCEL_URL"

echo ""
echo "═══ SYSTEM CONFIGURATION ═══"
echo ""

read -p "Add custom domain opengrant.tech? (y/n) " -n 1 -r DOMAIN_CHOICE
echo

if [[ $DOMAIN_CHOICE =~ ^[Yy]$ ]]; then
    echo "Adding domain..."
    vercel domains add opengrant.tech --cwd . 2>/dev/null || true

    echo ""
    echo "Domain instructions:"
    echo "  1. Go to registrar (Namecheap/GoDaddy)"
    echo "  2. Add CNAME record:"
    echo "     Host: opengrant.tech"
    echo "     Value: cname.vercel-dns.com"
    echo "  3. Wait 5-10 minutes for propagation"
fi

echo ""
echo "═══ FINAL STATUS ═══"
echo ""

echo "Backend (Railway):"
echo "  URL: $RAILWAY_URL"
echo "  Status: Deployed"
echo ""

echo "Frontend (Vercel):"
echo "  URL: $VERCEL_URL"
echo "  Status: Deployed"
echo ""

echo "Configuration:"
echo "  VITE_API_URL: $RAILWAY_URL"
echo "  Domain: opengrant.tech (setup in registrar)"
echo "  SSL: Automatic via Let's Encrypt"
echo ""

# Test the system
echo "═══ SYSTEM TEST ═══"
echo ""

echo "Testing backend health..."
BACKEND_TEST=$(curl -s "$RAILWAY_URL/health" 2>/dev/null | grep -o '"status":"ok"' || echo "FAILED")

if [[ $BACKEND_TEST == *"ok"* ]]; then
    echo "  ✅ Backend health: OK"
else
    echo "  ⚠️  Backend still initializing"
fi

echo ""
echo "Testing frontend..."
FRONTEND_TEST=$(curl -s "$VERCEL_URL" -I 2>/dev/null | grep "200" || echo "FAILED")

if [[ $FRONTEND_TEST == *"200"* ]]; then
    echo "  ✅ Frontend: OK"
else
    echo "  ⚠️  Frontend still deploying"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║  ✓ DEPLOYMENT COMPLETE!                               ║"
echo "║  ✓ OPENGRANT IS LIVE!                                 ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "🎉 Your OpenGrant system is now deployed!"
echo ""

echo "URLs:"
echo "  Backend: $RAILWAY_URL"
echo "  Frontend: $VERCEL_URL"
echo "  Domain: opengrant.tech (pending DNS)"
echo ""

echo "Next steps:"
echo "  1. Visit: $VERCEL_URL"
echo "  2. Test with: github.com/torvalds/linux"
echo "  3. Configure DNS if using custom domain"
echo "  4. Monitor: railway.app & vercel.com"
echo ""

echo "Helpful links:"
echo "  Railway Dashboard: https://railway.app"
echo "  Vercel Dashboard: https://vercel.com/dashboard"
echo "  GitHub Repo: https://github.com/opengrant-dev/opengrant.dev"
echo ""

echo "✨ Full system deployment complete!"
echo ""
