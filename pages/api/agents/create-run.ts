import { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { scrapeXtremePizzaMenu } from '@/lib/simple-scraper'
import { parseMenuFromHTML } from '@/lib/html-menu-parser'
import OpenAI from 'openai'

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
    sizes?: Array<{ name: string; price: number }>
  }>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })

  const startedAt = Date.now()
  const runId = uuidv4()
  const llmKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
  const agentProvider = process.env.AGENT_PROVIDER || (llmKey ? 'openai' : 'none')
  let costUsd = 0.0
  let llmHints: any = null

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
        let existingLogs: any[] = []
        try {
          const { data: row } = await supabaseAdmin
            .from('menu_imports')
            .select('logs')
            .eq('id', importId)
            .single()
          if (Array.isArray((row as any)?.logs)) existingLogs = (row as any).logs
        } catch {}
        await supabaseAdmin
          .from('menu_imports')
          .update({
            ...(patch || {}),
            logs: [...existingLogs, { ...entry, at: new Date().toISOString() }],
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
    const enablePlaywright = process.env.PLAYWRIGHT_ENABLED === 'true' || !!process.env.BROWSERLESS_WS || !!process.env.BROWSERLESS_TOKEN
    const rawBrowserless = process.env.BROWSERLESS_WS || (process.env.BROWSERLESS_TOKEN ? `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}` : '')
    const browserlessWs = rawBrowserless
      ? (/\/playwright(\?|$)/.test(rawBrowserless)
          ? rawBrowserless
          : (rawBrowserless.includes('?')
              ? rawBrowserless.replace('?', '/playwright?')
              : rawBrowserless + '/playwright'))
      : ''
    if (enablePlaywright) {
      try {
        await logProgress({ event: 'playwright_capture', message: 'Attempting dynamic render' })
        // Dynamic import to avoid bundling when unavailable in serverless
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pw = await (Function('return import("playwright-core")')() as Promise<any>)
        const browser = browserlessWs
          ? await pw.chromium.connectOverCDP(browserlessWs)
          : await pw.chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle' })
        // wait a bit for menus that lazy-load
        await page.waitForTimeout(3500)
        domHtml = await page.content()
        try { await browser.close() } catch {}
      } catch {
        await logProgress({ event: 'playwright_capture_skipped', message: 'Falling back to static HTML' })
      }
    } else {
      await logProgress({ event: 'playwright_disabled', message: 'Playwright disabled by env (PLAYWRIGHT_ENABLED!=true)' })
    }

    // Tool 3: normalize_menu
    await logProgress({ event: 'normalize_menu', message: 'Normalizing to categories/items' })
    const sourceHtml = (domHtml && domHtml.length > rawHtml.length) ? domHtml : rawHtml

    const decode = (s: string) => (s || '')
      .replace(/&raquo;|»/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const escapeRegExp = (str: string) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const canonicalizeSize = (raw: string): string | null => {
      const name = decode(raw).toLowerCase()
      // Exclusions that often leak from other groups
      if (/bottle|can|ml|\bl\b|\blb\b|^\d+\s*x\s*/i.test(name)) return null
      if (/sauce|dip|juice|water|sweet|yellow|apple|cheddar|chipotle/i.test(name)) return null
      // Canonical map
      if (/^s(mall)?$/i.test(name)) return 'Small'
      if (/^m(ed(ium)?)?$/i.test(name) || name === 'regular') return 'Medium'
      if (/^l(arge)?$/i.test(name)) return 'Large'
      if (/^(x[-\s]?large|xl|xlarge)$/i.test(name)) return 'X-Large'
      return null
    }

    let categories: NormalizedCategory[] = []
    try {
      const altCount = (sourceHtml.match(/class="alternate_[12]"/g) || []).length
      if (altCount > 0) {
        const result = scrapeXtremePizzaMenu(sourceHtml)
        categories = result.categories.map((cat: any) => ({
          name: cat.name,
          items: cat.items.map((i: any) => ({
            name: i.name,
            description: i.description || '',
            prices: (i.prices || []).map((p: any) => p.price),
            sizes: (i.prices || []).map((p: any) => ({ name: p.size || 'Regular', price: p.price }))
          })),
        }))
      } else {
        const result = parseMenuFromHTML(sourceHtml)
        categories = result.categories.map((cat: any) => ({
          name: cat.name,
          items: cat.items.map((i: any) => ({
            name: i.name,
            description: i.description || '',
            prices: (i.prices || []).map((p: any) => p.price),
            sizes: (i.prices || []).map((p: any) => ({ name: p.size || 'Regular', price: p.price }))
          })),
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

    // Optional: LLM-assisted normalization (Agents SDK — OpenAI)
    if (agentProvider === 'openai' && llmKey) {
      try {
        await logProgress({ event: 'agent_start', provider: agentProvider })
        const openai = new OpenAI({ apiKey: llmKey })
        const model = process.env.LLM_MODEL || 'gpt-4o-mini'
        const compactSummary = () => {
          const maxCats = 10
          const maxItemsPerCat = 20
          const cats = categories.slice(0, maxCats).map((c) => ({
            name: c.name,
            items: (c.items || []).slice(0, maxItemsPerCat).map((i) => ({ name: i.name, sizes: i.sizes?.map((s) => s.name) || [] })),
          }))
          return { categories: cats }
        }
        const userPayload = {
          url,
          catalog: compactSummary(),
          instructions: 'Derive curated toppings_allow (food-only), toppings_deny (beverages/invalid), dip_names, and canonical size names present. JSON only.'
        }
        const completion = await openai.chat.completions.create({
          model,
          temperature: 0.2,
          max_tokens: 600,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a menu normalization agent. Output strict JSON with keys: toppings_allow (string[]), toppings_deny (string[]), dip_names (string[]), size_names (string[]). Do not include explanations.',
            },
            { role: 'user', content: JSON.stringify(userPayload) },
          ],
        })
        const usage = (completion as any)?.usage || null
        if (usage) {
          // Approximate pricing for gpt-4o-mini unless overridden
          const inPer1k = Number(process.env.LLM_INPUT_COST_PER_1K || '0.00015')
          const outPer1k = Number(process.env.LLM_OUTPUT_COST_PER_1K || '0.00060')
          const inCost = (Number(usage.prompt_tokens || 0) / 1000) * inPer1k
          const outCost = (Number(usage.completion_tokens || 0) / 1000) * outPer1k
          costUsd = Number(((inCost + outCost)).toFixed(6))
        }
        try {
          const text = (completion as any)?.choices?.[0]?.message?.content || '{}'
          llmHints = JSON.parse(text)
        } catch {}
        await logProgress({ event: 'agent_done', model, usage: (completion as any)?.usage || null, hints: llmHints ? Object.keys(llmHints) : [] })
        // Optionally refine beverages filter from LLM deny list (best-effort)
        if (llmHints && Array.isArray(llmHints.toppings_deny)) {
          const deny = (llmHints.toppings_deny as string[]).filter(Boolean)
          if (deny.length) {
            // Create a combined regex fragment to use later (saved on closure)
            // We attach to process.env-like variable scope via function wrapper; here we just carry into local regex below where used.
          }
        }
      } catch (e) {
        await logProgress({ event: 'agent_failed', error: (e as any)?.message || 'unknown' })
      }
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

        // Upsert Size modifier groups/options when multiple sizes are detected
        for (let i = 0; i < (baseItems || []).length; i++) {
          const baseRow = (baseItems as any[])[i]
          const src = batch[i] as any
          const isPizza = /pizza/i.test(category.name || '') || /pizza/i.test(src?.name || '')
          let sizesRaw = Array.isArray(src?.sizes) ? src.sizes.filter((s: any) => typeof s?.price === 'number') : []
          // Map to canonical names and filter invalid
          const sizesMapped = sizesRaw
            .map((s: any) => ({ name: canonicalizeSize(String(s?.name || '')), price: Number(s?.price || 0) }))
            .filter((s: any) => s.name)
          // Only apply for pizza items and when we have canonical sizes
          if (!isPizza || sizesMapped.length <= 1) continue

          const basePrice = Number(itemInserts[i].base_price || 0)
          const groupName = 'Size'

          // Ensure modifier group (tenant-scoped). Do not write to generated columns.
          let groupId: string | null = null
          try {
            const { data: existing } = await supabaseAdmin
              .from('modifier_groups')
              .select('id')
              .eq('tenant_id', tenantId)
              .eq('name', groupName)
              .maybeSingle()
            if (existing?.id) {
              groupId = existing.id
            } else {
              const { data: created, error: gErr } = await supabaseAdmin
                .from('modifier_groups')
                .insert({ tenant_id: tenantId, name: groupName, min_selection: 1, max_selection: 1, display_order: 0, is_available: true })
                .select('id')
                .single()
              if (!gErr) groupId = created?.id || null
            }
          } catch {}
          if (!groupId) continue

          // Upsert options for this group (canonical set)
          const seenNames: string[] = []
          for (let oi = 0; oi < sizesMapped.length; oi++) {
            const opt = sizesMapped[oi]
            const optName = String(opt.name)
            if (seenNames.includes(optName)) continue
            seenNames.push(optName)
            const priceDelta = Number(opt.price || 0) - basePrice
            try {
              const { data: optExists } = await supabaseAdmin
                .from('modifier_options')
                .select('id')
                .eq('modifier_group_id', groupId)
                .eq('name', optName)
                .maybeSingle()
              if (!optExists) {
                await supabaseAdmin
                  .from('modifier_options')
                  .insert({ modifier_group_id: groupId, name: optName, price_delta: priceDelta, display_order: oi, is_available: true })
                // no select needed
              } else {
                await supabaseAdmin
                  .from('modifier_options')
                  .update({ price_delta: priceDelta, display_order: oi, is_available: true })
                  .eq('id', optExists.id)
              }
            } catch {}
          }

          // Cleanup: remove stray options not in canonical set for this group
          try {
            await supabaseAdmin.rpc('delete_unused_modifier_options', { p_group_id: groupId, p_keep_names: seenNames })
          } catch {}

          // Link group to item (idempotent)
          try {
            await supabaseAdmin
              .from('item_modifier_groups')
              .upsert({ item_id: baseRow.id, modifier_group_id: groupId, display_order: 0, required: true }, { onConflict: 'item_id,modifier_group_id' })
          } catch {}
        }
      }
    }

    // Heuristic: create global Dips/Toppings groups from scraped categories (and LLM hints) and link to all Pizza items
    try {
      // LLM-proposed dips
      if (llmHints && Array.isArray(llmHints.dip_names) && (llmHints.dip_names as any[]).length) {
        let dipsGroupId: string | null = null
        const { data: ex } = await supabaseAdmin
          .from('modifier_groups')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', 'Dips')
          .maybeSingle()
        if (ex?.id) dipsGroupId = ex.id
        else {
          const { data: created } = await supabaseAdmin
            .from('modifier_groups')
            .insert({ tenant_id: tenantId, name: 'Dips', min_selection: 0, max_selection: null, display_order: 3, is_available: true })
            .select('id')
            .single()
          dipsGroupId = created?.id || null
        }
        if (dipsGroupId) {
          const keepNames: string[] = []
          let order = 0
          for (const nmRaw of (llmHints.dip_names as string[])) {
            const optName = decode(nmRaw)
            if (!optName) continue
            keepNames.push(optName)
            const { data: exists } = await supabaseAdmin
              .from('modifier_options')
              .select('id')
              .eq('modifier_group_id', dipsGroupId)
              .eq('name', optName)
              .maybeSingle()
            if (exists?.id) {
              await supabaseAdmin.from('modifier_options').update({ price_delta: 0, display_order: order, is_available: true }).eq('id', exists.id)
            } else {
              await supabaseAdmin.from('modifier_options').insert({ modifier_group_id: dipsGroupId, name: optName, price_delta: 0, display_order: order, is_available: true })
            }
            order += 1
          }
          try { await supabaseAdmin.rpc('delete_unused_modifier_options', { p_group_id: dipsGroupId, p_keep_names: keepNames }) } catch {}
          // Link to all pizza items
          const { data: pizzaItems } = await supabaseAdmin
            .from('items')
            .select('id, base_name')
            .eq('tenant_id', tenantId)
            .ilike('base_name', '%pizza%')
          for (const pi of (pizzaItems || [])) {
            await supabaseAdmin.from('item_modifier_groups').upsert({ item_id: pi.id, modifier_group_id: dipsGroupId, display_order: 3, required: false }, { onConflict: 'item_id,modifier_group_id' })
          }
        }
      }
      const dipsCat = categories.find(c => /dip|sauce/i.test(c.name))
      if (dipsCat && dipsCat.items?.length) {
        // Ensure group
        let dipsGroupId: string | null = null
        const { data: ex } = await supabaseAdmin
          .from('modifier_groups')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', 'Dips')
          .maybeSingle()
        if (ex?.id) dipsGroupId = ex.id
        else {
          const { data: created } = await supabaseAdmin
            .from('modifier_groups')
            .insert({ tenant_id: tenantId, name: 'Dips', min_selection: 0, max_selection: null, display_order: 2, is_available: true })
            .select('id')
            .single()
          dipsGroupId = created?.id || null
        }
        if (dipsGroupId) {
          const keepNames: string[] = []
          let order = 0
          for (const it of dipsCat.items) {
            const optName = decode(it.name)
            keepNames.push(optName)
            const delta = Number((Array.isArray(it.prices) && it.prices[0]) || it.price || 0)
            const { data: exists } = await supabaseAdmin
              .from('modifier_options')
              .select('id')
              .eq('modifier_group_id', dipsGroupId)
              .eq('name', optName)
              .maybeSingle()
            if (exists?.id) {
              await supabaseAdmin.from('modifier_options').update({ price_delta: delta, display_order: order, is_available: true }).eq('id', exists.id)
            } else {
              await supabaseAdmin.from('modifier_options').insert({ modifier_group_id: dipsGroupId, name: optName, price_delta: delta, display_order: order, is_available: true })
            }
            order += 1
          }
          try { await supabaseAdmin.rpc('delete_unused_modifier_options', { p_group_id: dipsGroupId, p_keep_names: keepNames }) } catch {}
          // Link to all pizza items
          const { data: pizzaItems } = await supabaseAdmin
            .from('items')
            .select('id, base_name')
            .eq('tenant_id', tenantId)
            .ilike('base_name', '%pizza%')
          for (const pi of (pizzaItems || [])) {
            await supabaseAdmin.from('item_modifier_groups').upsert({ item_id: pi.id, modifier_group_id: dipsGroupId, display_order: 3, required: false }, { onConflict: 'item_id,modifier_group_id' })
          }
        }
      }

      // Toppings: avoid beverages; collect likely topping names
      const denyTerms = Array.isArray(llmHints?.toppings_deny)
        ? (llmHints.toppings_deny as string[]).filter(Boolean).map((t) => t.trim()).filter((t) => t.length > 1)
        : []
      const denyPattern = denyTerms.length ? `|${denyTerms.map(escapeRegExp).join('|')}` : ''
      const beverageRx = new RegExp(`(coke|pepsi|sprite|ginger\\s*ale|water|juice|bottle|can|ml|591|2\\s*l|2l|500ml|710\\s*ml|pop${denyPattern})`, 'i')
      let toppingsItems: Array<{ name: string; price: number }> = []
      const topCat = categories.find(c => /topping/i.test(c.name))
      if (topCat && topCat.items?.length) {
        toppingsItems = topCat.items
          .map(i => ({ name: decode(i.name), price: Number((Array.isArray(i.prices) && i.prices[0]) || i.price || 0) }))
          .filter(t => !beverageRx.test(t.name))
      } else {
        // Infer across categories: small priced food add-ons, exclude beverages and dips already handled
        for (const c of categories) {
          if (/dip|sauce|drink|beverage|pop/i.test(c.name)) continue
          for (const it of (c.items || [])) {
            const p = Number((Array.isArray(it.prices) && it.prices[0]) || it.price || 0)
            const nm = decode(it.name)
            if (beverageRx.test(nm)) continue
            if (p >= 2 && p <= 6 && nm.length <= 24) toppingsItems.push({ name: nm, price: p })
          }
        }
      }
      // Deduplicate and cap list to sane size
      const seenTop: Record<string, number> = {}
      toppingsItems = toppingsItems.filter(t => (seenTop[t.name] ? false : (seenTop[t.name] = 1))).slice(0, 60)

      // If LLM provided allow list, filter to that set only
      const allow = Array.isArray(llmHints?.toppings_allow)
        ? (llmHints.toppings_allow as string[]).filter(Boolean).map((t) => t.trim().toLowerCase())
        : []
      if (allow.length) {
        toppingsItems = toppingsItems.filter((t) => allow.includes(t.name.toLowerCase()))
      }

      if (toppingsItems.length) {
        let topsGroupId: string | null = null
        const { data: tEx } = await supabaseAdmin
          .from('modifier_groups')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', 'Toppings')
          .maybeSingle()
        if (tEx?.id) topsGroupId = tEx.id
        else {
          const { data: tCreated } = await supabaseAdmin
            .from('modifier_groups')
            .insert({ tenant_id: tenantId, name: 'Toppings', min_selection: 0, max_selection: null, display_order: 2, is_available: true })
            .select('id')
            .single()
          topsGroupId = tCreated?.id || null
        }
        if (topsGroupId) {
          const keepNames: string[] = []
          let order = 0
          for (const t of toppingsItems) {
            const nm = t.name
            keepNames.push(nm)
            const delta = Number(isNaN(t.price) ? 3.5 : t.price)
            const { data: exists } = await supabaseAdmin
              .from('modifier_options')
              .select('id')
              .eq('modifier_group_id', topsGroupId)
              .eq('name', nm)
              .maybeSingle()
            if (exists?.id) {
              await supabaseAdmin.from('modifier_options').update({ price_delta: delta, display_order: order, is_available: true }).eq('id', exists.id)
            } else {
              await supabaseAdmin.from('modifier_options').insert({ modifier_group_id: topsGroupId, name: nm, price_delta: delta, display_order: order, is_available: true })
            }
            order += 1
          }
          try { await supabaseAdmin.rpc('delete_unused_modifier_options', { p_group_id: topsGroupId, p_keep_names: keepNames }) } catch {}
          // Link toppings to all pizzas; cap max only for BYO N‑topping items
          const { data: allItems } = await supabaseAdmin
            .from('items')
            .select('id, base_name')
            .eq('tenant_id', tenantId)
          for (const it of (allItems || [])) {
            const name = String(it.base_name || '')
            if (!/pizza/i.test(name)) continue
            const match = name.match(/(\d+)\s*(?:x\s*)?topping/i)
            const payload: any = { item_id: it.id, modifier_group_id: topsGroupId, display_order: 2, required: false, min_selection: 0 }
            if (match) {
              const maxN = Math.max(1, Math.min(10, parseInt(match[1], 10) || 1))
              payload.max_selection = maxN
            } else {
              payload.max_selection = null
            }
            await supabaseAdmin
              .from('item_modifier_groups')
              .upsert(payload, { onConflict: 'item_id,modifier_group_id' })
          }
        }
      }

      // Crust: default set when pizza present
      const { data: anyPizza } = await supabaseAdmin
        .from('items')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('base_name', '%pizza%')
        .limit(1)
      if (anyPizza && anyPizza.length > 0) {
        let crustGroupId: string | null = null
        const { data: cEx } = await supabaseAdmin
          .from('modifier_groups')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', 'Crust type')
          .maybeSingle()
        if (cEx?.id) crustGroupId = cEx.id
        else {
          const { data: cCreated } = await supabaseAdmin
            .from('modifier_groups')
            .insert({ tenant_id: tenantId, name: 'Crust type', min_selection: 1, max_selection: 1, display_order: 1, is_available: true })
            .select('id')
            .single()
          crustGroupId = cCreated?.id || null
        }
        if (crustGroupId) {
          const crustOpts = ['Regular Crust', 'Thick Crust', 'Thin Crust']
          for (let i = 0; i < crustOpts.length; i++) {
            const nm = crustOpts[i]
            const { data: exists } = await supabaseAdmin
              .from('modifier_options')
              .select('id')
              .eq('modifier_group_id', crustGroupId)
              .eq('name', nm)
              .maybeSingle()
            if (!exists?.id) {
              await supabaseAdmin.from('modifier_options').insert({ modifier_group_id: crustGroupId, name: nm, price_delta: 0, display_order: i, is_available: true })
            }
          }
          const { data: pizzaItems2 } = await supabaseAdmin
            .from('items')
            .select('id, base_name')
            .eq('tenant_id', tenantId)
            .ilike('base_name', '%pizza%')
          for (const pi of (pizzaItems2 || [])) {
            await supabaseAdmin.from('item_modifier_groups').upsert({ item_id: pi.id, modifier_group_id: crustGroupId, display_order: 1, required: true }, { onConflict: 'item_id,modifier_group_id' })
          }
        }
      }
    } catch {}

    // Portioning: create a "Portion" group and link to BYO N‑topping pizzas (Whole/Left/Right)
    try {
      const { data: anyPizza2 } = await supabaseAdmin
        .from('items')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('base_name', '%pizza%')
        .limit(1)
      if (anyPizza2 && anyPizza2.length > 0) {
        let portionGroupId: string | null = null
        const { data: pEx } = await supabaseAdmin
          .from('modifier_groups')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', 'Portion')
          .maybeSingle()
        if (pEx?.id) portionGroupId = pEx.id
        else {
          const { data: pCreated } = await supabaseAdmin
            .from('modifier_groups')
            .insert({ tenant_id: tenantId, name: 'Portion', min_selection: 0, max_selection: 1, display_order: 4, is_available: true })
            .select('id')
            .single()
          portionGroupId = pCreated?.id || null
        }
        if (portionGroupId) {
          const portionOpts = ['Whole', 'Left', 'Right']
          for (let i = 0; i < portionOpts.length; i++) {
            const nm = portionOpts[i]
            const { data: exists } = await supabaseAdmin
              .from('modifier_options')
              .select('id')
              .eq('modifier_group_id', portionGroupId)
              .eq('name', nm)
              .maybeSingle()
            if (exists?.id) {
              await supabaseAdmin
                .from('modifier_options')
                .update({ price_delta: 0, display_order: i, is_available: true })
                .eq('id', exists.id)
            } else {
              await supabaseAdmin
                .from('modifier_options')
                .insert({ modifier_group_id: portionGroupId, name: nm, price_delta: 0, display_order: i, is_available: true })
            }
          }
          try { await supabaseAdmin.rpc('delete_unused_modifier_options', { p_group_id: portionGroupId, p_keep_names: portionOpts }) } catch {}

          const { data: pizzaItems3 } = await supabaseAdmin
            .from('items')
            .select('id, base_name')
            .eq('tenant_id', tenantId)
          for (const it of (pizzaItems3 || [])) {
            const name = String(it.base_name || '')
            const match = name.match(/(\d+)\s*(?:x\s*)?topping/i)
            if (!/pizza/i.test(name) || !match) continue
            await supabaseAdmin
              .from('item_modifier_groups')
              .upsert({ item_id: it.id, modifier_group_id: portionGroupId, display_order: 4, required: false }, { onConflict: 'item_id,modifier_group_id' })
          }
        }
      }
    } catch {}

    // Optional: capture add-on groups (crust, toppings, dips) via Playwright and map to items
    if (enablePlaywright) {
      try {
        await logProgress({ event: 'addons_capture', message: 'Scraping add-ons via Playwright', browserless: Boolean(browserlessWs) })
        // Dynamic import to avoid bundling
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pw = await (Function('return import("playwright-core")')() as Promise<any>)
        const browser = browserlessWs
          ? await pw.chromium.connectOverCDP(browserlessWs)
          : await pw.chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle').catch(()=>{})

        // Heuristic: find clickable menu items
        const itemSel = '.menu-item, [data-item], .item, .alternate_1, .alternate_2, .food-item, .menuItem'
        const els = await page.locator(itemSel).elementHandles()
        const scraped: Array<{ name: string; groups: Array<{ name: string; options: Array<{ name: string; price_delta: number }> }> }> = []
        const parsePrice = (text: string) => {
          const m = (text || '').replace(/,/g,'').match(/([+-]?\$?\s*\d+(?:\.\d{1,2})?)/)
          if (!m) return 0
          const n = parseFloat(m[1].replace(/\$/g,'').trim())
          return isNaN(n) ? 0 : n
        }
        for (let i = 0; i < Math.min(els.length, 30); i++) {
          const el = els[i]
          const title = decode((await el.textContent())?.slice(0, 120) || '')
          try { await el.click({ timeout: 1500 }) } catch {}
          try { const btn = await (await el.asElement())?.$('button, .add, .customize, [data-open]'); if (btn) await btn.click({ timeout: 1500 }) } catch {}
          const modal = await page.waitForSelector('dialog, .modal, [role="dialog"], .lightbox, .fancybox-inner, .ui-dialog, .fancybox-overlay, .fancybox-wrap', { timeout: 2500 }).catch(()=>null)
          if (!modal) continue
          let root: any = modal
          const iframeEl = await modal.$('iframe, .fancybox-iframe').catch(()=>null)
          if (iframeEl) {
            try { const frame = await iframeEl.contentFrame(); if (frame) root = frame } catch {}
          }
          const conts = iframeEl ? await (root).$$('fieldset, .group, .options, .modifier-group, .toppings, .crust, .section') : await modal.$$('fieldset, .group, .options, .modifier-group, .toppings, .crust, .section')
          const groups: any[] = []
          for (const g of conts) {
            const gname = decode((await (await g.$('legend, .title, h3, h4, .group-title'))?.textContent()?.catch(()=>'')) || '')
            const optEls = await g.$$('label, .option, li, .row, a')
            const options: any[] = []
            for (const oe of optEls) {
              const txt = decode((await oe.textContent()) || '')
              if (!txt) continue
              options.push({ name: txt.replace(/\$\s*\d+(?:\.\d{1,2})?/, '').trim(), price_delta: parsePrice(txt) })
            }
            if (options.length) groups.push({ name: gname || 'Options', options })
          }
          if (groups.length) {
            scraped.push({ name: title, groups })
            await logProgress({ event: 'addons_capture_item', item: title, groups: groups.length })
          }
          try { await page.keyboard.press('Escape') } catch {}
          try { const closeBtn = await page.$('button:has-text("Close"), .close, .fancybox-close, .ui-dialog-titlebar-close'); if (closeBtn) await closeBtn.click({ timeout: 800 }) } catch {}
        }
        try { await browser.close() } catch {}

        // Map scraped groups back to items and upsert
        for (const si of scraped) {
          const base = await supabaseAdmin
            .from('items')
            .select('id, base_name')
            .eq('tenant_id', tenantId)
            .ilike('base_name', si.name + '%')
            .maybeSingle()
          const baseId = (base as any)?.data?.id as string | undefined
          if (!baseId) continue

          for (const g of si.groups) {
            const gnameRaw = decode(g.name)
            const gname = gnameRaw || 'Options'
            // Heuristic min/max
            let minSel = 0, maxSel: number | null = null, required = false
            if (/crust/i.test(gname)) { minSel = 1; maxSel = 1; required = true }
            if (/topping/i.test(gname) || /add more/i.test(gname)) { minSel = 0; maxSel = null; required = false }
            if (/dip/i.test(gname) || /sauce/i.test(gname)) { minSel = 0; maxSel = null; required = false }

            // Ensure group (tenant scoped)
            let groupId: string | null = null
            const { data: mgExisting } = await supabaseAdmin
              .from('modifier_groups')
              .select('id')
              .eq('tenant_id', tenantId)
              .eq('name', gname)
              .maybeSingle()
            if (mgExisting?.id) groupId = mgExisting.id
            else {
              const { data: mgCreated } = await supabaseAdmin
                .from('modifier_groups')
                .insert({ tenant_id: tenantId, name: gname, min_selection: minSel, max_selection: maxSel, display_order: 1, is_available: true })
                .select('id')
                .single()
              groupId = mgCreated?.id || null
            }
            if (!groupId) continue

            // Upsert options
            let order = 0
            const keepNames: string[] = []
            for (const opt of g.options) {
              const oname = decode(String(opt.name || 'Option'))
              keepNames.push(oname)
              const priceDelta = Number(opt.price_delta || 0)
              const { data: exists } = await supabaseAdmin
                .from('modifier_options')
                .select('id')
                .eq('modifier_group_id', groupId)
                .eq('name', oname)
                .maybeSingle()
              if (exists?.id) {
                await supabaseAdmin
                  .from('modifier_options')
                  .update({ price_delta: priceDelta, display_order: order, is_available: true })
                  .eq('id', exists.id)
              } else {
                await supabaseAdmin
                  .from('modifier_options')
                  .insert({ modifier_group_id: groupId, name: oname, price_delta: priceDelta, display_order: order, is_available: true })
              }
              order += 1
            }
            try { await supabaseAdmin.rpc('delete_unused_modifier_options', { p_group_id: groupId, p_keep_names: keepNames }) } catch {}

            // Link to item
            await supabaseAdmin
              .from('item_modifier_groups')
              .upsert({ item_id: baseId, modifier_group_id: groupId, display_order: 1, required }, { onConflict: 'item_id,modifier_group_id' })
            await logProgress({ event: 'addons_linked', item: si.name, group: gname, options: g.options?.length || 0 })
          }
        }
        await logProgress({ event: 'addons_done', message: 'Add-ons captured and linked' })
      } catch (e) {
        await logProgress({ event: 'addons_failed', error: (e as any)?.message || 'unknown' })
      }
    }

    // Mark completion
    if (importId) {
      try {
        let existingLogs: any[] = []
        try {
          const { data: row } = await supabaseAdmin
            .from('menu_imports')
            .select('logs')
            .eq('id', importId)
            .single()
          if (Array.isArray((row as any)?.logs)) existingLogs = (row as any).logs
        } catch {}
        await supabaseAdmin
          .from('menu_imports')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            agent_run_id: runId,
            agent_cost_usd: costUsd,
            logs: [...existingLogs, { event: 'completed', at: new Date().toISOString(), elapsed_ms: Date.now() - startedAt }],
          })
          .eq('id', importId)
      } catch {}
    }

    return res.status(200).json({
      success: true,
      categories: processedCategories,
      items: processedItems,
      restaurant_id: restaurantId,
      menu_id: menuRow.id,
      preview: categories.map((c) => ({ name: c.name, items: c.items.length })),
      agent: { provider: agentProvider, run_id: runId, cost_usd: costUsd },
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


