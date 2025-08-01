import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TempNavigation } from '@/components/TempNavigation';
import { StripeProvider } from '@/components/providers/StripeProvider';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { ArrowLeft, CreditCard, MapPin, Phone, User, Clock } from 'lucide-react';

// TypeScript declaration for Canada Post Address Complete
declare global {
  interface Window {
    pca: any;
  }
}

interface CartItem {
  menuItem: {
    id: string;
    name: string;
    description?: string;
    price: number;
    preparation_time: number;
    allergens: string[];
  };
  quantity: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  deliveryInstructions: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { restaurantId } = router.query;
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    },
    deliveryInstructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'info' | 'payment'>('info');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [addressApiError, setAddressApiError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure localStorage is only accessed on client-side

    // Get cart data from sessionStorage (passed from menu page)
    const cartData = sessionStorage.getItem('checkout_cart');
    const restaurantIdFromSession = sessionStorage.getItem('checkout_restaurant');
    
    if (cartData && restaurantIdFromSession) {
      setCart(JSON.parse(cartData));
      if (!restaurantId) {
        router.replace(`/checkout?restaurantId=${restaurantIdFromSession}`);
      }
    } else {
      // No cart data, redirect back to ordering
      alert('No items in cart. Redirecting to menu...');
      router.push('/order');
    }
  }, [router, restaurantId]);

  // Initialize Canada Post Address Complete
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initializeAddressComplete = () => {
      if (window.pca && addressInputRef.current) {
        try {
          const apiKey = process.env.NEXT_PUBLIC_CANADA_POST_API_KEY;
          
          if (!apiKey) {
            console.warn('Canada Post API key not configured');
            setAddressApiError('Address suggestions temporarily unavailable. Please enter your address manually.');
            return;
          }
          
          const options = {
            key: apiKey,
            container: addressInputRef.current,
            countries: {
              codesList: 'CAN'
            },
            style: {
              cssClass: 'border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
            }
          };

          const control = new window.pca.Address(options);
          
          // Success callback - address selected
          control.listen('populate', (address: any) => {
            console.log('Canada Post address selected:', address);
            setAddressApiError(null); // Clear any previous errors
            setCustomerInfo(prev => ({
              ...prev,
              address: {
                street: `${address.Line1}${address.Line2 ? ', ' + address.Line2 : ''}`,
                city: address.City,
                province: address.ProvinceCode || address.Province,
                postalCode: address.PostalCode
              }
            }));
          });

          // Error handling
          control.listen('error', (error: any) => {
            console.error('Canada Post API error:', error);
            setAddressApiError('Address suggestions temporarily unavailable. Please enter your address manually.');
          });

          console.log('Canada Post Address Complete initialized successfully');
          
        } catch (error) {
          console.error('Failed to initialize Canada Post Address Complete:', error);
          setAddressApiError('Address suggestions temporarily unavailable. Please enter your address manually.');
        }
      } else {
        setAddressApiError('Address suggestions temporarily unavailable. Please enter your address manually.');
      }
    };

    // Wait for the script to load
    if (window.pca) {
      initializeAddressComplete();
    } else {
      window.addEventListener('pcaLoad', initializeAddressComplete);
      return () => window.removeEventListener('pcaLoad', initializeAddressComplete);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, cartItem) => {
      return total + (cartItem.menuItem.price * cartItem.quantity);
    }, 0);
  };

  const getTotalPrepTime = (): number => {
    return Math.max(...cart.map(item => item.menuItem.preparation_time));
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomerInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CustomerInfo],
          [child]: value
        }
      }));
    } else {
      setCustomerInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Calculate total in cents for Stripe
      const totalAmount = Math.round((getCartTotal() + (getCartTotal() * 0.13) + 2.99) * 100);

      // Create payment intent with backend API
      const response = await fetch('/api/payments/intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add proper JWT authentication header
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'cad',
          orderId: `ORD-${Date.now()}`,
          metadata: {
            restaurantId: restaurantId as string,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { data } = await response.json();
      setClientSecret(data.client_secret);
      setPaymentStep('payment');
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Error preparing payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Generate order ID
      const orderId = `ORD-${Date.now()}`;
      
      // Create order object with payment info
      const order = {
        id: orderId,
        restaurantId: restaurantId,
        customer: customerInfo,
        items: cart,
        subtotal: getCartTotal(),
        tax: getCartTotal() * 0.13,
        deliveryFee: 2.99,
        total: getCartTotal() + (getCartTotal() * 0.13) + 2.99,
        status: 'paid',
        paymentIntentId: paymentIntentId,
        estimatedPrepTime: getTotalPrepTime(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store order (will be replaced with backend API later)
      const existingOrders = JSON.parse(localStorage.getItem(`orders_${restaurantId}`) || '[]');
      existingOrders.push(order);
      localStorage.setItem(`orders_${restaurantId}`, JSON.stringify(existingOrders));

      // Clear cart
      sessionStorage.removeItem('checkout_cart');
      sessionStorage.removeItem('checkout_restaurant');

      // Redirect to confirmation
      router.push(`/order-confirmation?orderId=${orderId}&restaurantId=${restaurantId}`);
      
    } catch (error) {
      console.error('Error processing successful payment:', error);
      alert('Payment succeeded but there was an error processing your order. Please contact support.');
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <TempNavigation />
        <div className="max-w-md mx-auto text-center py-16">
          <h2 className="text-xl font-semibold mb-4">Loading cart...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - MenuCA</title>
        <script 
          src="https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/js/addresscomplete-2.10.min.js"
          onLoad={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('pcaLoad'));
            }
          }}
        />
      </Head>
      
      <StripeProvider clientSecret={clientSecret || undefined}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto p-6">
        <TempNavigation />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Menu
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛒 Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((cartItem, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <h4 className="font-medium">{cartItem.menuItem.name}</h4>
                    {cartItem.menuItem.description && (
                      <p className="text-sm text-gray-600">{cartItem.menuItem.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">Qty: {cartItem.quantity}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{cartItem.menuItem.preparation_time} min</span>
                    </div>
                    {cartItem.menuItem.allergens.length > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Contains: {cartItem.menuItem.allergens.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(cartItem.menuItem.price * cartItem.quantity)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(cartItem.menuItem.price)} each</p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>HST (13%)</span>
                  <span>{formatCurrency(getCartTotal() * 0.13)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(2.99)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(getCartTotal() + (getCartTotal() * 0.13) + 2.99)}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Estimated prep time: {getTotalPrepTime()} minutes
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Conditional Rendering: Customer Information Form or Payment Form */}
          {paymentStep === 'info' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <Input
                        value={customerInfo.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <Input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        placeholder="(416) 555-0123"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="john@example.ca"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <Input
                      ref={addressInputRef}
                      value={customerInfo.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      required
                      placeholder="Start typing your address for suggestions..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      🍁 Start typing for Canada Post address suggestions
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <Input
                        value={customerInfo.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        required
                        placeholder="Toronto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Province</label>
                      <Input
                        value={customerInfo.address.province}
                        onChange={(e) => handleInputChange('address.province', e.target.value)}
                        required
                        placeholder="ON"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Postal Code</label>
                      <Input
                        value={customerInfo.address.postalCode}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        required
                        placeholder="M5V 3A8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <Input
                      ref={addressInputRef}
                      value={customerInfo.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      required
                      placeholder={addressApiError ? "Enter your address manually" : "Start typing your address for suggestions..."}
                      className={addressApiError ? "border-yellow-300" : ""}
                    />
                    {addressApiError ? (
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        ⚠️ {addressApiError}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        🍁 Start typing for Canada Post address suggestions
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <Input
                        value={customerInfo.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        required
                        placeholder="Toronto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Province</label>
                      <Input
                        value={customerInfo.address.province}
                        onChange={(e) => handleInputChange('address.province', e.target.value)}
                        required
                        placeholder="ON"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Postal Code</label>
                      <Input
                        value={customerInfo.address.postalCode}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        required
                        placeholder="M5V 3A8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Instructions (Optional)</label>
                    <Input
                      value={customerInfo.deliveryInstructions}
                      onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
                      placeholder="Buzzer #123, leave with concierge, etc."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Processing Payment Intent...'
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Continue to Payment - {formatCurrency(getCartTotal() + (getCartTotal() * 0.13) + 2.99)}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <PaymentForm
              amount={getCartTotal() + (getCartTotal() * 0.13) + 2.99}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              customerInfo={customerInfo}
            />
          )}
        </div>
        </div>
        </div>
      </StripeProvider>
    </>
  );
}