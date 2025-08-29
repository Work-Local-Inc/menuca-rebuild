'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChefHat, Star, ShoppingCart, Edit, Eye, Settings } from 'lucide-react'

type Restaurant = {
  id: string
  name: string
  description?: string | null
  cuisine_type: string
  status: string
  rating: number
  logo_url?: string | null
  banner_url?: string | null
}

export default function DashboardPreview() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params?.id as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [navFixed, setNavFixed] = useState(false)
  const navRef = useRef<HTMLDivElement | null>(null)
  const spacerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/restaurants/${restaurantId}`)
        if (r.ok) {
          const j = await r.json()
          setRestaurant(j.restaurant)
        }
      } catch {}
    }
    if (restaurantId) void load()
  }, [restaurantId])

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel')
    if (!sentinel) return
    const obs = new IntersectionObserver(([entry]) => {
      setNavFixed(!entry.isIntersecting)
      if (navRef.current && spacerRef.current) {
        const h = navRef.current.getBoundingClientRect().height
        spacerRef.current.style.height = entry.isIntersecting ? '0px' : `${h}px`
      }
    })
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [])

  if (!restaurant) return <div className="p-6">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="relative">
            <div className="w-full h-40 md:h-56 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
              {restaurant.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={restaurant.banner_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ChefHat className="h-16 w-16 text-white/80" /></div>
              )}
            </div>
            <div className="absolute -bottom-6 left-4 z-10 rounded-lg bg-white/95 shadow-md ring-1 ring-black/5 px-3 py-2">
              {restaurant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={restaurant.logo_url} alt="Logo" className="object-contain max-h-14 md:max-h-20 max-w-[240px]" />
              ) : (
                <div className="flex items-center justify-center h-14 md:h-20 min-w-[80px]"><ChefHat className="h-8 w-8 text-gray-400" /></div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
            {restaurant.description && (<p className="text-gray-600 mb-4">{restaurant.description}</p>)}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Badge className={restaurant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {restaurant.status === 'active' ? '🟢 Live' : '🔴 Offline'}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{restaurant.rating}</span>
              </div>
              <span className="text-gray-600">{restaurant.cuisine_type}</span>
            </div>
          </div>
        </div>
      </div>

      <div id="nav-sentinel" />
      <div ref={spacerRef} aria-hidden="true" />
      <div ref={navRef} className={`sticky top-0 z-40 ${navFixed ? 'fixed top-0 left-0 right-0 z-50' : ''} bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-y border-gray-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button className="h-10 sm:h-12 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => router.push(`/restaurant/${restaurantId}/orders`)}>
            <ShoppingCart className="h-4 w-4" />
            Manage Orders
          </Button>
          <Button variant="outline" className="h-10 sm:h-12 flex items-center justify-center gap-2" onClick={() => router.push(`/restaurant/${restaurantId}/menu`)}>
            <Edit className="h-4 w-4" />
            Edit Menu
          </Button>
          <Button variant="outline" className="h-10 sm:h-12 flex items-center justify-center gap-2" onClick={() => router.push(`/menu/${restaurantId}`)}>
            <Eye className="h-4 w-4" />
            View Live Menu
          </Button>
          <Button variant="outline" className="h-10 sm:h-12 flex items-center justify-center gap-2" onClick={() => router.push(`/restaurant/${restaurantId}/settings`)}>
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-gray-500">
        Scroll to verify the nav remains pinned.
      </div>
    </div>
  )
}


