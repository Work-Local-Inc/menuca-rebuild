// Usage:
// node scripts/verify-dashboard-sticky.js --magic "<MAGIC_LINK_URL>" --rid 5b49a173-388b-4532-af0a-46bbf7884e05 --base https://menuca-rebuild-pro.vercel.app

const { chromium } = require('playwright')

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def
}

;(async () => {
  const magic = arg('magic')
  const rid = arg('rid')
  const base = arg('base', 'https://menuca-rebuild-pro.vercel.app')
  const preview = arg('preview', 'false') === 'true'
  if (!magic || !rid) {
    console.error('Missing --magic or --rid')
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Complete magic-link login
    if (magic && magic !== 'none') {
      await page.goto(magic, { waitUntil: 'networkidle' })
      await page.waitForTimeout(2500)
    }

    // Go to dashboard
    const dashUrl = preview
      ? `${base}/restaurant/${rid}/dashboard/preview`
      : `${base}/restaurant/${rid}/dashboard`
    await page.goto(dashUrl, { waitUntil: 'networkidle' })

    // If redirected to login, report and screenshot
    const urlNow = page.url()
    if (!preview && urlNow.includes('/login')) {
      await page.screenshot({ path: 'dashboard-redirected-to-login.png', fullPage: true })
      console.log(JSON.stringify({ dashUrl, redirectedToLogin: true, urlNow }, null, 2))
      return
    }

    // Wait for any of the subnav buttons to render
    await page.waitForSelector('button:has-text("Manage Orders"), button:has-text("View Live Menu"), button:has-text("Settings")', { timeout: 60000 })

    // Locate the subnav container by walking up from one of the buttons
    const btn = page.locator('button:has-text("Manage Orders"), button:has-text("View Live Menu"), button:has-text("Settings")').first()
    const getNavTop = async () => {
      return await btn.evaluate((node) => {
        let el = node
        // climb up a few levels to the nav wrapper
        for (let i = 0; i < 5 && el; i++) {
          if (el.parentElement) el = el.parentElement
        }
        const rect = el.getBoundingClientRect()
        return { top: Math.round(rect.top), height: Math.round(rect.height) }
      })
    }

    // Capture top before and after scroll
    const before = await getNavTop()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(250)
    const after = await getNavTop()

    const pinned = Math.abs(after.top) <= 8 || after.top <= 8

    console.log(JSON.stringify({ dashUrl, before, after, pinned }, null, 2))

    // Screenshot for reference
    await page.screenshot({ path: 'dashboard-sticky-check.png', fullPage: false })
  } catch (e) {
    console.error('Verification failed:', e?.message || e)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
})()


