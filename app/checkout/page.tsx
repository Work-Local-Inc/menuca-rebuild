'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, CreditCard, MapPin, Clock, CheckCircle, ArrowLeft,
  Plus, Minus, Truck, Tag, AlertCircle, Star, ChefHat
} from 'lucide-react'

// Types
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  specialInstructions?: string
}

interface OrderSummary {
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  tip: number
  total: number
}

// Mock cart data - will be replaced with actual cart state
const MOCK_CART: CartItem[] = [
  { id: '1', name: 'Margherita Pizza', price: 16.99, quantity: 2 },
  { id: '2', name: 'Pepperoni Supreme', price: 19.99, quantity: 1 },
  { id: '4', name: 'Caesar Salad', price: 12.99, quantity: 1 }
]

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'confirmation'>('cart')
  const [cart, setCart] = useState<CartItem[]>(MOCK_CART)
  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  
  // Order details
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [selectedTip, setSelectedTip] = useState(3.00)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [orderId, setOrderId] = useState('')

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.13 // 13% tax
  const deliveryFee = subtotal > 30 ? 0 : 2.99
  const tip = selectedTip
  const total = subtotal + tax + deliveryFee + tip

  // Cart management
  const updateQuantity = (itemId: string, change: number) => {
    setCart(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ).filter(item => item.quantity > 0)
    )
  }

  const removeItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  // Step navigation
  const goToNextStep = () => {
    const steps = ['cart', 'delivery', 'payment', 'confirmation'] as const
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const steps = ['cart', 'delivery', 'payment', 'confirmation'] as const
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  // Payment processing
  const processPayment = async () => {
    setPaymentProcessing(true)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate order ID
      const newOrderId = 'ORD-' + Date.now().toString().slice(-6)
      setOrderId(newOrderId)
      setOrderComplete(true)
      setStep('confirmation')
      
      // TODO: Connect to actual Stripe payment processing
      // const paymentIntent = await createPaymentIntent({ amount: total })
      // const result = await confirmPayment(paymentIntent.client_secret)
      
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setPaymentProcessing(false)
    }
  }

  // If cart is empty, redirect to menu
  if (cart.length === 0 && step !== 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
            <Button 
              onClick={() => router.push('/menu/xtreme-pizza')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Browse Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <span className="text-lg font-semibold">Checkout</span>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              {['Cart', 'Delivery', 'Payment', 'Complete'].map((stepName, index) => {
                const stepNames = ['cart', 'delivery', 'payment', 'confirmation']
                const currentStepIndex = stepNames.indexOf(step)
                const isActive = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                
                return (
                  <div key={stepName} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isActive 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isActive ? (index + 1) : (index + 1)}
                    </div>
                    <span className={`ml-2 ${isCurrent ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                      {stepName}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Step 1: Cart Review */}
            {step === 'cart' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-gray-600">${item.price.toFixed(2)} each</p>
                          {item.specialInstructions && (
                            <p className="text-sm text-gray-500 mt-1">{item.specialInstructions}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-semibold min-w-[30px] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <span className="font-bold min-w-[80px] text-right">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/menu/xtreme-pizza')}
                      className="flex-1"
                    >
                      Add More Items
                    </Button>
                    <Button 
                      onClick={goToNextStep}
                      disabled={cart.length === 0}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Continue to Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Delivery Information */}
            {step === 'delivery' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Address</label>
                    <Input
                      placeholder="Enter your full address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Instructions (Optional)</label>
                    <Input
                      placeholder="e.g., Ring doorbell, Leave at door, etc."
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-orange-800">Estimated Delivery</span>
                    </div>
                    <p className="text-orange-700">25-35 minutes</p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goToPreviousStep} className="flex-1">
                      Back to Cart
                    </Button>
                    <Button 
                      onClick={goToNextStep}
                      disabled={!deliveryAddress.trim()}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment */}
            {step === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tip Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Add a tip for your driver</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2.00, 3.00, 4.00, 5.00].map(amount => (
                        <Button
                          key={amount}
                          variant={selectedTip === amount ? "default" : "outline"}
                          onClick={() => setSelectedTip(amount)}
                          className={selectedTip === amount ? "bg-orange-600 hover:bg-orange-700" : ""}
                        >
                          ${amount.toFixed(2)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method (Mock) */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold">Payment Method</span>
                    </div>
                    <div className="bg-white p-4 rounded border-2 border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">VISA</span>
                        </div>
                        <div>
                          <p className="font-semibold">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-600">Expires 12/25</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      💳 This is a demo - no actual payment will be processed
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goToPreviousStep} className="flex-1">
                      Back to Delivery
                    </Button>
                    <Button 
                      onClick={processPayment}
                      disabled={paymentProcessing}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {paymentProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        `Place Order • $${total.toFixed(2)}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Confirmation */}
            {step === 'confirmation' && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                    <p className="text-gray-600 mb-4">Thank you for your order. We're preparing it now!</p>
                    
                    <div className="bg-orange-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-orange-800 mb-1">Order Number</p>
                      <p className="text-xl font-bold text-orange-900">{orderId}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <Clock className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                        <p className="font-semibold">Estimated Time</p>
                        <p className="text-gray-600">25-35 minutes</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <MapPin className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                        <p className="font-semibold">Delivery To</p>
                        <p className="text-gray-600">{deliveryAddress.substring(0, 20)}...</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <CreditCard className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                        <p className="font-semibold">Total Paid</p>
                        <p className="text-gray-600">${total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/orders/' + orderId)}
                      className="flex-1"
                    >
                      Track Order
                    </Button>
                    <Button 
                      onClick={() => router.push('/menu/xtreme-pizza')}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Order Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-80">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Restaurant Info */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                      <ChefHat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Xtreme Pizza Ottawa</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">4.8 • 25-35 min</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({cart.length} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    {tip > 0 && (
                      <div className="flex justify-between">
                        <span>Driver Tip</span>
                        <span>${tip.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Free delivery notification */}
                  {subtotal < 30 && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-800">
                        Add ${(30 - subtotal).toFixed(2)} more for free delivery!
                      </p>
                    </div>
                  )}

                  {/* Delivery info */}
                  {deliveryAddress && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Delivering to:</p>
                          <p className="text-sm text-gray-600">{deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
