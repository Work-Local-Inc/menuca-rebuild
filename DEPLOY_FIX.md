# 🚀 DEPLOYMENT FIX FOR MODIFIER SCRAPING

## The Problem
1. Browserless changed their API endpoints → **Fixed in code ✅**
2. Your API key returns 401 "Invalid API key" → **Need new key ❌**
3. Multiple concurrent imports cause timeouts → **Need to address**

## Immediate Fix

### Step 1: Deploy Code Changes
```bash
git add pages/api/agents/create-run.ts
git commit -m "Fix: Update Browserless endpoints to production-sfo"
git push origin Brian-scraper
```

Then deploy to Vercel.

### Step 2: Fix Browserless Token
1. Go to https://www.browserless.io/account
2. Your current token might be for the old endpoint
3. Either:
   - Generate a NEW API token
   - OR remove BROWSERLESS_TOKEN from Vercel entirely (will use Playwright fallback)

### Step 3: Handle Timeouts
Add to `pages/api/agents/create-run.ts` at line 14:
```typescript
export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
    responseLimit: '10mb',
  },
  maxDuration: 300, // Increase from 90 to 300 seconds (5 minutes)
}
```

## Alternative: Disable Modifiers Temporarily
If you need imports working NOW:
1. Set `ADDONS_CAPTURE_ENABLED=false` in Vercel
2. This skips modifier scraping entirely
3. You can add modifiers manually later

## Test After Deploy
```bash
curl -X POST https://menuca-rebuild-pro.vercel.app/api/agents/create-run \
  -H "Content-Type: application/json" \
  -d '{"url": "https://order.tonys-pizza.ca/?p=menu", "restaurant_id": "test-123"}'
```

Check logs for "addons_capture" event.
