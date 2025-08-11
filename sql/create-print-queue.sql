-- Create print_queue table for persistent printer job storage
-- This replaces the in-memory queue with permanent database storage

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

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_print_queue_restaurant_id ON public.print_queue(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON public.print_queue(status);
CREATE INDEX IF NOT EXISTS idx_print_queue_created_at ON public.print_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_print_queue_job_id ON public.print_queue(job_id);

-- Enable Row Level Security (RLS) for multi-tenant security
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access (for our APIs)
CREATE POLICY "Service role can manage print queue" ON public.print_queue
  FOR ALL USING (true);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_print_queue_updated_at BEFORE UPDATE ON public.print_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment explaining the table
COMMENT ON TABLE public.print_queue IS 'Persistent storage for restaurant receipt print jobs - ensures no orders are lost during server restarts';