// Fixed seeding script with correct schema
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

// Sample of the real Xtreme Pizza data
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
        },
        {
          id: "meat-lovers",
          name: "Meat Lovers",
          description: "Pepperoni, ham, sausage, bacon strips.",
          variants: [
            { size: "Small", price: 1799 },
            { size: "Medium", price: 2599 },
            { size: "Large", price: 3399 },
            { size: "X-Large", price: 4199 }
          ]
        }
      ]
    },
    {
      name: "Poutine",
      items: [
        {
          id: "poutine",
          name: "Poutine", 
          description: "With cheese curds and gravy.",
          variants: [
            { size: "Small", price: 899 },
            { size: "Large", price: 1199 }
          ]
        },
        {
          id: "italian-poutine",
          name: "Italian Poutine",
          description: "With mozzarella cheese and meat sauce.",
          variants: [
            { size: "Small", price: 999 },
            { size: "Large", price: 1299 }
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
    
    // 1. Create/Update Restaurant using correct schema
    console.log('📍 Creating restaurant...');
    const { error: restaurantError } = await supabase
      .from('restaurants')
      .upsert({
        id: restaurantId,
        tenant_id: tenantId,
        name: 'admin@menuca.local Restaurant (Xtreme Pizza)',
        description: 'Test restaurant loaded with real Xtreme Pizza Ottawa menu data',
        cuisine_type: 'Pizza',
        address: {
          street: '123 Test Street',
          city: 'Ottawa',
          state: 'ON',
          zip: 'K1A 0A6'
        },
        phone: '+1-613-555-0123',
        operating_hours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '22:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '12:00', close: '22:00' }
        },
        delivery_radius_km: 10,
        min_order_amount: 15.00,
        status: 'active'
      });
    
    if (restaurantError) {
      console.error('Restaurant error:', restaurantError);
      return;
    }
    console.log('✅ Restaurant created/updated');

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
        display_order: 1
      });
    
    if (menuError) {
      console.error('Menu error:', menuError);
      return;
    }
    console.log('✅ Menu created/updated');

    // 3. Create Categories and Items
    let categoryOrder = 1;
    
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
          is_active: true
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
            is_featured: i < 1, // First item is featured
            preparation_time: category.name.toLowerCase().includes('pizza') ? 20 : 10
          });
        
        if (itemError) {
          console.error(`Item error for ${item.name}:`, itemError);
        } else {
          console.log(`  ✅ Item: ${item.name} ($${basePrice.toFixed(2)})`);
        }
      }
      
      console.log(`✅ Category ${category.name} completed`);
      categoryOrder++;
    }

    console.log('🎉 ADMIN XTREME PIZZA DATA SEEDED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log(`   - Restaurant: admin@menuca.local Restaurant (Xtreme Pizza)`);
    console.log(`   - Menu: Xtreme Pizza Menu`);
    console.log(`   - Categories: ${xtremeMenuData.categories.length}`);
    console.log(`   - Items: ${xtremeMenuData.categories.reduce((total, cat) => total + cat.items.length, 0)}`);
    console.log('');
    console.log('🔗 Admin can now login and see populated menu data!');
    
  } catch (error) {
    console.error('Seed error:', error);
  }
}

seedAdminData();