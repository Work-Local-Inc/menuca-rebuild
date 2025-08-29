import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '')
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Restaurant ID is required' })
    }

    const { logo_url, banner_url } = req.body || {}

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        logo_url: logo_url ?? null,
        banner_url: banner_url ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, logo_url, banner_url')
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to update images', details: error })
    }

    return res.status(200).json({ success: true, restaurant: data })
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}


