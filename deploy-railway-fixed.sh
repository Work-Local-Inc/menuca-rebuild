#!/bin/bash

# Railway Deployment Script for MenuCA with Auth Fix

echo "🚀 Starting Railway deployment..."

# Check if RAILWAY_TOKEN is set
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ RAILWAY_TOKEN not found!"
    echo "Please run: export RAILWAY_TOKEN='your-railway-api-token'"
    echo "Get your token from: https://railway.app/account/tokens"
    exit 1
fi

# Navigate to project directory
cd /Users/brianlapp/Documents/GitHub/menuca-rebuild

# The token should authenticate automatically
echo "🔐 Using Railway API token..."

# Deploy directly without interactive prompts
echo "📦 Deploying to Railway..."
railway up --detach

echo "✅ Deployment initiated!"
echo "🌐 Check deployment status at: https://railway.app"
