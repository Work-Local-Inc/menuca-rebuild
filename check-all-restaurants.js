const { createClient } = require('@supabase/supabase-js');

// Use environment variables for production
const supabaseUrl = 'https://wlqhkxofgthtupxljyxf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndscWgreG9mZ3RodHVweGxqeXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMDExNTcsImV4cCI6MjAzOTU3NzE1N30.vWevtGMF90YfnCcZy4Jy6D4MYUk2DM3JJYlHUcjcHpk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllRestaurants() {
  try {
    console.log('🔍 Checking ALL restaurants in database...\n');
    
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database Error:', error);
      return;
    }
    
    if (!restaurants || restaurants.length === 0) {
      console.log('❌ No restaurants found in database');
      return;
    }
    
    console.log(`✅ Found ${restaurants.length} restaurants:\n`);
    
    restaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. "${restaurant.name}"`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   Email: ${restaurant.email || 'None'}`);
      console.log(`   Phone: ${restaurant.phone || 'None'}`);
      console.log(`   Created: ${restaurant.created_at}`);
      console.log(`   Menu: https://menuca-rebuild.vercel.app/menu/${restaurant.id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllRestaurants();
