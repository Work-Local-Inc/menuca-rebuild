// Minimal Playwright script to trigger Supabase magic link on prod login
// Usage: node scripts/trigger-magic-link.js --email brian@worklocal.ca --url https://menuca-rebuild-pro.vercel.app/login

const { chromium } = require('playwright')

function getArg(name, def) {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return def
}

;(async () => {
  const email = getArg('email', '')
  const url = getArg('url', 'https://menuca-rebuild-pro.vercel.app/login')
  if (!email) {
    console.error('Missing --email')
    process.exit(1)
  }
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    await page.fill('input[type="email"]', email)
    await page.click('button:has-text("Send magic link")')
    await page.waitForSelector('text=Check your inbox', { timeout: 15000 })
    console.log('Magic link triggered for', email)
  } catch (e) {
    console.error('Failed to trigger magic link:', e?.message || e)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
})()





