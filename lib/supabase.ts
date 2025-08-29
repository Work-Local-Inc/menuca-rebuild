import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nthpbtdjhhnwfxqsxbvy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aHBidGRqaGhud2Z4cXN4YnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzM0ODQsImV4cCI6MjA3MDg0OTQ4NH0.CfgwjVvf2DS37QguV20jf7--QZTXf6-DJR_IhFauedA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key').replace(/\s/g, '')
)
