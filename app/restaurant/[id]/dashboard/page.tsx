'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChefHat, ShoppingCart, DollarSign, Clock, Users, Star,
  TrendingUp, Bell, Settings, Menu, Eye, Edit, Plus,
  AlertCircle, CheckCircle, Package
} from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  cuisine_type: string
  status: string
  rating: number
  total_orders: number
  today_revenue: number
  logo_url?: string | null
  banner_url?: string | null
  description?: string | null
}

interface OrderSummary {
  pending: number
  preparing: number
  ready: number
  total_today: number
  revenue_today: number
}

// Mock data - will be replaced with API calls
const MOCK_RESTAURANT: Restaurant = {
  id: 'xtreme-pizza',
  name: 'Xtreme Pizza Ottawa',
  cuisine_type: 'Italian',
  status: 'active',
  rating: 4.8,
  total_orders: 1247,
  today_revenue: 324.50
}

const MOCK_ORDERS: OrderSummary = {
  pending: 3,
  preparing: 5,
  ready: 2,
  total_today: 28,
  revenue_today: 324.50
}

export default function RestaurantDashboard() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params?.id as string
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [orders, setOrders] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [navFixed, setNavFixed] = useState(false)
  const navRef = useRef<HTMLDivElement | null>(null)
  const spacerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [restaurantId])

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      console.log('🔍 Loading dashboard data for restaurant:', restaurantId)
      
      // Fetch actual restaurant data
      const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`)
      if (!restaurantResponse.ok) {
        throw new Error('Failed to fetch restaurant data')
      }
      
      const restaurantData = await restaurantResponse.json()
      console.log('✅ Loaded restaurant data:', restaurantData.restaurant.name)
      
      setRestaurant(restaurantData.restaurant)
      
      // TODO: Implement orders API
      // For now, use mock orders data
      setOrders(MOCK_ORDERS)
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      // Fallback to mock data if API fails
      setRestaurant(MOCK_RESTAURANT)
      setOrders(MOCK_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel')
    if (!sentinel) return
    const obs = new IntersectionObserver(([entry]) => {
      setNavFixed(!entry.isIntersecting)
      if (navRef.current && spacerRef.current) {
        const h = navRef.current.getBoundingClientRect().height
        spacerRef.current.style.height = entry.isIntersecting ? '0px' : `${h}px`
      }
    }, { rootMargin: '0px 0px 0px 0px', threshold: 0 })
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-600 animate-bounce mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Restaurant not found</h2>
            <p className="text-gray-600 mb-6">This restaurant doesn't exist or you don't have access.</p>
            <Button onClick={() => router.push('/restaurant/onboard')}>
              Create New Restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - match menu branding with hero and overlay logo */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          {/* Hero banner with logo overlay */}
          <div className="relative">
            <div className="w-full h-40 md:h-56 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
              {restaurant?.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={restaurant.banner_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ChefHat className="h-16 w-16 text-white/80" /></div>
              )}
            </div>
            <div className="absolute -bottom-6 left-4 z-10 rounded-lg bg-white/95 shadow-md ring-1 ring-black/5 px-3 py-2">
              {restaurant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logo_url}
                  alt="Logo"
                  className="object-contain max-h-14 md:max-h-20 max-w-[240px]"
                />
              ) : (
                <div className="flex items-center justify-center h-14 md:h-20 min-w-[80px]">
                  <ChefHat className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Info row (non-sticky) */}
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
            )}
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

      {/* Fixed-on-scroll navigation */}
      <div id="nav-sentinel" />
      <div ref={spacerRef} aria-hidden="true" />
      <div ref={navRef} className={`${navFixed ? 'fixed top-0 left-0 right-0 z-50' : ''} bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-y border-gray-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            onClick={() => router.push(`/restaurant/${restaurantId}/orders`)}
            className="h-10 sm:h-12 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Manage Orders
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/restaurant/${restaurantId}/menu`)}
            className="h-10 sm:h-12 flex items-center justify-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Menu
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/menu/${restaurantId}`)}
            className="h-10 sm:h-12 flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Live Menu
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/restaurant/${restaurantId}/settings`)}
            className="h-10 sm:h-12 flex items-center justify-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Orders Today</p>
                  <p className="text-2xl font-bold text-gray-900">{orders?.total_today}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue Today</p>
                  <p className="text-2xl font-bold text-gray-900">${orders?.revenue_today.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{restaurant.rating}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{restaurant.total_orders}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Clock className="h-5 w-5" />
                Pending Orders ({orders?.pending})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders?.pending === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending orders</p>
                ) : (
                  <>
                    <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                      <p className="font-semibold">Order #12345</p>
                      <p className="text-sm text-gray-600">2x Margherita Pizza • $33.98</p>
                      <p className="text-xs text-yellow-700">Needs acceptance</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                      <p className="font-semibold">Order #12346</p>
                      <p className="text-sm text-gray-600">1x Meat Lovers • $24.99</p>
                      <p className="text-xs text-yellow-700">Needs acceptance</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <ChefHat className="h-5 w-5" />
                Preparing ({orders?.preparing})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders?.preparing === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders preparing</p>
                ) : (
                  <>
                    <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                      <p className="font-semibold">Order #12340</p>
                      <p className="text-sm text-gray-600">1x Hawaiian Pizza • $18.99</p>
                      <p className="text-xs text-orange-700">Prep time: 12 min</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                      <p className="font-semibold">Order #12341</p>
                      <p className="text-sm text-gray-600">Wings + Caesar Salad • $27.98</p>
                      <p className="text-xs text-orange-700">Prep time: 8 min</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Package className="h-5 w-5" />
                Ready ({orders?.ready})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders?.ready === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders ready</p>
                ) : (
                  <>
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                      <p className="font-semibold">Order #12338</p>
                      <p className="text-sm text-gray-600">2x Pepperoni • $39.98</p>
                      <p className="text-xs text-green-700">Ready for pickup</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions removed – consolidated into top navigation under hero */}

        {/* Welcome Message for New Restaurants */}
        <Card className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  🎉 Welcome to MenuCA! Your restaurant is LIVE!
                </h3>
                <p className="text-orange-800 mb-4">
                  Your menu has been imported and customers can now place orders. 
                  Here's what you can do next:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-orange-900">✅ Immediate Actions:</p>
                    <ul className="space-y-1 text-orange-800">
                      <li>• Review and edit imported menu items</li>
                      <li>• Set up order notifications</li>
                      <li>• Test the customer ordering experience</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-orange-900">🚀 Growth Features:</p>
                    <ul className="space-y-1 text-orange-800">
                      <li>• Upload high-quality food photos</li>
                      <li>• Configure delivery zones</li>
                      <li>• Set up promotional campaigns</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button 
                    size="sm"
                    onClick={() => router.push(`/restaurant/${restaurantId}/menu`)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Edit Menu Items
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/menu/${restaurantId}`)}
                  >
                    Test Customer Experience
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
