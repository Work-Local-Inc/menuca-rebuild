import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!.replace(/\s/g, '') // Remove all whitespace
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;
  
  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ success: false, error: 'Restaurant ID required' });
  }

  if (req.method === 'POST') {
    try {
      const { name, description, categories = [], is_active = true, display_order = 1 } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Menu name is required' });
      }

      const menuId = uuidv4();

      // Create menu
      const { data: menu, error: menuError } = await supabase
        .from('restaurant_menus')
        .insert({
          id: menuId,
          restaurant_id: restaurantId,
          tenant_id: 'default-tenant', // Default tenant for now
          name,
          description: description || '',
          is_active,
          display_order,
          created_by: 'demo-user'
        })
        .select()
        .single();

      if (menuError) {
        console.error('Supabase menu creation error:', menuError);
        return res.status(500).json({ success: false, error: 'Failed to create menu' });
      }

      // If categories provided, create them
      if (categories.length > 0) {
        const categoryInserts = categories.map((category: any, index: number) => ({
          id: uuidv4(),
          menu_id: menuId,
          name: category.name,
          description: category.description || '',
          display_order: category.display_order || index + 1,
          is_active: category.is_active !== false
        }));

        const { data: insertedCategories, error: categoriesError } = await supabase
          .from('menu_categories')
          .insert(categoryInserts)
          .select();

        if (categoriesError) {
          console.error('Supabase categories creation error:', categoriesError);
          // Continue without categories for now
        }

        // If categories have items, create them
        if (insertedCategories) {
          for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            const insertedCategory = insertedCategories[i];
            
            if (category.items && category.items.length > 0) {
              const itemInserts = category.items.map((item: any, itemIndex: number) => ({
                id: uuidv4(),
                category_id: insertedCategory.id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                cost: item.cost || 0,
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
                display_order: item.display_order || itemIndex + 1,
                is_active: item.is_active !== false,
                is_featured: item.is_featured || false,
                preparation_time: item.preparation_time || 15
              }));

              const { error: itemsError } = await supabase
                .from('menu_items')
                .insert(itemInserts);

              if (itemsError) {
                console.error('Supabase items creation error:', itemsError);
              }
            }
          }
        }
      }

      return res.status(201).json({
        success: true,
        data: {
          id: menu.id,
          restaurantId: menu.restaurant_id,
          tenantId: menu.tenant_id,
          name: menu.name,
          description: menu.description,
          categories: [],
          is_active: menu.is_active,
          display_order: menu.display_order,
          created_at: menu.created_at,
          updated_at: menu.updated_at,
          created_by: menu.created_by
        }
      });
    } catch (error) {
      console.error('Error creating menu:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}