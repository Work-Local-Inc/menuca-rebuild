import { createClient } from '@supabase/supabase-js'

// Use the EXACT same approach that worked in login component
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDM2MDQsImV4cCI6MjA2OTQ3OTYwNH0.JnlnLk8-L9ZMQLagxwM2JgxdW0lULYp7cNBtj5o8HGE';

console.log('lib/supabase - URL:', supabaseUrl);
console.log('lib/supabase - Key exists:', !!supabaseAnonKey);
console.log('lib/supabase - Key length:', supabaseAnonKey?.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)