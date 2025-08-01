import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, Truck, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  total_price: number;
  special_instructions?: string;
  menu_item_name?: string;
  menu_item_description?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  tip_amount: number;
  delivery_address?: any;
  special_instructions?: string;
  estimated_delivery_time?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface OrderSummary {
  total_active: number;
  confirmed: number;
  preparing: number;
  ready: number;
  out_for_delivery: number;
}

const ORDER_STATUS_CONFIG = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock,
    nextStatus: 'confirmed' 
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle,
    nextStatus: 'preparing' 
  },
  preparing: { 
    label: 'Preparing', 
    color: 'bg-orange-100 text-orange-800', 
    icon: Package,
    nextStatus: 'ready' 
  },
  ready: { 
    label: 'Ready', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle,
    nextStatus: 'out_for_delivery' 
  },
  out_for_delivery: { 
    label: 'Out for Delivery', 
    color: 'bg-purple-100 text-purple-800', 
    icon: Truck,
    nextStatus: 'delivered' 
  },
  delivered: { 
    label: 'Delivered', 
    color: 'bg-gray-100 text-gray-800', 
    icon: CheckCircle,
    nextStatus: null 
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800', 
    icon: AlertCircle,
    nextStatus: null 
  }
};

interface OrderManagementProps {
  restaurantId: string;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ restaurantId }) => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchActiveOrders = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping order fetch');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/orders/restaurant/${restaurantId}/active`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setOrders(data.data.orders || []);
          setSummary(data.data.summary || null);
          setLastUpdated(new Date());
        }
      } else if (response.status === 401) {
        console.error('Authentication failed for active orders');
      } else {
        console.error('Failed to fetch active orders:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!isAuthenticated || !user) {
      alert('You must be logged in to update order status');
      return;
    }

    try {
      const response = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
              : order
          )
        );

        // If order is now delivered or cancelled, remove from active list
        if (newStatus === 'delivered' || newStatus === 'cancelled') {
          setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        }

        // Refresh summary
        fetchActiveOrders();
      } else if (response.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        const errorData = await response.json();
        console.error('Failed to update order status:', errorData);
        alert('Failed to update order status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    
    // Auto-refresh every 30 seconds if authenticated
    let interval: NodeJS.Timeout;
    if (isAuthenticated && user) {
      interval = setInterval(fetchActiveOrders, 30000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [restaurantId, isAuthenticated, user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceOrder = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    }
  };

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Please log in to manage orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <Button onClick={fetchActiveOrders} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.confirmed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preparing</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.preparing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.ready}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{summary.out_for_delivery}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Orders */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Orders</h2>
        
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No active orders</p>
            </CardContent>
          </Card>
        )}

        {!loading && orders.map((order) => {
          const statusConfig = ORDER_STATUS_CONFIG[order.status];
          const StatusIcon = statusConfig.icon;
          
          return (
            <Card key={order.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                      <p className="text-sm text-gray-500">
                        {formatTime(order.created_at)} • {getTimeSinceOrder(order.created_at)}
                      </p>
                    </div>
                    
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{formatCurrency(order.total_amount)}</span>
                    {statusConfig.nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, statusConfig.nextStatus!)}
                        className="ml-2"
                      >
                        Mark as {ORDER_STATUS_CONFIG[statusConfig.nextStatus as keyof typeof ORDER_STATUS_CONFIG].label}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium">{item.quantity}x {item.menu_item_name}</span>
                            {item.special_instructions && (
                              <p className="text-sm text-orange-600 mt-1">
                                Note: {item.special_instructions}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.special_instructions && (
                    <div>
                      <h4 className="font-medium mb-1">Special Instructions:</h4>
                      <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                        {order.special_instructions}
                      </p>
                    </div>
                  )}

                  {/* Delivery Address */}
                  {order.delivery_address && (
                    <div>
                      <h4 className="font-medium mb-1">Delivery Address:</h4>
                      <p className="text-sm text-gray-700">
                        {typeof order.delivery_address === 'string' 
                          ? order.delivery_address 
                          : JSON.stringify(order.delivery_address)
                        }
                      </p>
                    </div>
                  )}

                  {/* Order Totals */}
                  <div className="border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(order.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(order.delivery_fee)}</span>
                    </div>
                    {order.tip_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Tip:</span>
                        <span>{formatCurrency(order.tip_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-1">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};