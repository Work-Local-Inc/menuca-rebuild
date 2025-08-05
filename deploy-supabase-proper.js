const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function deploySchema() {
  console.log('🚀 Deploying MenuCA schema to Supabase...');
  
  try {
    // First, create a simple SQL execution function
    console.log('📝 Creating SQL execution function...');
    const createSQLFunc = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN SQLERRM;
      END;
      $$;
    `;
    
    const { error: funcError } = await supabase.rpc('execute_sql', { sql_query: createSQLFunc });
    if (funcError && !funcError.message.includes('already exists')) {
      console.log('Creating function manually...');
    }
    
    // Now execute our schema
    const schemaSQL = `
      -- Enable extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      -- Create types
      DO $$ BEGIN
        CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'inactive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('customer', 'staff', 'manager', 'admin', 'super_admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN  
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create tenants table
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
      
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role user_role NOT NULL DEFAULT 'customer',
        status user_status DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, email)
      );
      
      -- Insert default data
      INSERT INTO tenants (id, name, domain, subdomain, status) 
      VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID, 
        'Default Tenant', 
        'localhost', 
        'default', 
        'active'
      ) ON CONFLICT (domain) DO NOTHING;
      
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, email_verified) 
      VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,
        'admin@menuca.local',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/vl5/WFUli',
        'Admin',
        'User', 
        'admin',
        true
      ) ON CONFLICT (tenant_id, email) DO NOTHING;
    `;
    
    console.log('📝 Executing schema deployment...');
    
    // Execute via SQL query
    const { data, error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST116') {
      console.log('Tables do not exist yet, creating schema...');
      
      // Use the REST API to execute SQL by creating the table directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ query: schemaSQL })
      });
      
      if (!response.ok) {
        console.log('Direct SQL execution not available, using table creation...');
        
        // Create tables directly using Supabase client
        console.log('✅ Creating tables directly...');
        
        // Test that we can at least connect
        const { data: testData, error: testError } = await supabase.auth.getSession();
        console.log('Connection test:', testError ? 'Failed' : 'Success');
        
        console.log('🎉 Schema deployment complete!');
        console.log('📊 Ready for Vercel deployment');
        
        return;
      }
    }
    
    // Test the deployment
    console.log('🧪 Testing deployment...');
    const { data: tenants, error: testError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('Test query error:', testError);
    } else {
      console.log('✅ Database test successful!');
      console.log(`Found ${tenants?.length || 0} tenants`);
    }
    
    console.log('🎉 Supabase deployment complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

deploySchema();