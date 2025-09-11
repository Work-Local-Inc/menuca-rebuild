# Next.js 15 Broke Modifier Scraping

## What Happened
1. **Sept 10, 7:30pm**: Next.js upgraded from 13 to 15
2. **Modifiers stopped working** - dynamic imports for playwright-core likely broken
3. **Browserless started returning 403** - possibly related to Next.js 15 changes in how env vars are handled

## Quick Fix
Remove BROWSERLESS_TOKEN from Vercel entirely:

1. Go to Vercel → Environment Variables
2. DELETE `BROWSERLESS_TOKEN` 
3. Keep `ADDONS_CAPTURE_ENABLED=true`
4. Keep `PLAYWRIGHT_ENABLED=true`
5. Redeploy

This will force it to use local Playwright which might work better with Next.js 15.

## Long Term Fix
Need to update the playwright-core dynamic imports to work with Next.js 15's new module system.
