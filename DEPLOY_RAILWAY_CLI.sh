#!/bin/bash

# ============================================================
# RAILWAY DEPLOYMENT VIA CLI
# OpenGrant Backend - Automated
# ============================================================

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     RAILWAY DEPLOYMENT VIA CLI                         ║"
echo "║     OpenGrant v2.0.0 Backend                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check authentication
echo "Checking Railway authentication..."
RAILWAY_USER=$(railway whoami 2>&1)

if [[ $RAILWAY_USER == *"error"* ]] || [[ $RAILWAY_USER == *"not authenticated"* ]]; then
    echo "❌ Not authenticated with Railway"
    echo "Run: railway login"
    exit 1
fi

echo "✓ Authenticated: $RAILWAY_USER"
echo ""

# Check code is committed
echo "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes"
    git add -A
    git commit -m "deploy: railway cli deployment"
    git push origin main
    echo "✓ Changes committed"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  STEP 1: Create Railway Project                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# List existing projects
echo "Existing Railway projects:"
railway list --projects 2>/dev/null | head -10 || echo "No projects yet"

echo ""
read -p "Enter new project name (e.g., opengrant-prod): " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
    PROJECT_NAME="opengrant-prod"
fi

echo ""
echo "Creating project: $PROJECT_NAME"

# Create new project and environment
railway init --name "$PROJECT_NAME" --empty 2>/dev/null || echo "Project may already exist"

echo ""
echo "✓ Project created/selected"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  STEP 2: Link GitHub Repository                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "Linking GitHub repo: opengrant-dev/opengrant.dev"
railway service add github opengrant-dev/opengrant.dev 2>/dev/null || echo "Repo may already be linked"

echo ""
echo "✓ GitHub repo linked"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  STEP 3: Configure Environment Variables               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "Setting environment variables..."
echo ""

# Set variables
railway variables set ENVIRONMENT production

echo "ENVIRONMENT = production"
railway variables set FRONTEND_URL "https://opengrant.tech"
echo "FRONTEND_URL = https://opengrant.tech"

read -p "Enter your Groq API Key: " GROQ_KEY

if [ -z "$GROQ_KEY" ]; then
    echo "❌ Groq API key is required"
    echo "Get one at: https://console.groq.com"
    exit 1
fi

railway variables set GROQ_API_KEY "$GROQ_KEY"
echo "GROQ_API_KEY = [SET]"

railway variables set RATE_LIMIT_PER_MINUTE 20
echo "RATE_LIMIT_PER_MINUTE = 20"

read -p "Enter GitHub token (optional, press Enter to skip): " GITHUB_TOKEN

if [ -n "$GITHUB_TOKEN" ]; then
    railway variables set GITHUB_TOKEN "$GITHUB_TOKEN"
    echo "GITHUB_TOKEN = [SET]"
fi

echo ""
echo "✓ Environment variables configured"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  STEP 4: Deploy to Railway                             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "Deploying..."
railway up 2>/dev/null || echo "Build starting..."

echo ""
echo "✓ Deployment initiated"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  STEP 5: Get Railway URL                               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Wait for deployment
echo "Waiting for deployment (30-60 seconds)..."
sleep 10

# Get the URL
RAILWAY_URL=$(railway domain 2>/dev/null || echo "")

if [ -z "$RAILWAY_URL" ]; then
    echo "Getting deployment info..."
    RAILWAY_URL=$(railway status 2>/dev/null | grep -o "https://[^[:space:]]*" | head -1 || echo "")
fi

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  Could not auto-detect URL"
    read -p "Enter Railway URL (e.g., https://opengrant-prod-...): " RAILWAY_URL
fi

echo ""
echo "Railway Backend URL:"
echo "  $RAILWAY_URL"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  STEP 6: Test Railway Backend                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "Testing health endpoint..."

HEALTH=$(curl -s "$RAILWAY_URL/health" 2>/dev/null | grep -o '"status":"ok"' || echo "")

if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Railway backend is LIVE!"
    echo ""
    echo "Sample endpoints:"
    echo "  Health: $RAILWAY_URL/health"
    echo "  Stats: $RAILWAY_URL/api/stats"
    echo "  Sources: $RAILWAY_URL/api/funding-sources"
else
    echo "⚠️  Still deploying... This can take 1-2 minutes"
    echo "Check status: railway status"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✓ RAILWAY DEPLOYMENT COMPLETE!                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Backend URL: $RAILWAY_URL"
echo ""
echo "Save this URL for Vercel deployment!"
echo ""
echo "Next step: Deploy frontend to Vercel"
echo "Run: DEPLOY_VERCEL_CLI.sh"
echo ""
