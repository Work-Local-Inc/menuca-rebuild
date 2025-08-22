'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, Clock, Truck, ChefHat, MapPin, Phone, 
  ArrowLeft, Star, RefreshCw
} from 'lucide-react'

interface OrderStatus {
  step: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered'
  message: string
  timestamp?: string
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  number: string
  status: OrderStatus['status']
  restaurant: {
    name: string
    phone: string
    address: string
  }
  items: OrderItem[]
  subtotal: number
  tax: number
  tip: number
  total: number
  estimatedTime: string
  deliveryAddress: string
  placedAt: string
}

// Mock order data - will be replaced with API call
const MOCK_ORDER: Order = {
  id: 'ORD-123456',
  number: 'ORD-123456',
  status: 'preparing',
  restaurant: {
    name: 'Xtreme Pizza Ottawa',
    phone: '(613) 555-0123',
    address: '123 Bank Street, Ottawa, ON'
  },
  items: [
    { id: '1', name: 'Margherita Pizza', quantity: 2, price: 16.99 },
    { id: '2', name: 'Pepperoni Supreme', quantity: 1, price: 19.99 },
    { id: '4', name: 'Caesar Salad', quantity: 1, price: 12.99 }
  ],
  subtotal: 66.97,
  tax: 8.71,
  tip: 3.00,
  total: 78.68,
  estimatedTime: '25-35 min',
  deliveryAddress: '456 Somerset Street, Ottawa, ON K1R 5K6',
  placedAt: new Date().toISOString()
}

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: CheckCircle },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: CheckCircle },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle }
]

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrder()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrder, 30000)
    return () => clearInterval(interval)
  }, [orderId])

  const loadOrder = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/orders/${orderId}`)
      // const orderData = await response.json()
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setOrder(MOCK_ORDER)
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshOrder = async () => {
    setRefreshing(true)
    await loadOrder()
    setRefreshing(false)
  }

  const getStatusIndex = (status: OrderStatus['status']) => {
    return ORDER_STATUSES.findIndex(s => s.key === status)
  }

  const getStatusColor = (status: OrderStatus['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'ready': return 'bg-purple-100 text-purple-800'
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstimatedDelivery = () => {
    if (!order) return ''
    
    const placedAt = new Date(order.placedAt)
    const estimatedMinutes = parseInt(order.estimatedTime.split('-')[1]) || 35
    const estimatedDelivery = new Date(placedAt.getTime() + estimatedMinutes * 60000)
    
    return estimatedDelivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Order not found</h2>
            <p className="text-gray-600 mb-6">We couldn't find an order with this ID.</p>
            <Button onClick={() => router.push('/menu/xtreme-pizza')}>
              Order Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStatusIndex = getStatusIndex(order.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Order #{order.number}</h1>
                <p className="text-sm text-gray-600">
                  Placed at {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={refreshOrder}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status and ETA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={getStatusColor(order.status)}>
                  {ORDER_STATUSES.find(s => s.key === order.status)?.label}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                {order.status === 'preparing' && "Your order is being prepared with care"}
                {order.status === 'ready' && "Your order is ready for pickup/delivery"}
                {order.status === 'out_for_delivery' && "Your driver is on the way"}
                {order.status === 'delivered' && "Your order has been delivered"}
              </div>
            </CardContent>
          </Card>

          {/* Estimated Delivery */}
          <Card>
            <CardHeader>
              <CardTitle>Estimated Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-xl font-bold">{getEstimatedDelivery()}</span>
              </div>
              <p className="text-sm text-gray-600">
                Usually takes {order.estimatedTime}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ORDER_STATUSES.map((statusItem, index) => {
                const StatusIcon = statusItem.icon
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                
                return (
                  <div key={statusItem.key} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-semibold ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {statusItem.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-gray-600">In progress...</p>
                      )}
                    </div>
                    
                    {isCompleted && !isCurrent && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Restaurant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{order.restaurant.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">4.8 • Italian</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{order.restaurant.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{order.restaurant.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Delivering to:</p>
                  <p className="text-gray-600">{order.deliveryAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items & Receipt */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600 ml-2">× {item.quantity}</span>
                  </div>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tip</span>
                  <span>${order.tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/menu/xtreme-pizza')}
            className="flex-1"
          >
            Order Again
          </Button>
          <Button 
            onClick={() => router.push('/')}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
