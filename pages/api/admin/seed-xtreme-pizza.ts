import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { xtremeMenuData } from '@/data/xtreme-pizza-complete';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🍕 Starting Xtreme Pizza data insertion...');
    
    const restaurantId = 'user-restaurant-user-adminmenucalocal-YWRtaW5A';
    const tenantId = 'default-tenant';
    const userId = 'user-adminmenucalocal-YWRtaW5A';
    
    // 1. Create/Update Restaurant
    console.log('📍 Creating restaurant...');
    const { error: restaurantError } = await supabase
      .from('restaurants')
      .upsert({
        id: restaurantId,
        tenant_id: tenantId,
        name: 'admin@menuca.local Restaurant (Xtreme Pizza)',
        description: 'Test restaurant loaded with real Xtreme Pizza Ottawa menu data',
        cuisine_type: 'Pizza',
        location: 'Ottawa, ON',
        phone: '+1-613-555-0123',
        address: '123 Test Street, Ottawa, ON K1A 0A6',
        is_active: true,
        created_by: userId,
        updated_by: userId
      });
    
    if (restaurantError) {
      console.error('Restaurant error:', restaurantError);
      throw restaurantError;
    }
    console.log('✅ Restaurant created');

    // 2. Create/Update Menu
    console.log('📋 Creating menu...');
    const menuId = 'menu-xtreme-pizza-complete';
    const { error: menuError } = await supabase
      .from('restaurant_menus')
      .upsert({
        id: menuId,
        restaurant_id: restaurantId,
        tenant_id: tenantId,
        name: 'Xtreme Pizza Menu',
        description: 'Complete real menu scraped from Xtreme Pizza Ottawa - 33 items across 6 categories',
        is_active: true,
        display_order: 1,
        created_by: userId,
        updated_by: userId
      });
    
    if (menuError) {
      console.error('Menu error:', menuError);
      throw menuError;
    }
    console.log('✅ Menu created');

    // 3. Create Categories and Items
    let categoryOrder = 1;
    let itemOrder = 1;
    
    for (const category of xtremeMenuData.categories) {
      console.log(`📂 Creating category: ${category.name} with ${category.items.length} items`);
      
      const categoryId = `cat-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      // Create category
      const { error: categoryError } = await supabase
        .from('menu_categories')
        .upsert({
          id: categoryId,
          menu_id: menuId,
          tenant_id: tenantId,
          name: category.name,
          description: `Fresh ${category.name.toLowerCase()} selection`,
          display_order: categoryOrder,
          is_active: true,
          created_by: userId,
          updated_by: userId
        });
      
      if (categoryError) {
        console.error(`Category error for ${category.name}:`, categoryError);
        throw categoryError;
      }
      
      // Create items for this category
      for (const item of category.items) {
        const itemId = `item-${item.id}`;
        const basePrice = item.variants[0]?.price / 100 || 0;
        
        const { error: itemError } = await supabase
          .from('menu_items')
          .upsert({
            id: itemId,
            category_id: categoryId,
            tenant_id: tenantId,
            name: item.name,
            description: item.description || '',
            price: basePrice,
            cost: basePrice * 0.4, // 40% cost estimate
            variants: item.variants, // Store original variants as JSON
            allergens: category.name.toLowerCase().includes('pizza') ? ['gluten', 'dairy'] : [],
            tags: [
              ...(item.description?.toLowerCase().includes('spicy') || item.description?.toLowerCase().includes('hot') ? ['spicy'] : []),
              ...(category.name.toLowerCase().includes('pizza') ? ['pizza'] : []),
              ...(item.name.toLowerCase().includes('chicken') ? ['chicken'] : []),
              ...(item.name.toLowerCase().includes('vegetarian') || item.name.toLowerCase().includes('veggie') ? ['vegetarian'] : [])
            ],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: itemOrder,
            is_active: true,
            is_featured: itemOrder <= 3, // First 3 items are featured
            preparation_time: category.name.toLowerCase().includes('pizza') ? 20 : 
                             category.name.toLowerCase().includes('salad') ? 8 : 12,
            created_by: userId,
            updated_by: userId
          });
        
        if (itemError) {
          console.error(`Item error for ${item.name}:`, itemError);
          throw itemError;
        }
        
        itemOrder++;
      }
      
      console.log(`✅ Category ${category.name} created with ${category.items.length} items`);
      categoryOrder++;
    }

    console.log('🎉 ALL XTREME PIZZA DATA INSERTED SUCCESSFULLY!');
    
    return res.json({
      success: true,
      message: 'Xtreme Pizza menu data inserted successfully',
      data: {
        restaurantId,
        menuId,
        categoriesCount: xtremeMenuData.categories.length,
        itemsCount: xtremeMenuData.categories.reduce((total, cat) => total + cat.items.length, 0)
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to seed Xtreme Pizza data',
      details: error.message
    });
  }
}