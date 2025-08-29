import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id: restaurantId, categoryId } = req.query as { id?: string; categoryId?: string }
    if (!restaurantId || !categoryId) {
      return res.status(400).json({ error: 'Restaurant ID and Category ID are required' })
    }

    const { name, display_order } = req.body ?? {}

    // Verify category belongs to this restaurant via menu
    const { data: category, error: catErr } = await supabaseAdmin
      .from('menu_categories')
      .select('id, menu_id, name, display_order')
      .eq('id', categoryId)
      .single()

    if (catErr || !category) {
      return res.status(404).json({ error: 'Category not found' })
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
      return res.status(403).json({ error: 'Category does not belong to this restaurant' })
    }

    const update: any = {}
    if (typeof name === 'string') update.name = name
    if (typeof display_order !== 'undefined') update.display_order = Number(display_order)

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('menu_categories')
      .update(update)
      .eq('id', categoryId)
      .select('id, name, description, display_order')
      .single()

    if (updErr) return res.status(500).json({ error: 'Failed to update category', details: updErr.message })

    return res.status(200).json({ success: true, category: updated })
  } catch (e: any) {
    return res.status(500).json({ error: 'Internal server error', details: e?.message || String(e) })
  }
}
