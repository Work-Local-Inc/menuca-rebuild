import { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { scrapeXtremePizzaMenu } from '@/lib/simple-scraper'
import { parseMenuFromHTML } from '@/lib/html-menu-parser'

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
    responseLimit: '10mb',
  },
  maxDuration: 90,
}

type NormalizedCategory = {
  name: string
  description?: string
  items: Array<{
    name: string
    description?: string
    prices: number[]
    price?: number
  }>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })

  const startedAt = Date.now()
  const runId = uuidv4()

  try {
    // Internal secret
    const providedSecret = (req.headers['x-internal-secret'] as string) || ''
    const expectedSecret = process.env.AGENT_INTERNAL_SECRET || ''
    if (expectedSecret && providedSecret !== expectedSecret) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { url, restaurant_id: restaurantId } = req.body || {}

    if (!url || !restaurantId) {
      return res.status(400).json({ success: false, error: 'url and restaurant_id are required' })
    }

    // URL validation and SSRF guard
    const isSafeUrl = (candidate: string) => {
      try {
        const u = new URL(candidate)
        if (!['http:', 'https:'].includes(u.protocol)) return false
        const host = u.hostname.toLowerCase()
        if (host === 'localhost' || host.endsWith('.local')) return false
        const ipMatch = host.match(/^\d+\.\d+\.\d+\.\d+$/)
        if (ipMatch) {
          const parts = host.split('.').map((x) => parseInt(x, 10))
          const [a, b] = parts
          if (a === 127) return false
          if (a === 10) return false
          if (a === 0) return false
          if (a === 169 && b === 254) return false
          if (a === 192 && b === 168) return false
          if (a === 172 && b >= 16 && b <= 31) return false
          if (a === 100 && b >= 64 && b <= 127) return false
        }
        return true
      } catch {
        return false
      }
    }
    if (!isSafeUrl(url)) {
      return res.status(400).json({ success: false, error: 'Invalid or disallowed URL' })
    }

    // Single active run guard
    const { data: active, error: activeErr } = await supabaseAdmin
      .from('menu_imports')
      .select('id, status, started_at')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'running')
      .limit(1)
      .maybeSingle()
    if (!activeErr && active) {
      return res.status(409).json({ success: false, error: 'Import already running', import_id: active.id, status: active.status })
    }

    // Create or update progress row
    let importId: string | null = null
    try {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null
      const ua = (req.headers['user-agent'] as string) || null
      const { data: created, error: createErr } = await supabaseAdmin
        .from('menu_imports')
        .insert({
          restaurant_id: restaurantId,
          tenant_id: null,
          source_url: url,
          status: 'running',
          total_categories: 0,
          total_items: 0,
          processed_categories: 0,
          processed_items: 0,
          logs: [{ event: 'start', at: new Date().toISOString(), message: 'Agent run created', runId, ip, ua }],
          agent_run_id: runId,
          agent_cost_usd: null,
        })
        .select()
        .single()

      if (!createErr && created?.id) importId = created.id
    } catch (e) {
      // Non-blocking
    }

    const logProgress = async (entry: any, patch?: Partial<Record<string, any>>) => {
      if (!importId) return
      try {
        await supabaseAdmin
          .from('menu_imports')
          .update({
            ...(patch || {}),
            logs: [{ ...entry, at: new Date().toISOString() }],
          })
          .eq('id', importId)
      } catch {}
    }

    // Tool 1: fetch_url
    await logProgress({ event: 'fetch_url', message: 'Fetching raw HTML' })
    const htmlResponse = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 MenuCA Agent' } })
    const rawHtml = await htmlResponse.text()

    // Tool 2: playwright_capture (best-effort, optional)
    let domHtml: string | null = null
    const enablePlaywright = process.env.PLAYWRIGHT_ENABLED === 'true'
    if (enablePlaywright) {
      try {
        await logProgress({ event: 'playwright_capture', message: 'Attempting dynamic render' })
        // Dynamic import to avoid bundling when unavailable in serverless
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pw = await (Function('return import("playwright")')() as Promise<any>)
        const browser = await pw.chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle' })
        // wait a bit for menus that lazy-load
        await page.waitForTimeout(3500)
        domHtml = await page.content()
        await browser.close()
      } catch {
        await logProgress({ event: 'playwright_capture_skipped', message: 'Falling back to static HTML' })
      }
    } else {
      await logProgress({ event: 'playwright_disabled', message: 'Playwright disabled by env (PLAYWRIGHT_ENABLED!=true)' })
    }

    // Tool 3: normalize_menu
    await logProgress({ event: 'normalize_menu', message: 'Normalizing to categories/items' })
    const sourceHtml = (domHtml && domHtml.length > rawHtml.length) ? domHtml : rawHtml

    let categories: NormalizedCategory[] = []
    try {
      const altCount = (sourceHtml.match(/class="alternate_[12]"/g) || []).length
      if (altCount > 0) {
        const result = scrapeXtremePizzaMenu(sourceHtml)
        categories = result.categories.map((cat: any) => ({
          name: cat.name,
          items: cat.items.map((i: any) => ({ name: i.name, description: i.description || '', prices: i.prices.map((p: any) => p.price) })),
        }))
      } else {
        const result = parseMenuFromHTML(sourceHtml)
        categories = result.categories.map((cat: any) => ({
          name: cat.name,
          items: cat.items.map((i: any) => ({ name: i.name, description: i.description || '', prices: i.prices.map((p: any) => p.price) })),
        }))
      }
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Failed to normalize menu', message: (e as any)?.message || 'unknown' })
    }

    const totals = {
      categories: categories.length,
      items: categories.reduce((sum, c) => sum + (c.items?.length || 0), 0),
    }

    if (importId) {
      await supabaseAdmin
        .from('menu_imports')
        .update({ total_categories: totals.categories, total_items: totals.items })
        .eq('id', importId)
    }

    // Tool 4: supabase_upsert
    await logProgress({ event: 'supabase_upsert', message: 'Creating menu and items' })
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('id, tenant_id')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' })
    }

    const tenantId = restaurant.tenant_id
    const { data: menuRow, error: menuErr } = await supabaseAdmin
      .from('restaurant_menus')
      .insert({
        restaurant_id: restaurantId,
        name: 'Main Menu',
        description: `Complete menu imported from ${url}`,
        is_active: true,
        display_order: 1,
        tenant_id: tenantId,
      })
      .select()
      .single()

    if (menuErr || !menuRow) {
      return res.status(500).json({ success: false, error: 'Failed to create menu', details: menuErr })
    }

    let processedCategories = 0
    let processedItems = 0

    for (let idx = 0; idx < categories.length; idx++) {
      const category = categories[idx]
      // Create a section for this category (Phase 2 schema)
      const { data: sectionRow, error: sectionErr } = await supabaseAdmin
        .from('menu_sections')
        .insert({
          menu_id: menuRow.id,
          name: category.name,
          display_order: idx,
        })
        .select()
        .single()

      if (sectionErr || !sectionRow) {
        await logProgress({ event: 'section_failed', category: category.name, error: sectionErr?.message || 'unknown' })
        continue
      }

      processedCategories += 1
      if (importId) {
        await supabaseAdmin.from('menu_imports').update({ processed_categories: processedCategories }).eq('id', importId)
      }

      const BATCH_SIZE = 25
      let positionCounter = 0
      for (let bi = 0; bi < category.items.length; bi += BATCH_SIZE) {
        const batch = category.items.slice(bi, bi + BATCH_SIZE)
        const itemInserts = batch.map((item) => ({
          tenant_id: tenantId,
          base_name: item.name,
          base_desc: item.description || '',
          base_price: (Array.isArray(item.prices) && item.prices.length > 0 ? item.prices[0] : item.price) || 0,
        }))

        const { data: baseItems, error: baseErr } = await supabaseAdmin
          .from('items')
          .insert(itemInserts)
          .select()

        if (baseErr) {
          await logProgress({ event: 'items_batch_failed', error: baseErr.message, category: category.name })
          continue
        }

        const linkInserts = (baseItems || []).map((biRow, i) => ({
          menu_section_id: sectionRow.id,
          item_id: biRow.id,
          position: positionCounter + i,
          name_override: null,
          desc_override: null,
          price_override: null,
        }))

        const { error: linkErr } = await supabaseAdmin
          .from('menu_section_items')
          .insert(linkInserts)

        if (linkErr) {
          await logProgress({ event: 'link_batch_failed', error: linkErr.message, category: category.name })
        } else {
          processedItems += linkInserts.length
          positionCounter += linkInserts.length
          if (importId) await supabaseAdmin.from('menu_imports').update({ processed_items: processedItems }).eq('id', importId)
        }
      }
    }

    // Mark completion
    const costUsd = 0.0 // Placeholder until LLM usage is added
    if (importId) {
      await supabaseAdmin
        .from('menu_imports')
        .update({ status: 'completed', completed_at: new Date().toISOString(), agent_run_id: runId, agent_cost_usd: costUsd, logs: [{ event: 'completed', at: new Date().toISOString(), elapsed_ms: Date.now() - startedAt }] })
        .eq('id', importId)
    }

    return res.status(200).json({
      success: true,
      categories: processedCategories,
      items: processedItems,
      restaurant_id: restaurantId,
      menu_id: menuRow.id,
      preview: categories.map((c) => ({ name: c.name, items: c.items.length })),
      agent: { provider: process.env.AGENT_PROVIDER || 'none', run_id: runId, cost_usd: costUsd },
      elapsed_ms: Date.now() - startedAt,
    })
  } catch (error) {
    // Best-effort failure mark
    try {
      const { url, restaurant_id } = req.body || {}
      if (restaurant_id) {
        await supabaseAdmin
          .from('menu_imports')
          .update({ status: 'failed', logs: [{ event: 'failed', at: new Date().toISOString(), error: (error as any)?.message || 'unknown' }] })
          .eq('restaurant_id', restaurant_id)
          .is('completed_at', null)
      }
    } catch {}
    return res.status(500).json({ success: false, error: 'Internal error', message: (error as any)?.message || 'unknown' })
  }
}


