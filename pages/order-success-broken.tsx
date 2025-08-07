import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Package, Clock, MapPin } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  orderNumber: string;
  paymentIntentId: string;
  total: number;
  items: OrderItem[];
  customerEmail?: string;
  deliveryAddress?: string;
  timestamp: string;
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get order details from URL parameters and sessionStorage
    const { payment_intent, payment_intent_client_secret } = router.query;
    
    if (payment_intent) {
      // Try to get order details from sessionStorage first
      const storedOrder = sessionStorage.getItem('completed_order');
      const storedCart = sessionStorage.getItem('checkout_cart');
      
      let orderData: OrderDetails;
      
      if (storedOrder) {
        const parsed = JSON.parse(storedOrder);
        orderData = {
          orderNumber: (payment_intent as string).slice(-8).toUpperCase(),
          paymentIntentId: payment_intent as string,
          total: parsed.total || 0,
          items: parsed.items?.map((item: any) => ({
            name: item.menuItem?.name || item.name || 'Unknown Item',
            quantity: item.quantity || 1,
            price: item.finalPrice || item.menuItem?.price || item.price || 0
          })) || [],
          timestamp: parsed.timestamp || new Date().toISOString()
        };
      } else if (storedCart) {
        // Reconstruct from cart data
        const cart = JSON.parse(storedCart);
        const subtotal = cart.reduce((total: number, item: any) => {
          const price = item.finalPrice || item.menuItem?.price || item.price || 0;
          return total + (price * item.quantity);
        }, 0);
        
        orderData = {
          orderNumber: (payment_intent as string).slice(-8).toUpperCase(),
          paymentIntentId: payment_intent as string,
          total: subtotal + (subtotal * 0.13) + 2.99, // Add tax and delivery
          items: cart.map((item: any) => ({
            name: item.menuItem?.name || item.name || 'Unknown Item',
            quantity: item.quantity || 1,
            price: item.finalPrice || item.menuItem?.price || item.price || 0
          })),
          timestamp: new Date().toISOString()
        };
      } else {
        // Minimal fallback
        orderData = {
          orderNumber: (payment_intent as string).slice(-8).toUpperCase(),
          paymentIntentId: payment_intent as string,
          total: 0,
          items: [],
          timestamp: new Date().toISOString()
        };
      }
      
      setOrderDetails(orderData);
      
      // Clear the stored data
      sessionStorage.removeItem('completed_order');
      sessionStorage.removeItem('checkout_cart');
      sessionStorage.removeItem('checkout_restaurant');
    } else {
      // No payment intent - redirect to home
      router.push('/');
      return;
    }
    
    setLoading(false);
  }, [router.query, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-4">Processing your order...</h2>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto text-center py-16">
          <h2 className="text-xl font-semibold mb-4">Order not found</h2>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TempNavigation />
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="text-center">
          <CardContent className="py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-4">
              🎉 Payment successful - Your delicious food is on the way!
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-green-800">Order Number</p>
                  <p className="text-xl font-bold text-green-900 font-mono">#{orderDetails.orderNumber}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-green-800">Total Paid</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(orderDetails.total)}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Order placed on {formatDate(orderDetails.timestamp)}
            </p>
          </CardContent>
        </Card>

        {/* Order Details */}
        {orderDetails.items.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Your Order
              </h2>
              
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-900">
                        {item.quantity}x {item.name}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(orderDetails.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Update */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              What's Next?
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Payment Confirmed ✅</p>
                  <p className="text-sm text-gray-600">Your payment has been processed successfully</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Restaurant Preparing 👨‍🍳</p>
                  <p className="text-sm text-gray-600">Your order has been sent to the kitchen</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-500">Out for Delivery 🚗</p>
                  <p className="text-sm text-gray-500">We'll notify you when your order is on the way</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/restaurant/xtreme-pizza-checkout')}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
          >
            Order Again from Xtreme Pizza
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="w-full"
            size="lg"
          >
            Browse Other Restaurants
          </Button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-xs text-amber-800">
                <strong>Debug Info:</strong> Payment Intent: {orderDetails.paymentIntentId?.slice(0, 20)}...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}