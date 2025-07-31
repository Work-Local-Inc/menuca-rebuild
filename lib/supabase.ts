import { createClient } from '@supabase/supabase-js'

// Use the EXACT same approach that worked in login component
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sbp_a77f0756fae7fc428f5ccdc68fa518d2ed4a7289';

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