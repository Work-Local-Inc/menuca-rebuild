import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Star } from 'lucide-react';

interface AnalyticsSummary {
  summary: {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    avg_order_value: number;
  };
  trends: OrderTrendData[];
  top_customers: CustomerPreferenceData[];
  recent_performance: RestaurantPerformance[];
}

interface OrderTrendData {
  date: Date;
  order_count: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
}

interface CustomerPreferenceData {
  customer_id: string;
  customer_email: string;
  total_orders: number;
  total_spent: number;
  favorite_cuisine: string;
  preferred_order_time: string;
  last_order_date: Date;
  avg_order_value: number;
}

interface RestaurantPerformance {
  restaurant_id: string;
  restaurant_name: string;
  total_orders: number;
  total_revenue: number;
  commission_earned: number;
  growth_rate: number;
  customer_satisfaction: number;
}

interface MenuItemPerformance {
  item_id: string;
  item_name: string;
  category: string;
  total_orders: number;
  total_revenue: number;
  profit_margin: number;
  trend_direction: 'up' | 'down' | 'stable';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [orderTrends, setOrderTrends] = useState<OrderTrendData[]>([]);
  const [menuPerformance, setMenuPerformance] = useState<MenuItemPerformance[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-tenant-id': 'default-tenant'
      };

      // Fetch dashboard summary
      const summaryResponse = await fetch('/api/v1/analytics/dashboard/summary', { headers });
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.data);
      }

      // Fetch order trends
      const trendsParams = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        ...(selectedRestaurant !== 'all' && { restaurantId: selectedRestaurant })
      });
      
      const trendsResponse = await fetch(`/api/v1/analytics/orders/trends?${trendsParams}`, { headers });
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        setOrderTrends(trendsData.data.trends);
      }

      // Fetch menu performance (if restaurant selected)
      if (selectedRestaurant !== 'all') {
        const menuParams = new URLSearchParams({
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString()
        });
        
        const menuResponse = await fetch(
          `/api/v1/analytics/restaurants/${selectedRestaurant}/menu/performance?${menuParams}`,
          { headers }
        );
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuPerformance(menuData.data.items);
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedRestaurant]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {summary.recent_performance.map((restaurant) => (
                <SelectItem key={restaurant.restaurant_id} value={restaurant.restaurant_id}>
                  {restaurant.restaurant_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalyticsData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.summary.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.summary.total_orders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.summary.total_customers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.summary.avg_order_value)}</div>
            <p className="text-xs text-muted-foreground">+5.7% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={orderTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#0088FE" 
                  fill="#0088FE" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value, 'Orders']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Bar dataKey="order_count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.top_customers.map((customer, index) => (
                <div key={customer.customer_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.customer_email}</p>
                      <p className="text-xs text-gray-500">{customer.total_orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(customer.total_spent)}</p>
                    <Badge variant="outline" className="text-xs">
                      {customer.favorite_cuisine}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recent_performance.map((restaurant) => (
                <div key={restaurant.restaurant_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{restaurant.restaurant_name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{restaurant.total_orders} orders</span>
                      <span>•</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 mr-1" />
                        {restaurant.customer_satisfaction.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(restaurant.total_revenue)}</p>
                    <div className="flex items-center text-xs">
                      {restaurant.growth_rate >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={restaurant.growth_rate >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(restaurant.growth_rate).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu Performance (if restaurant selected) */}
        {selectedRestaurant !== 'all' && menuPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Menu Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuPerformance.slice(0, 5).map((item) => (
                  <div key={item.item_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.item_name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.total_orders} orders</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(item.total_revenue)}</p>
                      <div className="flex items-center text-xs">
                        {item.trend_direction === 'up' && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                        {item.trend_direction === 'down' && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                        <span>{item.profit_margin.toFixed(1)}% margin</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};