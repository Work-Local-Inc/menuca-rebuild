'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Edit, Eye, Settings, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Props = { restaurantId: string }

export default function RestaurantAdminNav({ restaurantId }: Props) {
  const router = useRouter()
  const go = (href: string) => () => router.push(href)
  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-full bg-black text-white text-sm py-2 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center justify-between">
        <div className="font-medium">Admin Toolbar</div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="bg-white text-black" onClick={go(`/restaurant/${restaurantId}/orders`)}>
            <ShoppingCart className="h-4 w-4 mr-1" /> Manage Orders
          </Button>
          <Button size="sm" variant="outline" className="bg-white text-black" onClick={go(`/restaurant/${restaurantId}/menu`)}>
            <Edit className="h-4 w-4 mr-1" /> Edit Menu
          </Button>
          <Button size="sm" variant="outline" className="bg-white text-black" onClick={go(`/menu/${restaurantId}`)}>
            <Eye className="h-4 w-4 mr-1" /> View Live Menu
          </Button>
          <Button size="sm" variant="outline" className="bg-white text-black" onClick={go(`/restaurant/${restaurantId}/settings`)}>
            <Settings className="h-4 w-4 mr-1" /> Settings
          </Button>
          <Button size="sm" variant="outline" className="bg-white text-black" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </div>
    </div>
  )
}


