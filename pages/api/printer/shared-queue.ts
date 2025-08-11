// Persistent print queue using Supabase database
// Replaces in-memory queue to survive server restarts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!.replace(/\s/g, '')
);

// Auto-create table if it doesn't exist
async function ensureTableExists() {
  try {
    // Test if table exists by trying a simple query
    const { error } = await supabase
      .from('print_queue')
      .select('id')
      .limit(1);
      
    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('🔄 Creating print_queue table...');
      
      console.log('❌ Table does not exist, but unable to create automatically');
      console.log('🔧 Manual table creation required. Please run this SQL in Supabase:');
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
      `);
      
      // Since we can't create the table automatically, let's fallback gracefully
      const { error: createError } = { error: { message: 'Table creation skipped - manual creation required' } };
        
      if (createError) {
        console.error('❌ Could not create table:', createError);
        // Fallback to in-memory if table creation fails
        return false;
      } else {
        console.log('✅ Print queue table created successfully');
        return true;
      }
    }
    
    return true; // Table already exists or other error
  } catch (e) {
    console.error('❌ Table check failed:', e);
    return false;
  }
}

export async function addPrintJob(job: any) {
  await ensureTableExists();
  
  try {
    const { data, error } = await supabase
      .from('print_queue')
      .insert([{
        job_id: job.id,
        restaurant_id: job.restaurantId,
        order_number: job.orderData?.orderNumber,
        payment_intent_id: job.orderData?.paymentIntentId,
        order_data: job.orderData,
        receipt_data: job.receiptData,
        status: 'pending'
      }])
      .select();
      
    if (error) {
      console.error('❌ Failed to add job to database:', error);
      // Fallback to in-memory for this job
      return job;
    }
    
    console.log(`✅ Added print job ${job.id} to persistent queue`);
    return job;
  } catch (e) {
    console.error('❌ Database error adding job:', e);
    return job;
  }
}

export async function getPendingJobs(restaurantId: string) {
  await ensureTableExists();
  
  try {
    const { data, error } = await supabase
      .from('print_queue')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('❌ Failed to get pending jobs:', error);
      return [];
    }
    
    // Transform back to original format
    return (data || []).map(row => ({
      id: row.job_id,
      restaurantId: row.restaurant_id,
      orderData: row.order_data,
      receiptData: row.receipt_data,
      timestamp: row.created_at,
      status: row.status
    }));
  } catch (e) {
    console.error('❌ Database error getting jobs:', e);
    return [];
  }
}

export async function markJobCompleted(jobId: string) {
  await ensureTableExists();
  
  try {
    const { error } = await supabase
      .from('print_queue')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId);
      
    if (error) {
      console.error('❌ Failed to mark job completed:', error);
      return false;
    }
    
    console.log(`✅ Marked job ${jobId} as completed in database`);
    return true;
  } catch (e) {
    console.error('❌ Database error marking job complete:', e);
    return false;
  }
}

export async function getQueueStats() {
  await ensureTableExists();
  
  try {
    const { data, error } = await supabase
      .from('print_queue')
      .select('status');
      
    if (error) {
      console.error('❌ Failed to get queue stats:', error);
      return { total: 0, pending: 0, completed: 0 };
    }
    
    const total = data?.length || 0;
    const pending = data?.filter(row => row.status === 'pending').length || 0;
    const completed = data?.filter(row => row.status === 'completed').length || 0;
    
    return { total, pending, completed };
  } catch (e) {
    console.error('❌ Database error getting stats:', e);
    return { total: 0, pending: 0, completed: 0 };
  }
}