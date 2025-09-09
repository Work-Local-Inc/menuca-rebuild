import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nthpbtdjhhnwfxqsxbvy.supabase.co'
// Fallback ANON key for local builds only (same as lib/supabase.ts). Production must supply real keys via env.
const localAnonFallback = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aHBidGRqaGhud2Z4cXN4YnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzM0ODQsImV4cCI6MjA3MDg0OTQ4NH0.CfgwjVvf2DS37QguV20jf7--QZTXf6-DJR_IhFauedA'

let cached: any = null
function getClient() {
  if (cached) return cached
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '')
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localAnonFallback).replace(/\s/g, '')
  const key = serviceRole || anon
  cached = createClient(supabaseUrl, key)
  return cached
}

// Lazy proxy to avoid createClient call at import time during Next build analysis
export const supabaseAdmin: any = new Proxy({}, {
  get(_target, prop: string) {
    const client = getClient()
    return (client as any)[prop]
  },
})


