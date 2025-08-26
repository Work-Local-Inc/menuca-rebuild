'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Star, Clock, MapPin, Search, Filter, ShoppingCart, 
  Plus, Minus, Heart, Share, ChefHat, Truck, Phone 
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  category: string
  dietary_tags?: string[]
  prep_time?: number
  rating?: number
  is_popular?: boolean
}

interface Restaurant {
  id: string
  name: string
  description: string
  cuisine_type: string
  rating: number
  review_count: number
  delivery_time: string
  delivery_fee: number
  min_order: number
  address: string
  phone?: string
  is_open: boolean
}

// Mock data - will be replaced with API calls
const MOCK_RESTAURANT: Restaurant = {
  id: 'xtreme-pizza',
  name: 'Xtreme Pizza Ottawa',
  description: 'Authentic wood-fired pizzas with premium ingredients',
  cuisine_type: 'Italian',
  rating: 4.8,
  review_count: 342,
  delivery_time: '25-35 min',
  delivery_fee: 2.99,
  min_order: 15.00,
  address: '123 Bank Street, Ottawa, ON',
  is_open: true
}

const MOCK_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, san marzano tomatoes, fresh basil, extra virgin olive oil',
    price: 16.99,
    category: 'Pizzas',
    dietary_tags: ['vegetarian'],
    prep_time: 15,
    rating: 4.9,
    is_popular: true
  },
  {
    id: '2', 
    name: 'Pepperoni Supreme',
    description: 'Premium pepperoni, mozzarella cheese, signature pizza sauce',
    price: 19.99,
    category: 'Pizzas',
    prep_time: 18,
    rating: 4.7,
    is_popular: true
  },
  {
    id: '3',
    name: 'Meat Lovers Special',
    description: 'Pepperoni, Italian sausage, ham, bacon, ground beef',
    price: 24.99,
    category: 'Pizzas',
    prep_time: 20,
    rating: 4.6
  },
  {
    id: '4',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, parmesan, croutons, caesar dressing',
    price: 12.99,
    category: 'Salads',
    dietary_tags: ['vegetarian'],
    prep_time: 5,
    rating: 4.4
  },
  {
    id: '5',
    name: 'Garlic Bread',
    description: 'Fresh baked bread with garlic butter and herbs',
    price: 8.99,
    category: 'Sides',
    dietary_tags: ['vegetarian'],
    prep_time: 8,
    rating: 4.5
  }
]

export default function MenuPage() {
  const params = useParams()
  const restaurantId = params?.id as string
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [favorites, setFavorites] = useState<string[]>([])

  const categories = ['All', ...Array.from(new Set(menu.map(item => item.category)))]
  const cartItemCount = Object.values(cart).reduce((sum, count) => sum + count, 0)
  const cartTotal = Object.entries(cart).reduce((sum, [itemId, count]) => {
    const item = menu.find(m => m.id === itemId)
    return sum + (item ? item.price * count : 0)
  }, 0)

  useEffect(() => {
    loadRestaurantData()
  }, [restaurantId])

  const loadRestaurantData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Loading restaurant and menu data for:', restaurantId)
      
      // Fetch actual restaurant data
      const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`)
      if (!restaurantResponse.ok) {
        throw new Error('Failed to fetch restaurant data')
      }
      
      const restaurantData = await restaurantResponse.json()
      console.log('✅ Loaded restaurant:', restaurantData.restaurant.name)
      setRestaurant(restaurantData.restaurant)
      
      // Fetch actual menu data
      const menuResponse = await fetch(`/api/restaurants/${restaurantId}/menu`)
      if (!menuResponse.ok) {
        throw new Error('Failed to fetch menu data')
      }
      
      const menuData = await menuResponse.json()
      console.log(`✅ Loaded ${menuData.menu.length} menu items`)
      setMenu(menuData.menu)
      
    } catch (error) {
      console.error('❌ Error loading restaurant data:', error)
      // Fallback to mock data if API fails
      setRestaurant(MOCK_RESTAURANT)
      setMenu(MOCK_MENU)
    } finally {
      setLoading(false)
    }
  }

  const filteredMenu = menu.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1
      } else {
        delete newCart[itemId]
      }
      return newCart
    })
  }

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-600 animate-bounce mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading delicious menu...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Restaurant not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Restaurant Image */}
            <div className="w-full md:w-64 h-48 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
              <ChefHat className="h-16 w-16 text-white/80" />
            </div>

            {/* Restaurant Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                  <p className="text-gray-600 mb-4">{restaurant.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{restaurant.rating}</span>
                      <span className="text-gray-500">({restaurant.review_count} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{restaurant.delivery_time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <span>${restaurant.delivery_fee} delivery</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{restaurant.address}</span>
                    </div>
                    {restaurant.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Status & Minimum Order */}
              <div className="flex items-center gap-4">
                <Badge className={restaurant.is_open ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {restaurant.is_open ? "🟢 Open" : "🔴 Closed"}
                </Badge>
                <span className="text-sm text-gray-600">
                  Minimum order: ${restaurant.min_order.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu Content */}
          <div className="flex-1">
            {/* Search and Filter */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenu.map(item => (
                <Card key={item.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Item Image */}
                      <div className="w-32 h-32 bg-gradient-to-br from-orange-200 to-red-300 flex items-center justify-center">
                        <ChefHat className="h-8 w-8 text-orange-600" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            {item.is_popular && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">Popular</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(item.id)}
                            className="p-1 h-auto"
                          >
                            <Heart className={`h-4 w-4 ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                          </Button>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                        
                        {/* Tags and Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          {item.dietary_tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-500">{item.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Price and Add to Cart */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              ${item.price.toFixed(2)}
                            </span>
                            {item.prep_time && (
                              <span className="text-xs text-gray-500">• {item.prep_time} min</span>
                            )}
                          </div>

                          {/* Add to Cart Controls */}
                          <div className="flex items-center gap-2">
                            {cart[item.id] ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-semibold min-w-[20px] text-center">
                                  {cart[item.id]}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item.id)}
                                  className="h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addToCart(item.id)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredMenu.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No items found matching your search.</p>
              </div>
            )}
          </div>

          {/* Sticky Cart Sidebar - Desktop */}
          <div className="hidden lg:block w-80">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Your Order ({cartItemCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <p className="text-sm text-gray-400">Add items to get started</p>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-4 mb-6">
                      {Object.entries(cart).map(([itemId, count]) => {
                        const item = menu.find(m => m.id === itemId)
                        if (!item) return null
                        
                        return (
                          <div key={itemId} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(itemId)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-semibold min-w-[20px] text-center">{count}</span>
                              <Button
                                size="sm"
                                onClick={() => addToCart(itemId)}
                                className="h-6 w-6 p-0 bg-orange-600 hover:bg-orange-700"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Cart Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total: ${cartTotal.toFixed(2)}</span>
                      </div>
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        disabled={cartTotal < restaurant.min_order}
                      >
                        {cartTotal < restaurant.min_order 
                          ? `Minimum order $${restaurant.min_order.toFixed(2)}`
                          : 'Proceed to Checkout'
                        }
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Cart Button */}
      {cartItemCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4">
          <Button className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-semibold shadow-lg">
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart ({cartItemCount}) • ${cartTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )
}
