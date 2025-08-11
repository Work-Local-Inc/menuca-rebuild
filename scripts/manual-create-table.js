// Manual table creation script - run this to create the print_queue table

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMzYwNCwiZXhwIjoyMDY5NDc5NjA0fQ.wdIdJ0oD7_ULyv23Mz2RL7hhI2ufe8DcFNTqLpJkQEw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('🔧 Attempting to create print_queue table...');
  
  // Try to insert a test record to see what happens
  const testJob = {
    job_id: 'test_creation_' + Date.now(),
    restaurant_id: 'test',
    order_data: { test: true },
    receipt_data: 'Test receipt',
    status: 'pending'
  };
  
  const { data, error } = await supabase
    .from('print_queue')
    .insert([testJob])
    .select();
    
  if (error) {
    console.log('❌ Insert failed with error:', error);
    
    if (error.code === '42P01') {
      console.log('✅ Confirmed: Table does not exist');
      console.log('\n📋 Please create the table manually in Supabase SQL editor:');
      console.log('\n--- COPY THIS SQL TO SUPABASE ---');
      console.log(`
CREATE TABLE IF NOT EXISTS public.print_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  restaurant_id TEXT NOT NULL,
  order_number TEXT,
  payment_intent_id TEXT,
  order_data JSONB NOT NULL,
  receipt_data TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_print_queue_restaurant_id ON public.print_queue(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON public.print_queue(status);
CREATE INDEX IF NOT EXISTS idx_print_queue_created_at ON public.print_queue(created_at);

-- Enable Row Level Security
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage print queue" ON public.print_queue
  FOR ALL USING (true);
      `);
      console.log('\n--- END SQL ---\n');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/fsjodpnptdbwaigzkmfl/sql');
      console.log('📋 Paste the SQL above and click "Run"');
      
    } else {
      console.log('❓ Different error:', error);
    }
  } else {
    console.log('✅ Table exists! Test record inserted:', data);
    
    // Clean up test record
    await supabase
      .from('print_queue')
      .delete()
      .eq('job_id', testJob.job_id);
      
    console.log('🧹 Test record cleaned up');
  }
}

createTable().catch(console.error);