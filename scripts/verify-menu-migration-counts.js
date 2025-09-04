#!/usr/bin/env node
// Compares legacy counts (categories/items) with new views after migration
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run(restaurantId) {
  if (!restaurantId) {
    console.error('Usage: verify-menu-migration-counts <restaurantId>')
    process.exit(1)
  }

  const { data: menu } = await supabase
    .from('restaurant_menus')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .maybeSingle()

  if (!menu) {
    console.log('No active menu found')
    return
  }

  const { data: legacyCats } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menu.id)

  const { data: legacyItems } = await supabase
    .from('menu_items')
    .select('id, category_id')
    .in('category_id', (legacyCats || []).map(c => c.id))

  const { data: viewCats } = await supabase
    .from('menu_categories_v')
    .select('id')
    .eq('menu_id', menu.id)

  const { data: viewItems } = await supabase
    .from('menu_items_v')
    .select('id, category_id')
    .in('category_id', (viewCats || []).map(c => c.id))

  console.log(JSON.stringify({
    restaurantId,
    menuId: menu.id,
    legacy: {
      categories: legacyCats?.length || 0,
      items: legacyItems?.length || 0
    },
    views: {
      categories: viewCats?.length || 0,
      items: viewItems?.length || 0
    }
  }, null, 2))
}

run(process.argv[2])


