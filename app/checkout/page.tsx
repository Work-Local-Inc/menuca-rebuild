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

interface CartItem { id: string; name: string; price: number; quantity: number; specialInstructions?: string }
interface RestaurantMeta {
  id: string
  name: string
  logo_url?: string | null
  delivery_fee_enabled?: boolean
  delivery_fee?: number | null
  out_of_area_fee_enabled?: boolean
  out_of_area_fee?: number | null
  delivery_radius_km?: number | null
  latitude?: number | null
  longitude?: number | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rid, setRid] = useState<string | null>(null)

  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'confirmation'>('cart')
  const [cart, setCart] = useState<CartItem[]>([])
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [selectedTip, setSelectedTip] = useState(3.00)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [restaurant, setRestaurant] = useState<RestaurantMeta | null>(null)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<{id: string; text: string; description: string}[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressDebounceTimer, setAddressDebounceTimer] = useState<any>(null)
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null)
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null)

  useEffect(() => {
    const paramRid = searchParams?.get('rid')
    let effectiveRid = paramRid
    if (!effectiveRid && typeof window !== 'undefined') {
      effectiveRid = localStorage.getItem('lastRestaurantId') || document.cookie.match(/last_restaurant_id=([^;]+)/)?.[1] || null
    }
    if (effectiveRid) setRid(effectiveRid)

    if (effectiveRid) {
      fetch(`/api/restaurants/${effectiveRid}`).then(async r => {
        if (r.ok) {
          const j = await r.json()
          setRestaurant({
            id: j.restaurant.id,
            name: j.restaurant.name,
            logo_url: j.restaurant.logo_url || null,
            delivery_fee_enabled: j.restaurant.delivery_fee_enabled ?? false,
            delivery_fee: j.restaurant.delivery_fee ?? null,
            out_of_area_fee_enabled: j.restaurant.out_of_area_fee_enabled ?? false,
            out_of_area_fee: j.restaurant.out_of_area_fee ?? null,
            delivery_radius_km: j.restaurant.delivery_radius_km ?? null,
            latitude: j.restaurant.latitude ?? null,
            longitude: j.restaurant.longitude ?? null,
          })
        }
      }).catch(() => {})
      try {
        const saved = localStorage.getItem(`cart_items_${effectiveRid}`)
        if (saved) setCart(JSON.parse(saved))
      } catch {}
    }

    const stepParam = searchParams?.get('step')
    if (stepParam === 'confirmation') {
      setStep('confirmation')
      const sid = searchParams?.get('session_id') || ''
      if (sid) setOrderId(sid)
    }
  }, [searchParams])

  useEffect(() => {
    if (!rid) return
    try {
      const saved = localStorage.getItem(`delivery_${rid}`)
      if (saved) {
        const j = JSON.parse(saved)
        setFullName(j.fullName || '')
        setPhone(j.phone || '')
        setDeliveryAddress(j.deliveryAddress || '')
        setDeliveryInstructions(j.deliveryInstructions || '')
        setDeliveryLat(typeof j.deliveryLat === 'number' ? j.deliveryLat : null)
        setDeliveryLng(typeof j.deliveryLng === 'number' ? j.deliveryLng : null)
      }
    } catch {}
  }, [rid])

  useEffect(() => {
    if (!rid) return
    try {
      localStorage.setItem(`delivery_${rid}` , JSON.stringify({ fullName, phone, deliveryAddress, deliveryInstructions, deliveryLat, deliveryLng }))
    } catch {}
  }, [rid, fullName, phone, deliveryAddress, deliveryInstructions, deliveryLat, deliveryLng])

  useEffect(() => {
    if (!addressQuery || addressQuery.length < 3) { setAddressSuggestions([]); return }
    if (addressDebounceTimer) clearTimeout(addressDebounceTimer)
    const t = setTimeout(async () => {
      try {
        setAddressLoading(true)
        const resp = await fetch('/api/addresses/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: addressQuery }) })
        const data = await resp.json()
        setAddressSuggestions(data?.suggestions || [])
      } catch { setAddressSuggestions([]) }
      finally { setAddressLoading(false) }
    }, 250)
    setAddressDebounceTimer(t)
  }, [addressQuery])

  const selectAddress = async (id: string) => {
    try {
      const resp = await fetch(`/api/addresses/details?id=${encodeURIComponent(id)}`)
      const data = await resp.json()
      const a = data?.address
      if (a?.formatted) setDeliveryAddress(a.formatted)
      if (typeof a?.latitude === 'number') setDeliveryLat(a.latitude)
      if (typeof a?.longitude === 'number') setDeliveryLng(a.longitude)
      setAddressSuggestions([])
      setAddressQuery('')
    } catch {}
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.13
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => v * Math.PI / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  const computeDeliveryFee = (): number => {
    const cfg = restaurant
    if (!cfg) return 0
    const baseEnabled = !!cfg.delivery_fee_enabled
    const baseFee = typeof cfg.delivery_fee === 'number' ? cfg.delivery_fee : null
    const ooaEnabled = !!cfg.out_of_area_fee_enabled
    const ooaFee = typeof cfg.out_of_area_fee === 'number' ? cfg.out_of_area_fee : null
    const radius = typeof cfg.delivery_radius_km === 'number' ? cfg.delivery_radius_km : null
    const restLat = typeof cfg.latitude === 'number' ? cfg.latitude : null
    const restLng = typeof cfg.longitude === 'number' ? cfg.longitude : null

    if (!baseEnabled || baseFee === null) return 0
    if (radius && restLat !== null && restLng !== null && deliveryLat !== null && deliveryLng !== null) {
      const dist = haversineKm(restLat, restLng, deliveryLat, deliveryLng)
      if (dist > radius) {
        if (ooaEnabled && ooaFee !== null) return ooaFee
      }
    }
    return baseFee
  }
  const deliveryFee = computeDeliveryFee()
  const total = subtotal + tax + deliveryFee + selectedTip

  const updateQuantity = (itemId: string, change: number) => {
    setCart(prev => {
      const next = prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + change) } : i).filter(i => i.quantity > 0)
      if (rid) localStorage.setItem(`cart_items_${rid}`, JSON.stringify(next))
      return next
    })
  }

  const processPayment = async () => {
    setPaymentProcessing(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity })),
          restaurantId: restaurant?.id || '',
          customerEmail: '',
          delivery: { fullName, phone, address: deliveryAddress }
        })
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      if (data?.url) { window.location.href = data.url; return }
      throw new Error('No checkout URL returned')
    } catch (e) {
      console.error(e)
      alert('Failed to start payment.')
    } finally {
      setPaymentProcessing(false)
    }
  }

  const isValidPhone = (v: string) => /^\+?[0-9\-\s().]{7,}$/.test(v.trim())
  const deliveryValid = fullName.trim().length > 1 && isValidPhone(phone) && deliveryAddress.trim().length > 5

  const handlePrimaryAction = () => {
    if (step === 'cart') {
      setStep('delivery')
      return
    }
    if (step === 'delivery') {
      setAttemptedSubmit(true)
      if (deliveryValid) setStep('payment')
      return
    }
    if (step === 'payment') {
      void processPayment()
    }
  }

  const primaryLabel = step === 'cart' ? 'Continue to Delivery' : step === 'delivery' ? 'Continue to Payment' : (paymentProcessing ? 'Processing…' : 'Place Order')
  const primaryDisabled = step === 'payment' ? paymentProcessing : false

  if (cart.length === 0 && step !== 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <Button onClick={() => router.push(rid ? `/menu/${rid}` : '/')} className="bg-orange-600 hover:bg-orange-700">Add More Items</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const addMoreHref = rid ? `/menu/${rid}` : '/'
  const orderAgainHref = rid ? `/menu/${rid}` : '/'

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
                      onClick={() => router.push(addMoreHref)}
                      className="flex-1"
                    >
                      Add More Items
                    </Button>
                    <Button 
                      onClick={() => setStep('delivery')}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Customer name" className={attemptedSubmit && !fullName.trim() ? 'border-red-500' : ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g., 613-555-0123" className={attemptedSubmit && !isValidPhone(phone) ? 'border-red-500' : ''} />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">Delivery Address</label>
                    <Input
                      placeholder="Search address (Canada Post)"
                      value={deliveryAddress}
                      onChange={(e) => { setDeliveryAddress(e.target.value); setAddressQuery(e.target.value) }}
                      onFocus={() => setAddressQuery(deliveryAddress)}
                      className={`w-full ${attemptedSubmit && !deliveryAddress.trim() ? 'border-red-500' : ''}`}
                    />
                    {addressLoading && <div className="text-xs text-gray-500 mt-1">Searching…</div>}
                    {addressSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
                        {addressSuggestions.map(s => (
                          <button key={s.id} className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => selectAddress(s.id)}>
                            <div className="font-medium text-sm">{s.text}</div>
                            <div className="text-xs text-gray-500">{s.description}</div>
                          </button>
                        ))}
                        <div className="border-t">
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            onClick={() => { setAddressSuggestions([]); setAddressQuery('') }}
                          >
                            Use typed address
                          </button>
                        </div>
                      </div>
                    )}
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

                  {false && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold text-orange-800">Estimated Delivery</span>
                      </div>
                      <p className="text-orange-700">25-35 minutes</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep('cart')} className="flex-1">
                      Back to Cart
                    </Button>
                    <Button 
                      onClick={() => { setAttemptedSubmit(true); if (deliveryValid) setStep('payment') }}
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
                    <Button variant="outline" onClick={() => setStep('delivery')} className="flex-1">
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
                      {false && (
                        <div className="bg-gray-50 p-3 rounded">
                          <Clock className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                          <p className="font-semibold">Estimated Time</p>
                          <p className="text-gray-600">25-35 minutes</p>
                        </div>
                      )}
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
                      onClick={() => router.push(orderAgainHref)}
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
                <div className="pb-4 border-b">
                  <div className="w-full h-16 md:h-20 rounded-lg overflow-hidden bg-white ring-1 ring-black/5 flex items-center justify-center p-2">
                    {restaurant?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={restaurant.logo_url} alt="Restaurant Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ChefHat className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                </div>
                {/* Totals section remains unchanged */}
                <div className="space-y-2 text-sm mt-4">
                  <div className="flex justify-between"><span>Subtotal ({cart.length} items)</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span></div>
                  {selectedTip > 0 && (<div className="flex justify-between"><span>Driver Tip</span><span>${selectedTip.toFixed(2)}</span></div>)}
                  <div className="border-t pt-2"><div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div></div>
                </div>

                {/* Free delivery notification removed: always flat delivery fee */}

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
                <div className="mt-4"><Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handlePrimaryAction} disabled={primaryDisabled}>{primaryLabel}</Button></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
