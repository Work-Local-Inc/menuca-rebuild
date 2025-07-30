#!/bin/bash

# Railway Deployment Script for MenuCA

echo "🚀 Starting Railway deployment..."

# Navigate to project directory
cd /Users/brianlapp/Documents/GitHub/menuca-rebuild

# Login with API token
echo "🔐 Logging in to Railway..."
railway login --browserless

# Link to project (you'll need to select or create project)
echo "🔗 Linking to Railway project..."
railway link

# Set environment variables from .env file
echo "⚙️  Setting environment variables..."
railway variables set $(cat .env | grep -v '^#' | xargs)

# Deploy
echo "📦 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Run 'railway open' to view your app"
