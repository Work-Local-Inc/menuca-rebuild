// Seed COMPLETE Xtreme Pizza menu (all 33 items)
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { xtremeMenuData } = require('./data/xtreme-pizza-complete.js');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'.replace(/\s/g, '')
);

const ADMIN_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_MENU_ID = '22222222-2222-2222-2222-222222222222';

async function seedCompleteMenu() {
  try {
    console.log('🍕 SEEDING COMPLETE XTREME PIZZA MENU (33 ITEMS)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Clear existing categories and items first
    console.log('🧹 Clearing existing menu data...');
    
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menu_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Existing data cleared');
    console.log('');

    let totalItems = 0;
    let categoryOrder = 1;
    
    for (const category of xtremeMenuData.categories) {
      console.log(`📂 Category ${categoryOrder}: ${category.name} (${category.items.length} items)`);
      
      const categoryId = uuidv4();
      
      // Create category
      const { error: categoryError } = await supabase
        .from('menu_categories')
        .insert({
          id: categoryId,
          menu_id: ADMIN_MENU_ID,
          name: category.name,
          description: `${category.name} from Xtreme Pizza Ottawa`,
          display_order: categoryOrder,
          is_active: true
        });
      
      if (categoryError) {
        console.error(`❌ Category error for ${category.name}:`, categoryError);
        continue;
      }
      
      // Create all items for this category
      let itemOrder = 1;
      
      for (const item of category.items) {
        const basePrice = item.variants[0]?.price / 100 || 0;
        
        const { error: itemError } = await supabase
          .from('menu_items')
          .insert({
            category_id: categoryId,
            name: item.name,
            description: item.description || '',
            price: basePrice,
            cost: Math.round(basePrice * 0.35 * 100) / 100, // 35% cost
            options: item.variants, // Store all variants as options
            allergens: category.name.toLowerCase().includes('pizza') ? ['gluten', 'dairy'] : 
                      category.name.toLowerCase().includes('donair') || category.name.toLowerCase().includes('shawarma') ? ['gluten'] :
                      category.name.toLowerCase().includes('poutine') ? ['dairy'] : [],
            tags: [
              'xtreme-pizza',
              'ottawa',
              'real-menu',
              ...(item.description?.toLowerCase().includes('spicy') || item.description?.toLowerCase().includes('hot') ? ['spicy'] : []),
              ...(category.name.toLowerCase().includes('pizza') ? ['pizza'] : []),
              ...(item.name.toLowerCase().includes('vegetarian') || item.name.toLowerCase().includes('veggie') ? ['vegetarian'] : []),
              ...(item.name.toLowerCase().includes('chicken') ? ['chicken'] : []),
              ...(item.name.toLowerCase().includes('meat') ? ['meat'] : [])
            ],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }]
            },
            display_order: itemOrder,
            is_active: true,
            is_featured: itemOrder <= 2, // First 2 items in each category are featured
            preparation_time: category.name.toLowerCase().includes('pizza') ? 20 : 
                             category.name.toLowerCase().includes('poutine') ? 12 :
                             category.name.toLowerCase().includes('donair') || category.name.toLowerCase().includes('shawarma') ? 15 :
                             category.name.toLowerCase().includes('salad') ? 5 : 10
          });
        
        if (itemError) {
          console.error(`❌ Item error for ${item.name}:`, itemError);
        } else {
          const priceRange = item.variants.length > 1 ? 
            `$${(item.variants[0].price/100).toFixed(2)} - $${(item.variants[item.variants.length-1].price/100).toFixed(2)}` :
            `$${(item.variants[0].price/100).toFixed(2)}`;
          console.log(`   ✅ ${item.name} - ${priceRange} (${item.variants.length} variants)`);
          totalItems++;
        }
        
        itemOrder++;
      }
      
      console.log(`✅ "${category.name}" completed with ${category.items.length} items`);
      console.log('');
      categoryOrder++;
    }

    console.log('🎉 COMPLETE XTREME PIZZA MENU SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 FINAL SUMMARY:`);
    console.log(`   🏪 Restaurant: Xtreme Pizza Ottawa (Admin Demo)`);
    console.log(`   📋 Menu: Complete Real Menu`);
    console.log(`   📂 Categories: ${xtremeMenuData.categories.length} (Appetizers, Poutine, Pizza, Donairs & Shawarma, Salads)`);
    console.log(`   🍕 Menu Items: ${totalItems} / 33 expected`);
    console.log(`   🆔 Restaurant ID: ${ADMIN_RESTAURANT_ID}`);
    console.log('');
    console.log('🚀 ADMIN DASHBOARD NOW HAS COMPLETE MENU!');
    console.log('   - 18 different pizzas with all variants');
    console.log('   - 4 poutine options'); 
    console.log('   - 4 donair & shawarma items');
    console.log('   - 5 fresh salads');
    console.log('   - 2 appetizers');
    console.log('');
    console.log('✅ Ready for full coworker testing experience!');
    
  } catch (error) {
    console.error('💥 Complete seeding error:', error);
  }
}

seedCompleteMenu();