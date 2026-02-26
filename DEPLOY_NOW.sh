#!/bin/bash

# ============================================================
# OpenGrant DEPLOYMENT SCRIPT
# Deploy to Railway (Backend) + Vercel (Frontend)
# ============================================================

set -e

echo "🚀 OPENGRANT DEPLOYMENT SCRIPT"
echo "=============================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install from: https://cli.github.com"
    exit 1
fi

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found. Install from: https://railway.app/cli"
    echo "Then run: railway login"
    exit 1
fi

# Check authentication
echo "✓ Checking authentication..."
gh auth status > /dev/null 2>&1 || { echo "❌ Not authenticated with GitHub. Run: gh auth login"; exit 1; }

echo "✓ GitHub authenticated"
echo ""

# Step 1: Prepare code
echo "📦 STEP 1: Prepare code for deployment"
echo "----"
git status
git add -A
if [ -n "$(git status --porcelain)" ]; then
    read -p "Commit changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git commit -m "deploy: final production release"
        git push origin main
        echo "✓ Changes pushed to GitHub"
    fi
else
    echo "✓ Working directory clean"
fi

echo ""
echo "🚂 STEP 2: Deploy Backend to Railway"
echo "----"
echo "Opening Railway dashboard..."
echo "1. Go to: https://railway.app/dashboard"
echo "2. Click: New Project"
echo "3. Select: GitHub repo (opengrant-dev/opengrant.dev)"
echo "4. Wait for auto-deployment"
echo "5. Copy the generated URL (e.g., https://opengrant-prod.up.railway.app)"
echo ""
read -p "Enter Railway Backend URL: " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ Railway URL required"
    exit 1
fi

echo "✓ Railway URL saved: $RAILWAY_URL"
echo ""

echo "✅ STEP 3: Deploy Frontend to Vercel"
echo "----"
echo "1. Go to: https://vercel.com/new"
echo "2. Import from GitHub (opengrant-dev/opengrant.dev)"
echo "3. Configure:"
echo "   Framework: Vite"
echo "   Build: cd frontend && npm run build"
echo "   Output: frontend/dist"
echo "4. Add Environment Variable:"
echo "   VITE_API_URL = $RAILWAY_URL"
echo "5. Click Deploy"
echo ""
read -p "Enter Vercel Frontend URL (e.g., https://opengrant.vercel.app): " VERCEL_URL

if [ -z "$VERCEL_URL" ]; then
    echo "❌ Vercel URL required"
    exit 1
fi

echo "✓ Vercel URL saved: $VERCEL_URL"
echo ""

echo "🌐 STEP 4: Connect Custom Domain"
echo "----"
echo "In Vercel Dashboard:"
echo "1. Settings → Domains"
echo "2. Add: opengrant.tech"
echo "3. Copy the CNAME record"
echo "4. Update your domain registrar (Namecheap/GoDaddy)"
echo "5. Wait 5-10 minutes for SSL"
echo ""
read -p "Press ENTER when domain is configured"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "=============================="
echo ""
echo "📊 Summary:"
echo "  Backend:  $RAILWAY_URL"
echo "  Frontend: $VERCEL_URL"
echo "  Domain:   https://opengrant.tech"
echo ""
echo "🧪 Test your deployment:"
echo "  1. Visit: https://opengrant.tech"
echo "  2. Enter GitHub URL: https://github.com/torvalds/linux"
echo "  3. Click 'Find Funding'"
echo "  4. Should see results!"
echo ""
echo "✨ Your OpenGrant is LIVE!"
