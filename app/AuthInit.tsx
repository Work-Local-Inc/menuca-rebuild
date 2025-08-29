'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthInit() {
  useEffect(() => {
    // Touch auth on mount so Supabase processes any magic link hash in the URL
    void supabase.auth.getSession()
  }, [])
  return null
}
