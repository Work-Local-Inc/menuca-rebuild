const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Deploying enterprise schema to live Supabase...');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

async function deploySchema() {
  try {
    console.log('✅ Connected to Supabase');
    console.log('🔨 Creating restaurants table...');
    
    // Create restaurants table first
    const { error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(0);
    
    if (restaurantsError && restaurantsError.message.includes('does not exist')) {
      console.log('📄 Need to create schema manually in Supabase SQL Editor');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/fsjodpnptdbwaigzkmfl/sql');
      console.log('📋 Copy and paste the contents of deploy-to-live-supabase.sql');
      console.log('▶️ Click RUN to execute the schema');
      return;
    }
    
    if (restaurantsError) {
      console.error('❌ Unexpected error:', restaurantsError.message);
      return;
    }
    
    console.log('✅ Tables already exist - checking data...');
    
    // Check if admin restaurant exists
    const { data: restaurants, error: checkError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', 'restaurant-user-adminmenucalocal-YWRtaW5A');
    
    if (checkError) {
      console.error('❌ Error checking restaurants:', checkError.message);
      return;
    }
    
    if (restaurants && restaurants.length > 0) {
      console.log('✅ Admin restaurant already exists:', restaurants[0].name);
    } else {
      console.log('📝 Creating admin restaurant...');
      
      const { data: newRestaurant, error: insertError } = await supabase
        .from('restaurants')
        .insert([{
          id: 'restaurant-user-adminmenucalocal-YWRtaW5A',
          tenant_id: 'default-tenant',
          name: 'Admin Test Restaurant',
          description: 'Test restaurant for admin user menu management',
          cuisine_type: 'Pizza',
          address: { street: '123 Test Street', city: 'Test City', state: 'TC', zip: '12345' },
          status: 'active'
        }])
        .select();
      
      if (insertError) {
        console.error('❌ Error creating restaurant:', insertError.message);
        return;
      }
      
      console.log('✅ Admin restaurant created successfully');
    }
    
    console.log('\n🎉 Schema validation completed!');
    console.log('🍕 Ready for Xtreme Pizza data import!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deploySchema();