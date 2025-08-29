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

    console.log('🔍 Fetching menu for restaurant ID:', restaurantId);

    const { data: restaurantMenu, error: menuError } = await supabase
      .from('restaurant_menus')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .single();

    if (menuError) {
      console.warn('⚠️ No active menu yet or error fetching restaurant menu. Returning empty menu.', menuError);
      return res.status(200).json({ 
        success: true,
        menu: [],
        categories: [],
        message: 'Menu not available yet'
      });
    }

    if (!restaurantMenu) {
      console.log('⚠️ No active menu found for restaurant');
      return res.status(200).json({ 
        success: true, 
        menu: [],
        categories: [],
        message: 'No menu items found'
      });
    }

    console.log('✅ Found restaurant menu:', restaurantMenu.name);

    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('id, name, description, display_order')
      .eq('menu_id', restaurantMenu.id)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return res.status(500).json({ error: 'Error fetching categories' });
    }

    console.log(`✅ Found ${categories?.length || 0} categories`);

    const categoryIds = categories?.map(cat => cat.id) || [];
    
    let allMenuItems: any[] = [];
    
    if (categoryIds.length > 0) {
      const { data: menuItems, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories (
            name,
            display_order
          )
        `)
        .in('category_id', categoryIds)
        .order('display_order', { ascending: true });

      if (itemsError) {
        console.error('❌ Error fetching menu items:', itemsError);
        return res.status(500).json({ error: 'Error fetching menu items' });
      }

      allMenuItems = menuItems || [];
    }

    console.log(`✅ Found ${allMenuItems.length} menu items`);

    const transformedMenuItems = allMenuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price) || 0,
      category: item.menu_categories?.name || 'Other',
      dietary_tags: [],
      prep_time: 15,
      rating: 4.5,
      is_popular: false,
      image_url: item.image_url || null,
      is_active: item.is_active ?? true,
      category_id: item.category_id
    }));

    const categoryStats = (categories || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      display_order: cat.display_order,
      items_count: allMenuItems.filter(item => item.category_id === cat.id).length
    }));

    return res.status(200).json({ 
      success: true, 
      menu: transformedMenuItems,
      categories: categoryStats,
      restaurant_menu: {
        id: restaurantMenu.id,
        name: restaurantMenu.name,
        description: restaurantMenu.description
      },
      stats: {
        total_items: transformedMenuItems.length,
        total_categories: categories?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
