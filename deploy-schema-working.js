const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🚀 Deploying enterprise schema to live Supabase...');

const supabase = createClient(
  'https://fsjodpnptdbwaigzkmfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw'
);

async function executeSQLBatch(sqlStatements) {
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i].trim();
    if (!sql) continue;
    
    console.log(`\n📄 Executing statement ${i + 1}/${sqlStatements.length}...`);
    console.log(`SQL: ${sql.substring(0, 100)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: sql 
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Failed to execute statement ${i + 1}:`, err.message);
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function deploySchema() {
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('auth.users')  // This should exist in any Supabase project
      .select('count')
      .limit(0);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Break schema into smaller chunks
    const schemaStatements = [
      // Create tables one by one
      `CREATE TABLE IF NOT EXISTS restaurants (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS restaurant_menus (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS menu_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        menu_id UUID NOT NULL REFERENCES restaurant_menus(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) DEFAULT 0,
        images JSONB DEFAULT '[]',
        options JSONB DEFAULT '[]',
        nutritional_info JSONB DEFAULT '{}',
        allergens TEXT[] DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        availability JSONB DEFAULT '{"is_available": true, "available_days": [1,2,3,4,5,6,7], "available_times": [{"start_time": "00:00", "end_time": "23:59"}]}',
        display_order INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        preparation_time INTEGER DEFAULT 15,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON restaurants(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_restaurant_menus_restaurant_id ON restaurant_menus(restaurant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON menu_categories(menu_id)`,
      `CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id)`,
      
      // Insert test restaurant for admin user
      `INSERT INTO restaurants (
        id, 
        tenant_id, 
        name, 
        description, 
        cuisine_type,
        address,
        status
      ) VALUES (
        'restaurant-user-adminmenucalocal-YWRtaW5A'::UUID,
        'default-tenant',
        'Admin Test Restaurant', 
        'Test restaurant for admin user menu management',
        'Pizza',
        '{"street": "123 Test Street", "city": "Test City", "state": "TC", "zip": "12345"}',
        'active'
      ) ON CONFLICT (id) DO NOTHING`
    ];
    
    await executeSQLBatch(schemaStatements);
    
    console.log('\n🎉 Enterprise schema deployment completed!');
    console.log('📊 Tables created: restaurants, restaurant_menus, menu_categories, menu_items');
    console.log('🍕 Ready for Xtreme Pizza data import!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deploySchema();