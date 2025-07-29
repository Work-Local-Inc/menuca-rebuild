export interface OrderTrendData {
  date: Date;
  order_count: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
}

export interface CustomerPreferenceData {
  customer_id: string;
  customer_email: string;
  total_orders: number;
  total_spent: number;
  favorite_cuisine: string;
  preferred_order_time: string;
  last_order_date: Date;
  avg_order_value: number;
}

export interface RestaurantPerformance {
  restaurant_id: string;
  restaurant_name: string;
  total_orders: number;
  total_revenue: number;
  commission_earned: number;
  growth_rate: number;
  customer_satisfaction: number;
}

export interface MenuItemPerformance {
  item_id: string;
  item_name: string;
  category: string;
  total_orders: number;
  total_revenue: number;
  profit_margin: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface FinancialInsights {
  period_start: Date;
  period_end: Date;
  total_gross_revenue: number;
  total_commission_earned: number;
  total_orders: number;
  average_order_value: number;
  top_performing_restaurants: RestaurantPerformance[];
  revenue_by_day: OrderTrendData[];
  commission_breakdown: CommissionBreakdown[];
}

export interface CommissionBreakdown {
  transaction_type: string;
  count: number;
  total_amount: number;
  percentage_of_total: number;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  customerId?: string;
  menuCategory?: string;
  orderStatus?: string;
}

export class MockAnalyticsService {
  // Generate mock order trends
  async getOrderTrends(tenantId: string, filters: AnalyticsFilters = {}): Promise<OrderTrendData[]> {
    const days = 30;
    const trends: OrderTrendData[] = [];
    const baseDate = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      const orderCount = Math.floor(Math.random() * 50) + 20;
      const avgOrderValue = Math.random() * 30 + 25;
      const totalRevenue = orderCount * avgOrderValue;
      
      trends.push({
        date,
        order_count: orderCount,
        total_revenue: totalRevenue,
        average_order_value: avgOrderValue,
        unique_customers: Math.floor(orderCount * 0.8)
      });
    }
    
    return trends;
  }

  // Generate mock customer preferences
  async getCustomerPreferences(tenantId: string, filters: AnalyticsFilters = {}): Promise<CustomerPreferenceData[]> {
    const cuisines = ['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean'];
    const customers: CustomerPreferenceData[] = [];
    
    for (let i = 0; i < 10; i++) {
      customers.push({
        customer_id: `customer-${i}`,
        customer_email: `customer${i}@example.com`,
        total_orders: Math.floor(Math.random() * 20) + 5,
        total_spent: Math.random() * 500 + 100,
        favorite_cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
        preferred_order_time: `${Math.floor(Math.random() * 12) + 11}:00`,
        last_order_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        avg_order_value: Math.random() * 40 + 20
      });
    }
    
    return customers.sort((a, b) => b.total_spent - a.total_spent);
  }

  // Generate mock menu item performance
  async getMenuItemPerformance(tenantId: string, restaurantId: string, filters: AnalyticsFilters = {}): Promise<MenuItemPerformance[]> {
    const menuItems = [
      'Margherita Pizza', 'Caesar Salad', 'Chicken Burger', 'Pasta Carbonara', 'Fish & Chips',
      'Veggie Wrap', 'Steak Dinner', 'Chicken Wings', 'Greek Salad', 'BBQ Ribs'
    ];
    
    const categories = ['Pizza', 'Salads', 'Burgers', 'Pasta', 'Seafood', 'Wraps', 'Steaks', 'Appetizers'];
    const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
    
    return menuItems.map((item, index) => ({
      item_id: `item-${index}`,
      item_name: item,
      category: categories[Math.floor(Math.random() * categories.length)],
      total_orders: Math.floor(Math.random() * 100) + 10,
      total_revenue: Math.random() * 1000 + 200,
      profit_margin: Math.random() * 40 + 10,
      trend_direction: trends[Math.floor(Math.random() * trends.length)]
    })).sort((a, b) => b.total_revenue - a.total_revenue);
  }

  // Generate mock financial insights
  async getFinancialInsights(tenantId: string, filters: AnalyticsFilters = {}): Promise<FinancialInsights> {
    const orderTrends = await this.getOrderTrends(tenantId, filters);
    const restaurants = await this.getRestaurantPerformance(tenantId, filters);
    
    const totalRevenue = orderTrends.reduce((sum, day) => sum + day.total_revenue, 0);
    const totalOrders = orderTrends.reduce((sum, day) => sum + day.order_count, 0);
    
    return {
      period_start: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      period_end: filters.endDate || new Date(),
      total_gross_revenue: totalRevenue,
      total_commission_earned: totalRevenue * 0.15,
      total_orders: totalOrders,
      average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      top_performing_restaurants: restaurants,
      revenue_by_day: orderTrends,
      commission_breakdown: [
        { transaction_type: 'order', count: totalOrders, total_amount: totalRevenue * 0.10, percentage_of_total: 67 },
        { transaction_type: 'delivery', count: Math.floor(totalOrders * 0.8), total_amount: totalRevenue * 0.03, percentage_of_total: 20 },
        { transaction_type: 'service', count: Math.floor(totalOrders * 0.3), total_amount: totalRevenue * 0.02, percentage_of_total: 13 }
      ]
    };
  }

  // Generate mock restaurant performance
  private async getRestaurantPerformance(tenantId: string, filters: AnalyticsFilters): Promise<RestaurantPerformance[]> {
    const restaurants = [
      'Mario\'s Italian Kitchen', 'Taco Loco', 'Dragon Palace', 'The Burger Joint', 'Cafe Mediterranean'
    ];
    
    return restaurants.map((name, index) => ({
      restaurant_id: `restaurant-${index}`,
      restaurant_name: name,
      total_orders: Math.floor(Math.random() * 200) + 50,
      total_revenue: Math.random() * 5000 + 1000,
      commission_earned: Math.random() * 750 + 150,
      growth_rate: (Math.random() - 0.5) * 40,
      customer_satisfaction: Math.random() * 1.5 + 3.5
    })).sort((a, b) => b.total_revenue - a.total_revenue);
  }

  // Generate mock analytics summary
  async getAnalyticsSummary(tenantId: string): Promise<any> {
    const defaultFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    };

    const [orderTrends, customerPrefs, financialInsights] = await Promise.all([
      this.getOrderTrends(tenantId, defaultFilters),
      this.getCustomerPreferences(tenantId, defaultFilters),
      this.getFinancialInsights(tenantId, defaultFilters)
    ]);

    return {
      summary: {
        total_orders: financialInsights.total_orders,
        total_revenue: financialInsights.total_gross_revenue,
        total_customers: customerPrefs.length,
        avg_order_value: financialInsights.average_order_value
      },
      trends: orderTrends.slice(-7),
      top_customers: customerPrefs.slice(0, 5),
      recent_performance: financialInsights.top_performing_restaurants.slice(0, 5)
    };
  }

  // Mock cache invalidation
  async invalidateCache(tenantId: string, pattern?: string): Promise<void> {
    console.log(`Mock: Would invalidate cache for tenant ${tenantId} with pattern ${pattern || 'all'}`);
  }
}

export const mockAnalyticsService = new MockAnalyticsService();