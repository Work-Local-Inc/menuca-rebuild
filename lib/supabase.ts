import { createClient } from '@supabase/supabase-js'

// TEMPORARY: Hardcode values to test if env vars are the issue
const supabaseUrl = 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDM2MDQsImV4cCI6MjA2OTQ3OTYwNH0.lcy6gDS58IhiWOTPhNOH6EiUTFmSDvIbX-uiZmCDqjQ';

console.log('lib/supabase - URL:', supabaseUrl);
console.log('lib/supabase - Key exists:', !!supabaseAnonKey);
console.log('lib/supabase - Key length:', supabaseAnonKey?.length);
console.log('lib/supabase - URL type:', typeof supabaseUrl);
console.log('lib/supabase - Key type:', typeof supabaseAnonKey);
console.log('lib/supabase - Calling createClient with:', { url: supabaseUrl, key: supabaseAnonKey?.substring(0, 20) + '...' });

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