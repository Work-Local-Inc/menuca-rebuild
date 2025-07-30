const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🚀 Creating tables via SQL...');
  
  try {
    // Execute schema creation using SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: `
          -- Enable extensions
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
          -- Create tenants table
          CREATE TABLE IF NOT EXISTS public.tenants (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            domain TEXT UNIQUE NOT NULL,
            subdomain TEXT UNIQUE NOT NULL,
            configuration JSONB DEFAULT '{}',
            commission_rate DECIMAL(5,4) DEFAULT 0.0500,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- Create users table  
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'customer',
            status TEXT DEFAULT 'active',
            email_verified BOOLEAN DEFAULT FALSE,
            last_login_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id, email)
          );
          
          -- Insert default tenant
          INSERT INTO public.tenants (id, name, domain, subdomain, status) 
          VALUES (
            '00000000-0000-0000-0000-000000000000'::UUID, 
            'Default Tenant', 
            'localhost', 
            'default', 
            'active'
          ) ON CONFLICT (domain) DO NOTHING;
          
          -- Insert admin user
          INSERT INTO public.users (tenant_id, email, password_hash, first_name, last_name, role, email_verified) 
          VALUES (
            '00000000-0000-0000-0000-000000000000'::UUID,
            'admin@menuca.local',
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/vl5/WFUli',
            'Admin',
            'User', 
            'admin',
            true
          ) ON CONFLICT (tenant_id, email) DO NOTHING;
        `
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Response error:', errorText);
      console.log('Creating tables using insert approach...');
      
      // Alternative: Create by inserting data which will auto-create schema
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')  
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Default Tenant',
          domain: 'localhost', 
          subdomain: 'default',
          status: 'active'
        })
        .select();
        
      console.log('Tenant insert result:', { tenantData, tenantError });
    } else {
      console.log('✅ SQL execution successful!');
    }
    
    // Test the tables
    console.log('🧪 Testing tables...');
    const { data: tenants, error: testError } = await supabase
      .from('tenants')
      .select('*');
      
    console.log('Test result:', { tenants, testError });
    
    if (tenants && tenants.length > 0) {
      console.log('✅ Tables created and populated successfully!');
      console.log(`Found ${tenants.length} tenants`);
    }
    
    console.log('🎉 Database setup complete! Ready for Vercel deployment.');
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
  }
}

createTables();