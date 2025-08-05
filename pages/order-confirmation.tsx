import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TempNavigation } from '@/components/TempNavigation';
import { CheckCircle, Clock, MapPin, Phone, User, ArrowRight } from 'lucide-react';

interface Order {
  id: string;
  restaurantId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    deliveryInstructions: string;
  };
  items: Array<{
    menuItem: {
      id: string;
      name: string;
      description?: string;
      price: number;
      preparation_time: number;
      allergens: string[];
    };
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: string;
  estimatedPrepTime: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { orderId, restaurantId } = router.query;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId && restaurantId) {
      loadOrder();
    }
  }, [orderId, restaurantId]);

  const loadOrder = () => {
    try {
      if (typeof window === 'undefined') return; // Ensure localStorage is only accessed on client-side
      const orders = JSON.parse(localStorage.getItem(`orders_${restaurantId}`) || '[]');
      const foundOrder = orders.find((o: Order) => o.id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        alert('Order not found. Redirecting to menu...');
        router.push('/order');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Error loading order. Redirecting to menu...');
      router.push('/order');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEstimatedDeliveryTime = () => {
    if (!order) return '';
    const orderTime = new Date(order.createdAt);
    const deliveryTime = new Date(orderTime.getTime() + (order.estimatedPrepTime + 15) * 60000); // prep time + 15 min delivery
    return deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <TempNavigation />
        <div className="max-w-md mx-auto text-center py-16">
          <h2 className="text-xl font-semibold mb-4">Loading order...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <TempNavigation />
        <div className="max-w-md mx-auto text-center py-16">
          <h2 className="text-xl font-semibold mb-4">Order not found</h2>
          <Button onClick={() => router.push('/order')}>
            Return to Ordering
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <TempNavigation />
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Your order has been placed successfully and the restaurant has been notified.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Order Number</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded">{order.id}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Order Status</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Order Time</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Estimated Delivery</span>
                </div>
                <span className="font-semibold text-blue-800">{getEstimatedDeliveryTime()}</span>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="font-medium border-b pb-2">Items Ordered</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.menuItem.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.menuItem.allergens.length > 0 && (
                        <p className="text-xs text-orange-600">
                          Contains: {item.menuItem.allergens.join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-600">{order.customer.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-gray-500 mt-1" />
                  <p>{order.customer.phone}</p>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p>{order.customer.address.street}</p>
                    <p>{order.customer.address.city}, {order.customer.address.state} {order.customer.address.zipCode}</p>
                  </div>
                </div>

                {order.customer.deliveryInstructions && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery Instructions:</p>
                    <p className="text-sm text-gray-600">{order.customer.deliveryInstructions}</p>
                  </div>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-medium text-green-800 mb-2">What happens next?</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Restaurant is preparing your order</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>Driver will pick up your order</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>Order delivered to your address</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button 
            variant="outline"
            onClick={() => router.push('/order')}
            className="flex items-center gap-2"
          >
            Order Again
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => {
              alert('Order tracking coming soon! For now, your order is being prepared.');
            }}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Track Order Status
          </Button>
        </div>
      </div>
    </div>
  );
}