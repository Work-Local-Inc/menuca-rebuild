// Working seeding script with correct schema
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

// Expanded Xtreme Pizza data
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
        },
        {
          id: "vegetarian-pizza",
          name: "Vegetarian Pizza",
          description: "Mushrooms, green peppers, onions, olives, tomatoes.",
          variants: [
            { size: "Small", price: 1799 },
            { size: "Medium", price: 2599 },
            { size: "Large", price: 3399 },
            { size: "X-Large", price: 4199 }
          ]
        },
        {
          id: "xtreme-supreme-pizza",
          name: "Xtreme Supreme Pizza",
          description: "Pepperoni, mushrooms, green peppers, ham, sausage, olives, onions, bacon.",
          variants: [
            { size: "Small", price: 1999 },
            { size: "Medium", price: 2899 },
            { size: "Large", price: 3799 },
            { size: "X-Large", price: 4699 }
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
        },
        {
          id: "canadian-poutine",
          name: "Canadian Poutine", 
          description: "Cheese curds, chicken, bacon and gravy.",
          variants: [
            { size: "Small", price: 1099 },
            { size: "Large", price: 1399 }
          ]
        }
      ]
    },
    {
      name: "Salads",
      items: [
        {
          id: "garden-salad",
          name: "Garden Salad",
          description: "Lettuce, tomatoes, onions, green peppers and green olives.",
          variants: [
            { size: "Small", price: 999 },
            { size: "Large", price: 1299 }
          ]
        },
        {
          id: "greek-salad",
          name: "Greek Salad",
          description: "Lettuce, tomatoes, onions, green peppers, black olives and feta cheese.",
          variants: [
            { size: "Small", price: 1299 },
            { size: "Large", price: 1599 }
          ]
        },
        {
          id: "caesar-salad",
          name: "Caesar Salad", 
          description: "Lettuce, croutons and bacon bits.",
          variants: [
            { size: "Small", price: 1099 },
            { size: "Large", price: 1399 }
          ]
        }
      ]
    }
  ]
};

// Fixed UUIDs for admin restaurant
const ADMIN_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_MENU_ID = '22222222-2222-2222-2222-222222222222';

async function seedAdminData() {
  try {
    console.log('🍕 Starting Xtreme Pizza data seeding...');
    console.log('🎯 Target: Admin restaurant with complete menu data');
    console.log('');
    
    // 1. Restaurant is already created, just verify
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', ADMIN_RESTAURANT_ID)
      .single();
    
    if (existingRestaurant) {
      console.log('✅ Restaurant exists:', existingRestaurant.name);
    }

    // 2. Menu is already created, just verify  
    const { data: existingMenu } = await supabase
      .from('restaurant_menus')
      .select('*')
      .eq('id', ADMIN_MENU_ID)
      .single();
    
    if (existingMenu) {
      console.log('✅ Menu exists:', existingMenu.name);
    }

    // 3. Clear existing test data and create real categories/items
    console.log('🧹 Clearing existing test data...');
    
    // Delete test items and categories
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menu_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Test data cleared');
    console.log('');
    console.log('📂 Creating real Xtreme Pizza categories and items...');

    let totalItems = 0;
    
    for (let catIndex = 0; catIndex < xtremeMenuData.categories.length; catIndex++) {
      const category = xtremeMenuData.categories[catIndex];
      const categoryId = uuidv4();
      
      console.log(`📂 Category ${catIndex + 1}: ${category.name} (${category.items.length} items)`);
      
      // Create category
      const { data: createdCategory, error: categoryError } = await supabase
        .from('menu_categories')
        .insert({
          id: categoryId,
          menu_id: ADMIN_MENU_ID,
          name: category.name,
          description: `Fresh ${category.name.toLowerCase()} from Xtreme Pizza Ottawa`,
          display_order: catIndex + 1,
          is_active: true
        })
        .select();
      
      if (categoryError) {
        console.error(`❌ Category error for ${category.name}:`, categoryError);
        continue;
      }
      
      // Create items for this category
      for (let itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
        const item = category.items[itemIndex];
        const basePrice = item.variants[0]?.price / 100 || 0;
        
        const { data: createdItem, error: itemError } = await supabase
          .from('menu_items')
          .insert({
            category_id: categoryId,
            name: item.name,
            description: item.description || '',
            price: basePrice,
            cost: Math.round(basePrice * 0.35 * 100) / 100, // 35% cost
            options: item.variants, // Store variants as options
            allergens: category.name.toLowerCase().includes('pizza') ? ['gluten', 'dairy'] : 
                      category.name.toLowerCase().includes('salad') ? [] : ['dairy'],
            tags: [
              'xtreme-pizza',
              'real-menu',
              ...(item.description.toLowerCase().includes('spicy') ? ['spicy'] : []),
              ...(category.name.toLowerCase().includes('pizza') ? ['pizza'] : []),
              ...(item.name.toLowerCase().includes('vegetarian') ? ['vegetarian'] : [])
            ],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }]
            },
            display_order: itemIndex + 1,
            is_active: true,
            is_featured: itemIndex === 0, // First item in each category is featured
            preparation_time: category.name.toLowerCase().includes('pizza') ? 20 : 
                             category.name.toLowerCase().includes('poutine') ? 12 :
                             category.name.toLowerCase().includes('salad') ? 5 : 10
          })
          .select();
        
        if (itemError) {
          console.error(`❌ Item error for ${item.name}:`, itemError);
        } else {
          const variantText = item.variants.map(v => `${v.size}: $${(v.price/100).toFixed(2)}`).join(', ');
          console.log(`   ✅ ${item.name} - ${variantText}`);
          totalItems++;
        }
      }
      
      console.log(`✅ "${category.name}" completed with ${category.items.length} items`);
      console.log('');
    }

    console.log('🎉 XTREME PIZZA MENU SEEDING COMPLETED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 FINAL SUMMARY:`);
    console.log(`   🏪 Restaurant: Xtreme Pizza Ottawa (Admin Demo)`);
    console.log(`   📋 Menu: Xtreme Pizza Menu`);
    console.log(`   📂 Categories: ${xtremeMenuData.categories.length}`);
    console.log(`   🍕 Menu Items: ${totalItems}`);
    console.log(`   🆔 Restaurant ID: ${ADMIN_RESTAURANT_ID}`);
    console.log('');
    console.log('🚀 NEXT STEPS FOR ADMIN USER:');
    console.log('   1. Login as admin@menuca.local / password123');
    console.log('   2. Go to Restaurant Dashboard');
    console.log('   3. Menu Management tab should now show populated data!');
    console.log('   4. Ready for coworker testing 🎯');
    
  } catch (error) {
    console.error('💥 Seed error:', error);
  }
}

seedAdminData();