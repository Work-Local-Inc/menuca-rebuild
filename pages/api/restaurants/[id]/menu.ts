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

    // First, get the restaurant menu
    const { data: restaurantMenu, error: menuError } = await supabase
      .from('restaurant_menus')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .single();

    if (menuError) {
      console.error('❌ Error fetching restaurant menu:', menuError);
      return res.status(404).json({ error: 'Menu not found' });
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

    // Get all categories for this menu
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('menu_id', restaurantMenu.id)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return res.status(500).json({ error: 'Error fetching categories' });
    }

    console.log(`✅ Found ${categories?.length || 0} categories`);

    // Get all menu items for these categories
    const categoryIds = categories?.map(cat => cat.id) || [];
    
    let allMenuItems = [];
    
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
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (itemsError) {
        console.error('❌ Error fetching menu items:', itemsError);
        return res.status(500).json({ error: 'Error fetching menu items' });
      }

      allMenuItems = menuItems || [];
    }

    console.log(`✅ Found ${allMenuItems.length} menu items`);

    // Transform menu items to match frontend interface
    const transformedMenuItems = allMenuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price) || 0,
      category: item.menu_categories?.name || 'Other',
      dietary_tags: [], // TODO: Add dietary tags to database
      prep_time: 15, // TODO: Add prep time to database
      rating: 4.5, // TODO: Calculate from reviews
      is_popular: false, // TODO: Calculate based on orders
      image_url: item.image_url || null
    }));

    // Group items by category for summary
    const categoryStats = categories?.map(cat => ({
      name: cat.name,
      description: cat.description,
      items_count: allMenuItems.filter(item => item.category_id === cat.id).length
    })) || [];

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
