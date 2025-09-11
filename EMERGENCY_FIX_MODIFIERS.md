# EMERGENCY FIX FOR MODIFIER SCRAPING

## THE PROBLEM
- Browserless is returning 403 Forbidden
- This blocks ALL modifier scraping
- Menu items import fine but NO modifiers

## QUICK FIX #1: Remove Browserless Token
1. Go to Vercel → Project Settings → Environment Variables
2. DELETE the `BROWSERLESS_TOKEN` variable entirely
3. Keep `PLAYWRIGHT_ENABLED=true` and `ADDONS_CAPTURE_ENABLED=true`
4. Redeploy
5. The app will use Playwright fallback (slower but works)

## QUICK FIX #2: Get New Browserless Token
1. Go to https://www.browserless.io/account
2. Find your API token (NOT account ID)
3. Copy the ENTIRE token
4. Update in Vercel with NO spaces
5. Redeploy

## QUICK FIX #3: Disable Modifier Scraping Temporarily
1. Set `ADDONS_CAPTURE_ENABLED=false` in Vercel
2. This will skip modifier scraping entirely
3. You can add modifiers manually later

## TEST AFTER FIX
Run a new import and check the logs for:
- "addons_capture" event
- No more 403 errors
- Items should have hasModifiers: true
