const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

async function deploySchema() {
  console.log('🚀 Deploying enterprise schema to live Supabase...');
  
  // Create restaurants table
  const { data: restaurants, error: restaurantsError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant',
        owner_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cuisine_type VARCHAR(100),
        address JSONB NOT NULL DEFAULT '{}',
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        operating_hours JSONB DEFAULT '{}',
        delivery_radius_km DECIMAL(5,2) DEFAULT 5.0,
        min_order_amount DECIMAL(10,2) DEFAULT 0.00,
        commission_rate DECIMAL(5,4),
        status VARCHAR(50) DEFAULT 'active',
        featured BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0.00,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
  });
  
  if (restaurantsError) {
    console.error('❌ Error creating restaurants table:', restaurantsError);
  } else {
    console.log('✅ Restaurants table created');
  }

  // Create restaurant_menus table
  const { data: menus, error: menusError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS restaurant_menus (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        restaurant_id VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant',
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255)
      );`
  });
  
  if (menusError) {
    console.error('❌ Error creating restaurant_menus table:', menusError);
  } else {
    console.log('✅ Restaurant menus table created');
  }

  console.log('🎉 Schema deployment completed! Check your Supabase dashboard.');
}

deploySchema().catch(console.error);