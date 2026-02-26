#!/bin/bash

# ============================================================
# RAILWAY DEPLOYMENT AUTOMATION SCRIPT
# OpenGrant Backend Deployment
# ============================================================

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     RAILWAY DEPLOYMENT AUTOMATION                      ║"
echo "║     OpenGrant v2.0.0 Backend                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "Install Railway CLI:"
    echo "  1. Go to: https://railway.app/cli"
    echo "  2. Download & install for your OS"
    echo "  3. Run: railway login"
    echo "  4. Return here and run this script again"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found!"
    echo ""
    echo "Install GitHub CLI:"
    echo "  1. Go to: https://cli.github.com"
    echo "  2. Download & install"
    echo "  3. Run: gh auth login"
    echo "  4. Return here and run this script again"
    exit 1
fi

echo "✓ Railway CLI found"
echo "✓ GitHub CLI found"
echo ""

# Check authentication
echo "Checking authentication..."

if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

echo "✓ GitHub authenticated"
echo ""

# Verify repository
echo "Checking GitHub repository..."
REPO_URL=$(git config --get remote.origin.url)
echo "Repository: $REPO_URL"
echo ""

# Ensure code is committed
echo "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes detected"
    read -p "Commit changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "deploy: final railway deployment"
        git push origin main
        echo "✓ Changes committed and pushed"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  NEXT STEP: MANUAL RAILWAY SETUP                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Open your browser and follow these steps:"
echo ""
echo "1. Go to: https://railway.app/dashboard"
echo "2. Click: + New Project (top left)"
echo "3. Select: Deploy from GitHub repo"
echo "4. Search & select: opengrant-dev/opengrant.dev"
echo "5. Click: Connect"
echo "6. Wait 2-3 minutes for deployment"
echo ""
echo "After deployment completes:"
echo ""
echo "7. Click: Variables tab"
echo "8. Add these environment variables:"
echo ""
echo "   ENVIRONMENT = production"
echo "   FRONTEND_URL = https://opengrant.tech"
echo "   GROQ_API_KEY = <your_groq_api_key_here>"
echo "   RATE_LIMIT_PER_MINUTE = 20"
echo ""
echo "9. (Optional) Add GITHUB_TOKEN for higher API limits"
echo ""
echo "10. After variables are set, wait 1-2 min for auto-redeploy"
echo ""
echo "11. Click: Settings → Domain"
echo "12. Note your Railway URL (opengrant-prod-...):"
echo "    This URL will be your VITE_API_URL for Vercel"
echo ""
echo "═════════════════════════════════════════════════════════"
echo ""

read -p "Press ENTER once Railway deployment is complete..."

echo ""
echo "Testing Railway backend..."
echo ""

read -p "Enter your Railway backend URL (e.g., https://opengrant-prod-...): " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ No URL provided"
    exit 1
fi

echo ""
echo "Testing: $RAILWAY_URL/health"
echo ""

HEALTH_CHECK=$(curl -s "$RAILWAY_URL/health" | grep -o '"status":"ok"' || echo "FAILED")

if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo "✅ Railway backend is LIVE!"
    echo ""
    echo "Save this URL for Vercel deployment:"
    echo "   VITE_API_URL = $RAILWAY_URL"
    echo ""
else
    echo "❌ Could not connect to Railway backend"
    echo "Check:"
    echo "  1. URL is correct"
    echo "  2. Deployment is complete (green status)"
    echo "  3. Wait 1-2 minutes and try again"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✓ RAILWAY DEPLOYMENT COMPLETE!                        ║"
echo "║  ✓ BACKEND IS LIVE                                     ║"
echo "║  ✓ NEXT: Deploy frontend to Vercel                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Railway URL: $RAILWAY_URL"
echo ""
echo "Next steps:"
echo "  1. Go to: https://vercel.com/new"
echo "  2. Import: opengrant-dev/opengrant.dev"
echo "  3. Set VITE_API_URL = $RAILWAY_URL"
echo "  4. Deploy to Vercel"
echo "  5. Add custom domain: opengrant.tech"
echo ""
