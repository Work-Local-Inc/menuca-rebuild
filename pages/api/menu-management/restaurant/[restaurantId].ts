import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;
  
  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ success: false, error: 'Restaurant ID required' });
  }

  if (req.method === 'GET') {
    try {
      // Get menus for the restaurant
      const { data: menus, error: menusError } = await supabase
        .from('restaurant_menus')
        .select(`
          *,
          categories:menu_categories(
            *,
            items:menu_items(*)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (menusError) {
        console.error('Supabase error:', menusError);
        return res.status(500).json({ success: false, error: 'Failed to fetch menus' });
      }

      // Transform data to match expected format
      const transformedMenus = menus?.map(menu => ({
        id: menu.id,
        restaurantId: menu.restaurant_id,
        tenantId: menu.tenant_id,
        name: menu.name,
        description: menu.description,
        categories: menu.categories?.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          is_active: category.is_active,
          items: category.items?.map(item => ({
            id: item.id,
            categoryId: item.category_id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            cost: parseFloat(item.cost || '0'),
            images: item.images || [],
            options: item.options || [],
            nutritional_info: item.nutritional_info || {},
            allergens: item.allergens || [],
            tags: item.tags || [],
            availability: item.availability || {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '00:00', end_time: '23:59' }]
            },
            display_order: item.display_order,
            is_active: item.is_active,
            is_featured: item.is_featured,
            preparation_time: item.preparation_time,
            created_at: item.created_at,
            updated_at: item.updated_at
          })) || []
        })) || [],
        is_active: menu.is_active,
        display_order: menu.display_order,
        created_at: menu.created_at,
        updated_at: menu.updated_at,
        created_by: menu.created_by
      })) || [];

      return res.json({ success: true, data: transformedMenus });
    } catch (error) {
      console.error('Error fetching restaurant menus:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}