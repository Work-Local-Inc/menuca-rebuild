import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id: restaurantId, itemId } = req.query as { id?: string; itemId?: string }
    if (!restaurantId || !itemId) {
      return res.status(400).json({ error: 'Restaurant ID and Item ID are required' })
    }

    const { name, description, price, is_active } = req.body ?? {}

    // Fetch the item and verify it belongs to this restaurant via category -> menu -> restaurant
    const { data: itemRow, error: itemErr } = await supabaseAdmin
      .from('menu_items')
      .select('id, category_id')
      .eq('id', itemId)
      .single()

    if (itemErr || !itemRow) {
      return res.status(404).json({ error: 'Menu item not found' })
    }

    // Fetch category -> menu
    const { data: category, error: catErr } = await supabaseAdmin
      .from('menu_categories')
      .select('id, menu_id')
      .eq('id', itemRow.category_id)
      .single()

    if (catErr || !category) {
      return res.status(400).json({ error: 'Item category not found' })
    }

    const { data: menu, error: menuErr } = await supabaseAdmin
      .from('restaurant_menus')
      .select('id, restaurant_id')
      .eq('id', category.menu_id)
      .single()

    if (menuErr || !menu) {
      return res.status(400).json({ error: 'Menu not found' })
    }

    if (menu.restaurant_id !== restaurantId) {
      return res.status(403).json({ error: 'Item does not belong to this restaurant' })
    }

    const update: any = {}
    if (typeof name === 'string') update.name = name
    if (typeof description === 'string') update.description = description
    if (typeof price !== 'undefined') {
      const parsed = Number(price)
      if (Number.isNaN(parsed)) return res.status(400).json({ error: 'Invalid price' })
      update.price = parsed
    }
    if (typeof is_active === 'boolean') update.is_active = is_active

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('menu_items')
      .update(update)
      .eq('id', itemId)
      .select('*')
      .single()

    if (updErr) return res.status(500).json({ error: 'Failed to update item', details: updErr.message })

    return res.status(200).json({ success: true, item: updated })
  } catch (e: any) {
    return res.status(500).json({ error: 'Internal server error', details: e?.message || String(e) })
  }
}
