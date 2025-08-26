import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: restaurantId } = req.query;

    if (!restaurantId || typeof restaurantId !== 'string') {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

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

    // Transform to match frontend interface
    const restaurantData = {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description || '',
      cuisine_type: restaurant.cuisine_type || 'Restaurant',
      status: restaurant.status || 'active',
      rating: 4.8, // TODO: Calculate from reviews
      total_orders: 0, // TODO: Calculate from orders
      today_revenue: 0, // TODO: Calculate from today's orders
      review_count: 0, // TODO: Calculate from reviews
      delivery_time: '25-35 min', // TODO: Add to database
      delivery_fee: 2.99, // TODO: Add to database
      min_order: 15.00, // TODO: Add to database
      address: typeof restaurant.address === 'string' ? restaurant.address : '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      is_open: true // TODO: Add business hours logic
    };

    return res.status(200).json({ 
      success: true, 
      restaurant: restaurantData 
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
