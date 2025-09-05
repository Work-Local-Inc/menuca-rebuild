#!/usr/bin/env node
// Generic Playwright scraper to capture per-item modifier groups/options from sites that use a customization modal.
// Usage:
//   node scripts/scrape-modifiers-playwright.js <url> --itemSel=".menu-item" --openSel="button, .add, .customize" --out=modifiers.json
// Minimal heuristic: click each item then try common modal selectors; capture DOM text and any JSON XHR responses.

const { chromium } = require('playwright')
const fs = require('fs')

function args() {
  const out = { url: null, itemSel: '.menu-item, [data-item], .item', openSel: 'button, .add, .customize, [data-open]', out: 'modifiers.json', max: 30 }
  for (const a of process.argv.slice(2)) {
    if (!a.startsWith('--')) { if (!out.url) out.url = a; continue }
    const [k, v] = a.replace(/^--/, '').split('=')
    if (k === 'itemSel') out.itemSel = v
    if (k === 'openSel') out.openSel = v
    if (k === 'out') out.out = v
    if (k === 'max') out.max = Number(v)
  }
  if (!out.url) { console.error('Usage: node scripts/scrape-modifiers-playwright.js <url> [--itemSel=...] [--openSel=...] [--out=modifiers.json]'); process.exit(1) }
  return out
}

function parsePrice(text) {
  const m = (text || '').replace(/,/g,'').match(/([+-]?\$?\s*\d+(?:\.\d{1,2})?)/)
  if (!m) return 0
  const n = parseFloat(m[1].replace(/\$/g,'').trim())
  return isNaN(n) ? 0 : n
}

async function main() {
  const cfg = args()
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  const captured = { url: cfg.url, scrapedAt: new Date().toISOString(), items: [], network: [] }

  page.on('response', async (resp) => {
    try {
      const ct = resp.headers()['content-type'] || ''
      if (ct.includes('application/json')) {
        const body = await resp.text()
        captured.network.push({ url: resp.url(), status: resp.status(), body: body.slice(0, 500000) })
      }
    } catch {}
  })

  await page.goto(cfg.url, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(()=>{})

  const itemHandles = await page.locator(cfg.itemSel).elementHandles()
  for (let i = 0; i < Math.min(itemHandles.length, cfg.max); i++) {
    const el = itemHandles[i]
    let title = (await el.textContent())?.trim().slice(0, 120) || `Item ${i+1}`
    try { await el.click({ timeout: 2000 }) } catch {}
    // Fallback: try general open selectors within item
    try { const btn = await (await el.asElement()).$(cfg.openSel); if (btn) await btn.click({ timeout: 2000 }) } catch {}

    // Wait for a modal/dialog to appear
    const modal = await page.waitForSelector('dialog, .modal, [role="dialog"], .lightbox, .fancybox-inner, .ui-dialog, .fancybox-overlay, .fancybox-wrap', { timeout: 4000 }).catch(()=>null)
    if (!modal) continue

    // Some sites (like Fancybox) render content inside an iframe. Try that first.
    let root = modal
    const iframeEl = await modal.$('iframe, .fancybox-iframe').catch(()=>null)
    if (iframeEl) {
      try {
        const frame = await iframeEl.contentFrame()
        if (frame) root = frame
      } catch {}
    }

    // Try blocks that look like groups
    const groupContainers = iframeEl ? await (root).$$('fieldset, .group, .options, .modifier-group, .toppings, .sizes, .crust, .section') : await modal.$$('fieldset, .group, .options, .modifier-group, .toppings, .sizes, .crust, .section')
    const groups = []
    for (const g of groupContainers) {
      const gname = (await (await g.$('legend, .title, h3, h4, .group-title'))?.textContent()?.catch(()=>''))?.trim() || ''
      const options = []
      const optEls = await g.$$('label, .option, li, .row, a')
      for (const oe of optEls) {
        const txt = (await oe.textContent())?.replace(/\s+/g,' ').trim() || ''
        if (!txt) continue
        options.push({ name: txt.replace(/\$\s*\d+(?:\.\d{1,2})?/, '').trim(), price_delta: parsePrice(txt) })
      }
      if (options.length) groups.push({ name: gname || 'Options', options })
    }
    if (groups.length) captured.items.push({ name: title, groups })

    // Close modal (best-effort)
    try { await page.keyboard.press('Escape') } catch {}
    const closeBtn = await page.$('button:has-text("Close"), .close, .fancybox-close, .ui-dialog-titlebar-close')
    try { if (closeBtn) await closeBtn.click({ timeout: 1000 }) } catch {}
  }

  fs.writeFileSync(cfg.out, JSON.stringify(captured, null, 2))
  console.log(`Saved ${captured.items.length} items with modifiers to ${cfg.out}`)
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })


