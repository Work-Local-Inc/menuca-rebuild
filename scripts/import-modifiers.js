#!/usr/bin/env node
// Import modifiers JSON (from scrape-modifiers-playwright.js) into Supabase tables
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g,'')
if (!url || !key) { console.error('Missing Supabase URL or SERVICE ROLE'); process.exit(1) }
const supabase = createClient(url, key)

async function ensureGroup(tenantId, name) {
  const { data } = await supabase.from('modifier_groups').select('id').eq('tenant_id', tenantId).eq('name', name).maybeSingle()
  if (data) return data.id
  const { data: ins, error } = await supabase.from('modifier_groups').insert({ tenant_id: tenantId, name }).select('id').single()
  if (error) throw error
  return ins.id
}

async function ensureOption(groupId, opt) {
  const { data } = await supabase.from('modifier_options').select('id').eq('modifier_group_id', groupId).eq('name', opt.name).maybeSingle()
  if (data) return data.id
  const { data: ins, error } = await supabase.from('modifier_options').insert({ modifier_group_id: groupId, name: opt.name, price_delta: opt.price_delta || 0 }).select('id').single()
  if (error) throw error
  return ins.id
}

async function run(jsonPath, tenantId, itemIdMapPath) {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const itemIdMap = fs.existsSync(itemIdMapPath) ? JSON.parse(fs.readFileSync(itemIdMapPath, 'utf8')) : {}
  for (const it of payload.items) {
    const groupIds = []
    for (const g of it.groups) {
      const gid = await ensureGroup(tenantId, g.name)
      for (const o of g.options) await ensureOption(gid, o)
      groupIds.push(gid)
    }
    const baseItemId = itemIdMap[it.name]
    if (baseItemId) {
      for (let i = 0; i < groupIds.length; i++) {
        await supabase.from('item_modifier_groups').upsert({ item_id: baseItemId, modifier_group_id: groupIds[i], display_order: i }, { onConflict: 'item_id,modifier_group_id' })
      }
    }
  }
  console.log('Import complete')
}

if (require.main === module) {
  const [json, tenant, map] = process.argv.slice(2)
  if (!json || !tenant) {
    console.error('Usage: node scripts/import-modifiers.js <modifiers.json> <tenant_id> [itemNameToId.json]')
    process.exit(1)
  }
  run(json, tenant, map || 'itemNameToId.json').catch(e => { console.error(e); process.exit(1) })
}


