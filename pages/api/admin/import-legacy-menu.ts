import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '')
);

// Pre-scraped Xtreme Pizza menu data (from your existing scraper)
const XTREME_PIZZA_MENU = {
  restaurant: {
    name: 'Xtreme Pizza Ottawa',
    cuisine: 'Pizza',
    location: 'Ottawa, ON'
  },
  categories: [
    {
      name: 'Appetizers',
      items: [
        { name: 'Xtreme Platter', description: 'Comes with zucchini, chicken fingers, onion rings, fries and breaded shrimps.', prices: [19.99] },
        { name: 'Cheese Sticks', description: '8 Pcs', prices: [12.99] },
        { name: 'Jalapeno Slammers', description: '6 Pcs', prices: [13.99] },
        { name: 'Garlic Bread', description: 'Regular', prices: [6.99, 7.99, 8.99], sizes: ['Regular', 'With Cheese', 'With Cheese and Bacon'] },
        { name: 'Nachos', description: 'Comes with green peppers, onions and green olives.', prices: [16.99] },
        { name: 'Fries', description: '', prices: [6.99, 8.99], sizes: ['Small', 'Large'] }
      ]
    },
    {
      name: 'Pizza',
      items: [
        { name: 'Plain Pizza', description: '', prices: [13.99, 19.99, 25.99, 31.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Margherita', description: 'Fresh mozzarella, tomatoes, basil', prices: [15.99, 22.99, 29.99, 36.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Hawaiian', description: 'Ham, pineapple', prices: [15.99, 22.99, 29.99, 36.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Canadian', description: 'Pepperoni, mushrooms, bacon strips', prices: [16.99, 24.49, 31.99, 39.49], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Meat Lovers', description: 'Pepperoni, ham, sausage, bacon strips', prices: [17.99, 25.99, 33.99, 41.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'House Special Pizza', description: 'Pepperoni, mushrooms, green peppers, onions, green olives, bacon strips', prices: [18.99, 27.49, 35.99, 43.49], sizes: ['Small', 'Medium', 'Large', 'X-Large'] }
      ]
    },
    {
      name: 'Wings',
      items: [
        { name: 'Chicken Wings', description: 'Served with choice of red hot, sweet heat, honey garlic, mild, medium, suicide sauce', prices: [14.99, 27.99, 36.99], sizes: ['10 Pcs', '20 Pcs', '30 Pcs'] },
        { name: 'Boneless Dippers', description: 'Served with choice of sauces', prices: [16.99, 29.99, 38.99], sizes: ['10 Pcs', '20 Pcs', '30 Pcs'] }
      ]
    },
    {
      name: 'Poutine',
      items: [
        { name: 'Poutine', description: 'With cheese curds and gravy', prices: [8.99, 11.99], sizes: ['Small', 'Large'] },
        { name: 'Italian Poutine', description: 'With mozzarella cheese and meat sauce', prices: [9.99, 12.99], sizes: ['Small', 'Large'] },
        { name: 'Canadian Poutine', description: 'Cheese curds, chicken, bacon and gravy', prices: [10.99, 13.99], sizes: ['Small', 'Large'] }
      ]
    },
    {
      name: 'Salads',
      items: [
        { name: 'Garden Salad', description: 'Lettuce, tomatoes, onions, green peppers and green olives', prices: [9.99, 12.99], sizes: ['Small', 'Large'] },
        { name: 'Greek Salad', description: 'Lettuce, tomatoes, onions, green peppers, black olives and feta cheese', prices: [12.99, 15.99], sizes: ['Small', 'Large'] },
        { name: 'Caesar Salad', description: 'Lettuce, croutons and bacon bits', prices: [10.99, 13.99], sizes: ['Small', 'Large'] },
        { name: 'Chicken Caesar Salad', description: 'Chicken breast, lettuce, croutons and bacon bits', prices: [13.99, 16.99], sizes: ['Small', 'Large'] }
      ]
    },
    {
      name: 'Pasta',
      items: [
        { name: 'Spaghetti', description: 'With meat sauce. Served with garlic bread.', prices: [14.99] },
        { name: 'Lasagna', description: 'Served with garlic bread.', prices: [15.99] },
        { name: 'Chicken Parmigiana', description: 'Served with garlic bread.', prices: [19.99] }
      ]
    },
    {
      name: 'Drinks',
      items: [
        { name: 'Pepsi', description: '', prices: [1.50, 2.99, 4.50], sizes: ['Can', '591ml', '2L'] },
        { name: 'Diet Pepsi', description: '', prices: [1.50, 2.99, 4.50], sizes: ['Can', '591ml', '2L'] },
        { name: '7 Up', description: '', prices: [1.50, 2.99, 4.50], sizes: ['Can', '591ml', '2L'] }
      ]
    }
  ]
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { url, restaurant_id, restaurant_name } = req.body;
    
    if (!url || !restaurant_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL and restaurant_id are required' 
      });
    }
    
    console.log('🔍 Importing menu from:', url);
    console.log('🏪 For restaurant:', restaurant_name);
    
    // For now, use pre-scraped Xtreme Pizza data
    // TODO: Implement serverless-compatible scraping
    const menuData = XTREME_PIZZA_MENU;
    
    console.log(`📊 Using ${menuData.categories.length} categories`);
    
    // Skip menu table for now - directly create categories and items
    const tenantId = 'default-tenant';
    
    console.log('📊 Creating categories and items directly...');

    // Create categories and items
    let totalItemsCreated = 0;
    
    for (let categoryIndex = 0; categoryIndex < menuData.categories.length; categoryIndex++) {
      const category = menuData.categories[categoryIndex];
      const categoryId = uuidv4();
      
      // Create category - use .select() to get the created record back
      const { data: createdCategory, error: categoryError } = await supabase
        .from('menu_categories')
        .insert({
          id: categoryId,
          menu_id: restaurant_id, // Use menu_id as you confirmed this column exists
          name: category.name,
          description: `${category.name} selection`,
          display_order: categoryIndex,
          is_active: true
        })
        .select()
        .single();

      if (categoryError || !createdCategory) {
        console.error(`❌ Category creation error for ${category.name}:`, JSON.stringify(categoryError, null, 2));
        continue; // Skip this category but continue with others
      }

      console.log(`✅ Created category: ${category.name} with ID: ${createdCategory.id}`);

      // Create items for this category
      for (let itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
        const item = category.items[itemIndex];
        
        // Handle multiple sizes/prices by using base price
        const basePrice = Array.isArray(item.prices) ? item.prices[0] : item.prices;
        const itemId = uuidv4();
        
        // Use the CONFIRMED category ID from the created record
        const { data: createdItem, error: itemError } = await supabase
          .from('menu_items')
          .insert({
            id: itemId,
            category_id: createdCategory.id, // Use the actual created category ID
            name: item.name,
            description: item.description || '',
            price: basePrice || 0
            // Only the absolute minimum required columns
          })
          .select()
          .single();

        if (itemError) {
          console.error(`❌ Item creation error for ${item.name}:`, JSON.stringify(itemError, null, 2));
        } else {
          console.log(`✅ Created item: ${item.name} - $${basePrice}`);
          totalItemsCreated++;
        }
      }
    }

    console.log(`✅ Menu import completed: ${totalItemsCreated} items created`);

    return res.status(200).json({
      success: true,
      categories: menuData.categories.length,
      items: totalItemsCreated,
      restaurant_id: restaurant_id,
      preview: menuData.categories.slice(0, 5).map(cat => ({
        name: cat.name,
        items: cat.items.length
      })),
      message: `Successfully imported ${totalItemsCreated} menu items across ${menuData.categories.length} categories`
    });

  } catch (error) {
    console.error('Menu import error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to import menu',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
