import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, MapPin, Clock, CheckCircle } from 'lucide-react';
import { TempNavigation } from '@/components/TempNavigation';
import StripePaymentForm from '@/components/StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CartItem {
  menuItem: any;
  quantity: number;
  customization?: any;
  finalPrice?: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { restaurantId } = router.query;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'confirmation'>('cart');
  const [orderData, setOrderData] = useState({
    deliveryAddress: '',
    specialInstructions: '',
    tipAmount: 0
  });
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    // Load cart from sessionStorage (set by menu page)
    const cartData = sessionStorage.getItem('checkout_cart');
    const restaurantData = sessionStorage.getItem('checkout_restaurant');
    
    if (cartData) {
      try {
        const parsedCart = JSON.parse(cartData);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
      }
    }
    
    setLoading(false);
  }, []);

  const calculateTotals = () => {
    if (!cart || cart.length === 0) return { subtotal: 0, tax: 0, delivery: 0, tip: 0, total: 0 };
    
    const subtotal = cart.reduce((total, item) => {
      const itemPrice = item.finalPrice || item.menuItem.price;
      return total + (itemPrice * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.13; // 13% HST for Canada
    const delivery = 2.99;
    const tip = orderData.tipAmount;
    const total = subtotal + tax + delivery + tip;

    return { subtotal, tax, delivery, tip, total };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const createPaymentIntent = async () => {
    try {
      const totals = calculateTotals();
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totals.total,
          currency: 'cad',
          orderData: {
            restaurantId,
            deliveryAddress: orderData.deliveryAddress,
            specialInstructions: orderData.specialInstructions,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setPaymentError('Failed to initialize payment. Please try again.');
    }
  };

  const handlePaymentSuccess = () => {
    setStep('confirmation');
    // Clear cart
    sessionStorage.removeItem('checkout_cart');
    sessionStorage.removeItem('checkout_restaurant');
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const handlePlaceOrder = async () => {
    // This is only called for non-Stripe payments or confirmation
    console.log('Placing order:', { cart, orderData, restaurantId });
    setStep('confirmation');
    
    // Clear cart
    sessionStorage.removeItem('checkout_cart');
    sessionStorage.removeItem('checkout_restaurant');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <TempNavigation />
        <div className="max-w-md mx-auto text-center py-16">
          <h2 className="text-xl font-semibold mb-4">Loading cart...</h2>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <TempNavigation />
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 text-center">Add some delicious items to get started!</p>
            <Button onClick={() => router.push(`/menu/${restaurantId}`)} className="mt-4">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TempNavigation />
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          {['cart', 'delivery', 'payment', 'confirmation'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === stepName ? 'bg-blue-600 text-white' :
                ['cart', 'delivery', 'payment'].indexOf(step) > index ? 'bg-green-600 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                {['cart', 'delivery', 'payment'].indexOf(step) > index ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="ml-2 text-sm font-medium capitalize">{stepName}</span>
            </div>
          ))}
        </div>

        {step === 'cart' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Review Your Order ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.quantity}x {item.menuItem.name}</h4>
                    {item.customization && (
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Size: {item.customization.size?.name}</p>
                        <p>Crust: {item.customization.crust?.name}</p>
                        <p>Sauce: {item.customization.sauce?.name}</p>
                        {item.customization.toppings?.length > 0 && (
                          <p>Toppings: {item.customization.toppings.map((t: any) => t.name).join(', ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="font-medium">
                    {formatCurrency((item.finalPrice || item.menuItem.price) * item.quantity)}
                  </span>
                </div>
              ))}
              
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (HST):</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(totals.delivery)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <Button onClick={() => setStep('delivery')} className="w-full mt-4">
                Continue to Delivery Details
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'delivery' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Address *</label>
                <textarea
                  className="w-full p-3 border rounded-md"
                  rows={3}
                  placeholder="Enter your complete delivery address..."
                  value={orderData.deliveryAddress}
                  onChange={(e) => setOrderData({...orderData, deliveryAddress: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Special Instructions</label>
                <textarea
                  className="w-full p-3 border rounded-md"
                  rows={2}
                  placeholder="Any special instructions for the restaurant or delivery..."
                  value={orderData.specialInstructions}
                  onChange={(e) => setOrderData({...orderData, specialInstructions: e.target.value})}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('cart')}>
                  Back to Cart
                </Button>
                <Button 
                  onClick={async () => {
                    setStep('payment');
                    await createPaymentIntent();
                  }} 
                  className="flex-1"
                  disabled={!orderData.deliveryAddress.trim()}
                >
                  Continue to Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment & Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Add Tip</label>
                <div className="flex gap-2 mb-3">
                  {[0, 3, 5, 8].map(tip => (
                    <Button
                      key={tip}
                      variant={orderData.tipAmount === tip ? "default" : "outline"}
                      onClick={() => setOrderData({...orderData, tipAmount: tip})}
                      className="flex-1"
                    >
                      {tip === 0 ? 'No Tip' : `$${tip}`}
                    </Button>
                  ))}
                </div>
                <input
                  type="number"
                  className="w-full p-3 border rounded-md"
                  placeholder="Custom tip amount"
                  value={orderData.tipAmount || ''}
                  onChange={(e) => setOrderData({...orderData, tipAmount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <h4 className="font-medium">Order Summary</h4>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (HST):</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery:</span>
                  <span>{formatCurrency(totals.delivery)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tip:</span>
                  <span>{formatCurrency(totals.tip)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{paymentError}</p>
                </div>
              )}

              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    isProcessing={isProcessingPayment}
                    setIsProcessing={setIsProcessingPayment}
                    totalAmount={totals.total}
                  />
                </Elements>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-gray-600">Initializing payment...</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('delivery')}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'confirmation' && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
              <p className="text-gray-600 mb-4">
                Your order has been sent to the restaurant and you'll receive updates as it's prepared.
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push(`/menu/${restaurantId}`)} className="w-full">
                  Continue Shopping
                </Button>
                <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}