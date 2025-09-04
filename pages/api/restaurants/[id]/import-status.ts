import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: restaurantId } = req.query;

    if (!restaurantId || typeof restaurantId !== 'string') {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Fetch latest import row for restaurant using admin client (bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('menu_imports')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(200).json({
        success: true,
        status: 'unknown',
        totals: { categories: 0, items: 0 },
        processed: { categories: 0, items: 0 },
        items_failed: 0,
      });
    }

    return res.status(200).json({
      success: true,
      status: data.status || 'unknown',
      totals: {
        categories: data.total_categories || 0,
        items: data.total_items || 0,
      },
      processed: {
        categories: data.processed_categories || 0,
        items: data.processed_items || 0,
      },
      items_failed: data.items_failed || 0,
      started_at: data.started_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
      menu_id: data.menu_id,
    });

  } catch (error) {
    return res.status(200).json({
      success: true,
      status: 'unknown',
      totals: { categories: 0, items: 0 },
      processed: { categories: 0, items: 0 },
      items_failed: 0,
    });
  }
}


