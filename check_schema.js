// Check the actual database schema
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

async function checkSchema() {
  try {
    console.log('🔍 Checking restaurants table...');
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Restaurants table error:', error);
    } else {
      console.log('Restaurants table exists, sample data:', data);
    }

    console.log('🔍 Checking restaurant_menus table...');
    const { data: menuData, error: menuError } = await supabase
      .from('restaurant_menus')
      .select('*')
      .limit(1);
    
    if (menuError) {
      console.error('Restaurant menus table error:', menuError);
    } else {
      console.log('Restaurant menus table exists, sample data:', menuData);
    }

    console.log('🔍 Checking menu_categories table...');
    const { data: categoryData, error: categoryError } = await supabase
      .from('menu_categories')
      .select('*')
      .limit(1);
    
    if (categoryError) {
      console.error('Menu categories table error:', categoryError);
    } else {
      console.log('Menu categories table exists, sample data:', categoryData);
    }

    console.log('🔍 Checking menu_items table...');
    const { data: itemData, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(1);
    
    if (itemError) {
      console.error('Menu items table error:', itemError);
    } else {
      console.log('Menu items table exists, sample data:', itemData);
    }
    
  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkSchema();