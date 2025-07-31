import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsjodpnptdbwaigzkmfl.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sbp_a77f0756fae7fc428f5ccdc68fa518d2ed4a7289'

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key exists:', !!supabaseAnonKey)
  console.log('Supabase Key length:', supabaseAnonKey?.length || 0)
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, Key=${!!supabaseAnonKey}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

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