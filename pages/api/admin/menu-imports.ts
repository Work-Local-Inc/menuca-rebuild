import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10) || 50, 200)
    const { data, error } = await supabaseAdmin
      .from('menu_imports')
      .select('id, restaurant_id, source_url, status, total_categories, total_items, processed_categories, processed_items, items_failed, agent_run_id, agent_cost_usd, started_at, updated_at, completed_at')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, imports: data || [] })
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' })
  }
}


