'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RestaurantAdminNav from '@/components/RestaurantAdminNav'

export default function AuthInit() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    // Ensure Supabase processes any magic link and we know session state
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
      if (session?.user) {
        const metaRid = (session.user.user_metadata as any)?.last_restaurant_id || null
        if (metaRid) setRestaurantId(metaRid)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        // Try DB-backed preference first
        if (user) {
          const { data: pref } = await supabase
            .from('user_preferences')
            .select('last_restaurant_id')
            .eq('user_id', user.id)
            .maybeSingle()
          if (pref?.last_restaurant_id) {
            setRestaurantId(pref.last_restaurant_id as string)
            return
          }
          const metaRid = (user.user_metadata as any)?.last_restaurant_id || null
          if (metaRid) {
            setRestaurantId(metaRid)
            return
          }
        }
      } catch {}
      try {
        const rid = localStorage.getItem('lastRestaurantId') || document.cookie.match(/last_restaurant_id=([^;]+)/)?.[1] || null
        setRestaurantId(rid)
      } catch {
        setRestaurantId(null)
      }
    })()
  }, [])

  if (!authed || !restaurantId) return null
  return <RestaurantAdminNav restaurantId={restaurantId} />
}
