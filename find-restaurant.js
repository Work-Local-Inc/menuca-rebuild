const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nthpbtdjhhnwfxqsxbvy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aHBidGRqaGhud2Z4cXN4YnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzM0ODQsImV4cCI6MjA3MDg0OTQ4NH0.CfgwjVvf2DS37QguV20jf7--QZTXf6-DJR_IhFauedA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findRecentRestaurants() {
  try {
    console.log('🔍 Searching for recent restaurants...');
    
    // Get the most recent restaurants
    const { data: restaurants, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('❌ No restaurants found');
      return;
    }

    console.log(`✅ Found ${restaurants.length} recent restaurants:\n`);
    
    restaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. "${restaurant.name}"`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   Created: ${restaurant.created_at}`);
      console.log(`   Dashboard: https://menuca-rebuild.vercel.app/restaurant/${restaurant.id}/dashboard`);
      console.log(`   Menu: https://menuca-rebuild.vercel.app/menu/${restaurant.id}`);
      console.log('');
    });

    // Check for the "CSS FINALLY FIXED Restaurant" specifically
    const cssFixedRestaurant = restaurants.find(r => r.name.includes('CSS FINALLY FIXED'));
    if (cssFixedRestaurant) {
      console.log('🎯 FOUND YOUR RESTAURANT!');
      console.log(`   Name: ${cssFixedRestaurant.name}`);
      console.log(`   ID: ${cssFixedRestaurant.id}`);
      console.log(`   Dashboard URL: https://menuca-rebuild.vercel.app/restaurant/${cssFixedRestaurant.id}/dashboard`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findRecentRestaurants();
