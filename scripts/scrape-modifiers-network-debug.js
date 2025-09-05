#!/usr/bin/env node
// Debug capture for sites whose item customizer opens in a modal/iframe.
// Captures:
// - All JSON/XHR responses (truncated)
// - InnerText/HTML of any dialog/modal/iframe after clicking item links
// Writes: scripts/out/debug_capture.json

const { chromium } = require('playwright')
const fs = require('fs')

async function run(url, max = 30) {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const out = { url, capturedAt: new Date().toISOString(), network: [], modals: [] }

  page.on('response', async (resp) => {
    try {
      const ct = resp.headers()['content-type'] || ''
      if (ct.includes('json') || resp.url().includes('ajax') || resp.url().includes('api')) {
        const text = await resp.text()
        out.network.push({ url: resp.url(), status: resp.status(), contentType: ct, body: text.slice(0, 20000) })
      }
    } catch {}
  })

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(()=>{})

  const itemLinks = await page.$$('a:has-text("Order this item")')
  for (let i = 0; i < Math.min(itemLinks.length, max); i++) {
    const el = itemLinks[i]
    try { await el.click({ timeout: 2000 }) } catch {}
    const modal = await page.waitForSelector('dialog, .modal, [role="dialog"], .fancybox-wrap, .fancybox-overlay, .lightbox, .ui-dialog', { timeout: 3000 }).catch(()=>null)
    if (!modal) continue
    let html = ''
    try { html = await modal.innerHTML() } catch {}
    let iframeHtml = ''
    try {
      const iframe = await modal.$('iframe, .fancybox-iframe')
      if (iframe) {
        const frame = await iframe.contentFrame()
        if (frame) iframeHtml = await frame.content().catch(()=> '')
      }
    } catch {}
    out.modals.push({ index: i, html: html?.slice(0, 50000) || '', iframe: iframeHtml?.slice(0, 50000) || '' })
    try { await page.keyboard.press('Escape') } catch {}
  }

  if (!fs.existsSync('scripts/out')) fs.mkdirSync('scripts/out', { recursive: true })
  fs.writeFileSync('scripts/out/debug_capture.json', JSON.stringify(out, null, 2))
  await browser.close()
  console.log('Wrote scripts/out/debug_capture.json with', out.modals.length, 'modals and', out.network.length, 'network entries')
}

if (require.main === module) {
  const url = process.argv[2]
  const max = Number(process.argv[3] || '30')
  if (!url) { console.error('Usage: node scripts/scrape-modifiers-network-debug.js <url> [max]'); process.exit(1) }
  run(url, max).catch(e => { console.error(e); process.exit(1) })
}


