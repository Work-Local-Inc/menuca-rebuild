const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployViaAPI() {
  console.log('🚀 Deploying via Supabase API...');
  
  try {
    // Test connection
    const { data, error: testError } = await supabase.from('information_schema.tables').select('*').limit(1);
    if (testError) {
      console.log('Testing with RPC instead...');
      
      // Create tables via SQL execution
      console.log('📝 Creating tenants table...');
      
      const createTenantsSQL = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TYPE IF NOT EXISTS tenant_status AS ENUM ('active', 'suspended', 'inactive');
        CREATE TYPE IF NOT EXISTS user_role AS ENUM ('customer', 'staff', 'manager', 'admin', 'super_admin');
        CREATE TYPE IF NOT EXISTS user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
        
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(255) UNIQUE NOT NULL,
          subdomain VARCHAR(100) UNIQUE NOT NULL,
          configuration JSONB DEFAULT '{}',
          commission_rate DECIMAL(5,4) DEFAULT 0.0500,
          status tenant_status DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { query: createTenantsSQL });
      if (createError) {
        console.error('SQL execution error:', createError);
        throw createError;
      }
      
      console.log('✅ Tables created successfully!');
    }
    
    // Test by inserting data
    console.log('🧪 Testing with data insertion...');
    const { data: insertData, error: insertError } = await supabase
      .from('tenants')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Default Tenant',
        domain: 'localhost',
        subdomain: 'default',
        status: 'active'
      })
      .select();
    
    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('Insert error:', insertError);
    } else {
      console.log('✅ Data insertion successful!');
    }
    
    console.log('🎉 Supabase deployment complete via API!');
    
  } catch (error) {
    console.error('❌ API deployment failed:', error);
  }
}

deployViaAPI();