import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { id } = req.query
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id is required' })
    const { data, error } = await supabaseAdmin
      .from('menu_imports')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ success: true, import: data })
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' })
  }
}


