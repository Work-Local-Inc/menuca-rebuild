import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: restaurantId } = req.query;

    if (!restaurantId || typeof restaurantId !== 'string') {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    if (req.method === 'GET') {
      console.log('🔍 Fetching restaurant data for ID:', restaurantId);

      // Fetch restaurant data
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) {
        console.error('❌ Error fetching restaurant:', restaurantError);
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      console.log('✅ Found restaurant:', restaurant.name);

      // Transform to match frontend interface (avoid placeholders for fee fields)
      const restaurantData = {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || `Delicious ${restaurant.cuisine_type || 'food'} restaurant`,
        cuisine_type: restaurant.cuisine_type || 'Restaurant',
        status: restaurant.status || 'active',
        logo_url: restaurant.logo_url || null,
        banner_url: restaurant.banner_url || null,
        rating: 4.8, // TODO: Calculate from reviews
        total_orders: 0, // TODO: Calculate from orders
        today_revenue: 0, // TODO: Calculate from today's orders
        review_count: 47, // Demo value - TODO: Calculate from reviews
        delivery_time: '25-35 min', // TODO: Add to database
        // Fee configuration (from DB; optional)
        delivery_fee_enabled: !!restaurant.delivery_fee_enabled,
        delivery_fee: restaurant.delivery_fee ?? null,
        out_of_area_fee_enabled: !!restaurant.out_of_area_fee_enabled,
        out_of_area_fee: restaurant.out_of_area_fee ?? null,
        delivery_radius_km: restaurant.delivery_radius_km ?? null,
        latitude: restaurant.latitude ?? null,
        longitude: restaurant.longitude ?? null,
        min_order: 15.00, // TODO: Add to database
        address: typeof restaurant.address === 'string' && restaurant.address 
          ? restaurant.address 
          : '7772 Jeanne d\'Arc Blvd, Ottawa, ON K1C 2R5', // Tony's Pizza real address
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        is_open: true // TODO: Add business hours logic
      };

      return res.status(200).json({ 
        success: true, 
        restaurant: restaurantData 
      });
    }

    if (req.method === 'PUT') {
      const payload = req.body || {};

      const update: Record<string, any> = {}
      if ('delivery_fee_enabled' in payload) update.delivery_fee_enabled = !!payload.delivery_fee_enabled
      if ('delivery_fee' in payload) update.delivery_fee = payload.delivery_fee === null ? null : Number(payload.delivery_fee)
      if ('out_of_area_fee_enabled' in payload) update.out_of_area_fee_enabled = !!payload.out_of_area_fee_enabled
      if ('out_of_area_fee' in payload) update.out_of_area_fee = payload.out_of_area_fee === null ? null : Number(payload.out_of_area_fee)
      if ('delivery_radius_km' in payload) update.delivery_radius_km = payload.delivery_radius_km === null ? null : Number(payload.delivery_radius_km)
      if ('latitude' in payload) update.latitude = payload.latitude === null ? null : Number(payload.latitude)
      if ('longitude' in payload) update.longitude = payload.longitude === null ? null : Number(payload.longitude)

      const { data, error } = await supabaseAdmin
        .from('restaurants')
        .update(update)
        .eq('id', restaurantId)
        .select('*')
        .single()

      if (error) {
        console.error('❌ Error updating restaurant:', error)
        return res.status(400).json({ error: 'Update failed', details: error.message })
      }

      return res.status(200).json({ success: true, restaurant: data })
    }

    if (req.method === 'DELETE') {
      // Hard delete restaurant and related data (menu items, categories, menus)
      try {
        // Fetch menus for restaurant
        const { data: menus } = await supabaseAdmin
          .from('restaurant_menus')
          .select('id')
          .eq('restaurant_id', restaurantId)

        const menuIds = (menus || []).map((m: any) => m.id)

        // Delete menu items (by restaurant_id)
        await supabaseAdmin.from('menu_items').delete().eq('restaurant_id', restaurantId)

        // Delete categories (by menu_id)
        if (menuIds.length > 0) {
          await supabaseAdmin.from('menu_categories').delete().in('menu_id', menuIds)
        }

        // Delete menus
        await supabaseAdmin.from('restaurant_menus').delete().eq('restaurant_id', restaurantId)

        // Finally delete restaurant
        const { error: delErr } = await supabaseAdmin.from('restaurants').delete().eq('id', restaurantId)
        if (delErr) throw delErr
        return res.status(200).json({ success: true })
      } catch (e: any) {
        console.error('❌ Hard delete failed:', e)
        return res.status(500).json({ error: 'delete_failed', details: e?.message || String(e) })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
