import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  id: string;
  restaurantId: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  specialInstructions?: string;
}

interface Cart {
  userId: string;
  tenantId: string;
  restaurantId?: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface CheckoutFlowProps {
  onOrderComplete?: (orderId: string) => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ onOrderComplete }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'confirmation'>('cart');
  const [orderData, setOrderData] = useState({
    deliveryAddress: '',
    specialInstructions: '',
    tipAmount: 0
  });
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCart();
    }
  }, [user, isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping cart fetch');
      return;
    }

    try {
      const response = await fetch(`/api/v1/cart`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id
        }
      });

      if (response.ok) {
        const data = await response.json() as { data: Cart };
        if (data.data) {
          setCart(data.data);
        }
      } else if (response.status === 401) {
        console.error('Authentication failed - user needs to login');
      } else {
        console.error('Failed to fetch cart:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, tax: 0, delivery: 0, tip: 0, total: 0 };
    
    const subtotal = cart.subtotal;
    const tax = subtotal * 0.0825; // 8.25% tax
    const delivery = 2.99;
    const tip = orderData.tipAmount;
    const total = subtotal + tax + delivery + tip;

    return { subtotal, tax, delivery, tip, total };
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0 || !isAuthenticated || !user) return;

    setLoading(true);
    try {
      // Prepare order items
      const items = cart.items.map(item => ({
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: Math.round(item.menuItemPrice * 100), // Convert to cents
        special_instructions: item.specialInstructions
      }));

      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id
        },
        body: JSON.stringify({
          customer_id: user.id,
          restaurant_id: cart.restaurantId,
          items,
          delivery_address: orderData.deliveryAddress,
          special_instructions: orderData.specialInstructions,
          tip_amount: Math.round(orderData.tipAmount * 100) // Convert to cents
        })
      });

      if (response.ok) {
        const orderResult = await response.json() as { data: { id: string } };
        if (orderResult.data?.id) {
          setCompletedOrderId(orderResult.data.id);
          setStep('confirmation');
          
          // Clear cart after successful order
          await clearCart();
          
          if (onOrderComplete) {
            onOrderComplete(orderResult.data.id);
          }
        }
      } else if (response.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        const errorData = await response.json();
        console.error('Failed to place order:', errorData);
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await fetch(`/api/v1/cart/clear`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id
        }
      });

      if (!response.ok && response.status !== 401) {
        console.error('Failed to clear cart:', response.statusText);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-600 text-center">You must be logged in to view your cart and checkout.</p>
        </CardContent>
      </Card>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 text-center">Add some delicious items to get started!</p>
        </CardContent>
      </Card>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
              Review Your Order ({cart.itemCount} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start border-b pb-3">
                <div className="flex-1">
                  <h4 className="font-medium">{item.quantity}x {item.menuItemName}</h4>
                  {item.specialInstructions && (
                    <p className="text-sm text-gray-600 mt-1">Note: {item.specialInstructions}</p>
                  )}
                </div>
                <span className="font-medium">{formatCurrency(item.menuItemPrice * item.quantity)}</span>
              </div>
            ))}
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
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
                onClick={() => setStep('payment')} 
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
                {[0, 2, 3, 5].map(tip => (
                  <Button
                    key={tip}
                    variant={orderData.tipAmount === tip ? "primary" : "outline"}
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
                <span>Tax:</span>
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('delivery')}>
                Back
              </Button>
              <Button 
                onClick={handlePlaceOrder} 
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Placing Order...' : `Place Order - ${formatCurrency(totals.total)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirmation' && completedOrderId && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your order has been sent to the restaurant and you'll receive updates as it's prepared.
            </p>
            <Badge variant="outline" className="mb-6">
              Order ID: {completedOrderId.slice(0, 8)}...
            </Badge>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = '/orders'} className="w-full">
                View Order Status
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};