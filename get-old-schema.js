const { createClient } = require('@supabase/supabase-js');

// OLD working Supabase instance
const oldSupabase = createClient(
  'https://wlqhkxofgthtupxljyxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndscWgreG9mZ3RodHVweGxqeXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMDExNTcsImV4cCI6MjAzOTU3NzE1N30.vWevtGMF90YfnCcZy4Jy6D4MYUk2DM3JJYlHUcjcHpk'
);

async function getCompleteSchema() {
  try {
    console.log('🔍 Getting COMPLETE schema from OLD working database...\n');
    
    // Get all tables
    console.log('📋 STEP 1: Getting all tables...');
    const { data: restaurants, error: restaurantError } = await oldSupabase
      .from('restaurants')
      .select('*')
      .limit(1);
    
    if (restaurantError) {
      console.log('❌ restaurants table:', restaurantError.message);
    } else {
      console.log('✅ restaurants table exists');
    }

    const { data: menus, error: menuError } = await oldSupabase
      .from('restaurant_menus')
      .select('*')
      .limit(1);
    
    if (menuError) {
      console.log('❌ restaurant_menus table:', menuError.message);
    } else {
      console.log('✅ restaurant_menus table exists');
    }

    const { data: categories, error: categoryError } = await oldSupabase
      .from('menu_categories')
      .select('*')
      .limit(1);
    
    if (categoryError) {
      console.log('❌ menu_categories table:', categoryError.message);
    } else {
      console.log('✅ menu_categories table exists');
    }

    const { data: items, error: itemError } = await oldSupabase
      .from('menu_items')
      .select('*')
      .limit(1);
    
    if (itemError) {
      console.log('❌ menu_items table:', itemError.message);
    } else {
      console.log('✅ menu_items table exists');
    }

    // Check businesses table (might be the main one)
    const { data: businesses, error: businessError } = await oldSupabase
      .from('businesses')
      .select('*')
      .limit(1);
    
    if (businessError) {
      console.log('❌ businesses table:', businessError.message);
    } else {
      console.log('✅ businesses table exists');
    }

    console.log('\n📊 STEP 2: Getting sample data structures...');
    
    // Get restaurant structure if it exists
    if (!restaurantError && restaurants && restaurants.length > 0) {
      console.log('\n🏪 restaurants table structure:');
      console.log('Columns:', Object.keys(restaurants[0]));
    }

    // Get businesses structure if it exists  
    if (!businessError && businesses && businesses.length > 0) {
      console.log('\n🏢 businesses table structure:');
      console.log('Columns:', Object.keys(businesses[0]));
    }

    // Get menu structure if it exists
    if (!menuError && menus && menus.length > 0) {
      console.log('\n📋 restaurant_menus table structure:');
      console.log('Columns:', Object.keys(menus[0]));
    }

    // Get categories structure if it exists
    if (!categoryError && categories && categories.length > 0) {
      console.log('\n📂 menu_categories table structure:');
      console.log('Columns:', Object.keys(categories[0]));
    }

    // Get items structure if it exists
    if (!itemError && items && items.length > 0) {
      console.log('\n📄 menu_items table structure:');
      console.log('Columns:', Object.keys(items[0]));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getCompleteSchema();
