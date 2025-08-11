const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPrintQueue() {
  try {
    console.log('🔄 Setting up persistent print queue table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../sql/create-print-queue.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Print queue table created successfully!');
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('print_queue')
      .select('count(*)')
      .limit(1);
      
    if (testError) {
      console.log('⚠️  Table created but test query failed:', testError);
    } else {
      console.log('✅ Table is ready and accessible');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Alternative approach - direct table creation
async function createTableDirectly() {
  console.log('🔄 Creating print_queue table directly...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS public.print_queue (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        job_id TEXT UNIQUE NOT NULL,
        restaurant_id TEXT NOT NULL,
        order_number TEXT,
        payment_intent_id TEXT,
        order_data JSONB NOT NULL,
        receipt_data TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_print_queue_restaurant_id ON public.print_queue(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_print_queue_status ON public.print_queue(status);
      CREATE INDEX IF NOT EXISTS idx_print_queue_created_at ON public.print_queue(created_at);
    `
  });
  
  if (error) {
    console.error('❌ Direct creation failed:', error);
    
    // Try even simpler approach
    console.log('🔄 Trying simple table creation...');
    
    try {
      const { error: simpleError } = await supabase
        .from('print_queue')
        .insert([]);
        
      if (simpleError && simpleError.code === '42P01') {
        console.log('✅ Confirmed table does not exist, will create manually');
        
        // Manual table creation without RPC
        const createTableSQL = `
          CREATE TABLE print_queue (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            job_id TEXT UNIQUE NOT NULL,
            restaurant_id TEXT NOT NULL,
            order_data JSONB NOT NULL,
            receipt_data TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
        
        console.log('Please run this SQL manually in Supabase SQL editor:');
        console.log('================================================');
        console.log(createTableSQL);
        console.log('================================================');
        
      }
    } catch (e) {
      console.error('Table test failed:', e);
    }
    
  } else {
    console.log('✅ Table created successfully');
  }
}

// Try both approaches
setupPrintQueue().catch(() => {
  console.log('Trying direct approach...');
  createTableDirectly();
});