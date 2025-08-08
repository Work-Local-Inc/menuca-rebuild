// Quick script to seed admin data directly
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

const xtremeMenuData = {
  categories: [
    {
      name: "Appetizers",
      items: [
        {
          id: "fries",
          name: "Fries",
          description: "",
          variants: [
            { size: "Small", price: 699 },
            { size: "Large", price: 899 }
          ]
        },
        {
          id: "onion-rings", 
          name: "Onion Rings",
          description: "",
          variants: [
            { size: "Small", price: 799 },
            { size: "Large", price: 999 }
          ]
        }
      ]
    },
    {
      name: "Pizza",
      items: [
        {
          id: "plain-pizza",
          name: "Plain Pizza",
          description: "",
          variants: [
            { size: "Small", price: 1399 },
            { size: "Medium", price: 1999 },
            { size: "Large", price: 2599 },
            { size: "X-Large", price: 3199 }
          ]
        },
        {
          id: "hawaiian",
          name: "Hawaiian",
          description: "Ham, pineapple.",
          variants: [
            { size: "Small", price: 1599 },
            { size: "Medium", price: 2299 },
            { size: "Large", price: 2999 },
            { size: "X-Large", price: 3699 }
          ]
        }
      ]
    }
  ]
};

async function seedAdminData() {
  try {
    console.log('🍕 Starting admin data seeding...');
    
    const restaurantId = 'user-restaurant-user-adminmenucalocal-YWRtaW5A';
    const tenantId = 'default-tenant';
    const userId = 'user-adminmenucalocal-YWRtaW5A';
    
    // 1. Create Restaurant
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
      return;
    }
    console.log('✅ Restaurant created');

    // 2. Create Menu
    console.log('📋 Creating menu...');
    const menuId = 'menu-xtreme-pizza-complete';
    const { error: menuError } = await supabase
      .from('restaurant_menus')
      .upsert({
        id: menuId,
        restaurant_id: restaurantId,
        tenant_id: tenantId,
        name: 'Xtreme Pizza Menu',
        description: 'Complete real menu scraped from Xtreme Pizza Ottawa',
        is_active: true,
        display_order: 1,
        created_by: userId,
        updated_by: userId
      });
    
    if (menuError) {
      console.error('Menu error:', menuError);
      return;
    }
    console.log('✅ Menu created');

    // 3. Create Categories and Items
    let categoryOrder = 1;
    
    for (const category of xtremeMenuData.categories) {
      console.log(`📂 Creating category: ${category.name}`);
      
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
        console.error(`Category error:`, categoryError);
        continue;
      }
      
      // Create items
      for (let i = 0; i < category.items.length; i++) {
        const item = category.items[i];
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
            cost: basePrice * 0.4,
            variants: item.variants,
            allergens: category.name.toLowerCase().includes('pizza') ? ['gluten', 'dairy'] : [],
            tags: ['popular'],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }]
            },
            display_order: i + 1,
            is_active: true,
            is_featured: i < 2,
            preparation_time: category.name.toLowerCase().includes('pizza') ? 20 : 10,
            created_by: userId,
            updated_by: userId
          });
        
        if (itemError) {
          console.error(`Item error:`, itemError);
        }
      }
      
      console.log(`✅ Category ${category.name} with ${category.items.length} items created`);
      categoryOrder++;
    }

    console.log('🎉 ADMIN DATA SEEDED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('Seed error:', error);
  }
}

seedAdminData();