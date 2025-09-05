import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

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
      .from('menu_sections')
      .select('id, name, display_order')
      .eq('menu_id', restaurantMenu.id)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return res.status(500).json({ error: 'Error fetching categories', details: categoriesError.message, code: categoriesError.code });
    }

    console.log(`✅ Found ${categories?.length || 0} categories`);

    const categoryIds = categories?.map(cat => cat.id) || [];
    
    let allMenuItems: any[] = [];
    
    if (categoryIds.length > 0) {
      const { data: menuItems, error: itemsError } = await supabase
        .from('menu_section_items')
        .select(`
          id,
          menu_section_id,
          position,
          name_override,
          desc_override,
          price_override,
          items:items!inner(
            id,
            base_name,
            base_desc,
            base_price
          )
        `)
        .in('menu_section_id', categoryIds)
        .order('position', { ascending: true });

      if (itemsError) {
        console.error('❌ Error fetching menu items:', itemsError);
        return res.status(500).json({ error: 'Error fetching menu items', details: itemsError.message, code: itemsError.code });
      }

      allMenuItems = menuItems || [];
    }

    console.log(`✅ Found ${allMenuItems.length} menu items`);

    const baseItemsMap = new Map<string, any>()
    for (const row of allMenuItems as any[]) {
      if (row.items?.id) baseItemsMap.set(row.items.id, row)
    }

    // Fetch modifier groups for all referenced base item ids
    const baseItemIds = Array.from(baseItemsMap.keys())
    let itemModifiers: Record<string, any[]> = {}
    if (baseItemIds.length > 0) {
      const { data: img } = await supabase
        .from('item_modifier_groups')
        .select(`
          item_id,
          min_selection,
          max_selection,
          required,
          display_order,
          modifier_groups:modifier_groups!inner(
            id,
            name,
            min_selection,
            max_selection,
            required,
            display_order,
            modifier_options:modifier_options(* )
          )
        `)
        .in('item_id', baseItemIds)
        .order('display_order', { ascending: true })
      for (const row of (img || []) as any[]) {
        const arr = itemModifiers[row.item_id] || []
        arr.push({
          id: row.modifier_groups.id,
          name: row.modifier_groups.name,
          min: row.min_selection ?? row.modifier_groups.min_selection,
          max: row.max_selection ?? row.modifier_groups.max_selection,
          required: row.required ?? row.modifier_groups.required,
          display_order: row.display_order ?? row.modifier_groups.display_order,
          options: (row.modifier_groups.modifier_options || []).map((o: any) => ({
            id: o.id,
            name: o.name,
            price_delta: Number(o.price_delta || 0),
            quantity_allowed: !!o.quantity_allowed,
            max_per_option: o.max_per_option ?? 1,
            default_selected: !!o.default_selected,
            is_available: o.is_available !== false
          }))
        })
        itemModifiers[row.item_id] = arr
      }
    }

    const transformedMenuItems = allMenuItems.map((item: any) => ({
      id: item.id,
      name: item.name_override ?? item.items?.base_name ?? '',
      description: item.desc_override ?? item.items?.base_desc ?? '',
      price: parseFloat(item.price_override ?? item.items?.base_price ?? 0) || 0,
      category: (categories?.find(c => c.id === (item.menu_section_id))?.name) || 'Other',
      dietary_tags: [],
      prep_time: 15,
      rating: 4.5,
      is_popular: false,
      image_url: item.image_url || null,
      is_active: item.is_active ?? true,
      category_id: item.menu_section_id,
      modifiers: itemModifiers[item.items?.id] || []
    }));

    const categoryStats = (categories || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: '',
      display_order: cat.display_order,
      items_count: allMenuItems.filter((item: any) => item.menu_section_id === cat.id).length
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
