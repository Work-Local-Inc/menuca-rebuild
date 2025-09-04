'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Restaurant = {
  id: string
  name: string
  logo_url?: string | null
  status?: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const email = (user.email || '').toLowerCase().trim()
      let ok = email === 'brian@worklocal.ca'

      if (!ok) {
        // Also allow users with admin role
        const { data: roles } = await supabase
          .from('user_restaurant_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .limit(1)
        ok = !!roles && roles.length > 0
      }

      if (!ok) {
        router.push('/login')
        return
      }
      setAuthorized(true)
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, logo_url, status')
        .order('created_at', { ascending: false })
      if (!error && data) setRestaurants(data as any)
      setLoading(false)
    })()
  }, [router])

  if (loading) return <div className="p-6">Loading…</div>
  if (!authorized) return null

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Restaurants</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restaurants.map(r => (
          <div key={r.id} className="border rounded-lg p-4 flex items-center gap-3">
            {r.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.logo_url} alt={r.name} className="h-10 max-w-[160px] object-contain" />
            ) : (
              <div className="h-10 min-w-[80px] bg-gray-100" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-gray-500">{r.status || 'active'}</div>
            </div>
            <button className="px-3 py-1 rounded bg-black text-white" onClick={() => router.push(`/restaurant/${r.id}/dashboard`)}>Dashboard</button>
            <button className="px-3 py-1 rounded bg-white ring-1 ring-black/10" onClick={() => router.push(`/menu/${r.id}`)}>View</button>
          </div>
        ))}
      </div>
    </div>
  )
}


