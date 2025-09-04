'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthContinue() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const ridParam = params ? params.get('rid') : null
    const rid = ridParam || (typeof window !== 'undefined' ? (localStorage.getItem('lastRestaurantId') || document.cookie.match(/last_restaurant_id=([^;]+)/)?.[1] || '') : '')
    if (rid) {
      // Persist last restaurant and redirect
      try {
        localStorage.setItem('lastRestaurantId', rid)
        document.cookie = `last_restaurant_id=${rid}; path=/; max-age=2592000`
      } catch {}
      // Best-effort: upsert user preference
      ;(async () => {
        try {
          const { data } = await supabase.auth.getUser()
          const user = data.user
          if (user) {
            await supabase.from('user_preferences').upsert({ user_id: user.id, last_restaurant_id: rid, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          }
        } catch {}
      })()
      router.replace(`/restaurant/${rid}/dashboard`)
    }
    else router.replace('/restaurant/onboard')
  }, [])

  return null
}


