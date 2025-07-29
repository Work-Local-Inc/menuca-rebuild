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
export interface MenuItemPerformance {
    item_id: string;
    item_name: string;
    category: string;
    total_orders: number;
    total_revenue: number;
    avg_rating?: number;
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
export interface RestaurantPerformance {
    restaurant_id: string;
    restaurant_name: string;
    total_orders: number;
    total_revenue: number;
    commission_earned: number;
    growth_rate: number;
    customer_satisfaction: number;
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
export declare class AnalyticsService {
    private pool;
    private readonly CACHE_TTL;
    private readonly CACHE_PREFIX;
    constructor();
    getOrderTrends(tenantId: string, filters?: AnalyticsFilters): Promise<OrderTrendData[]>;
    getCustomerPreferences(tenantId: string, filters?: AnalyticsFilters): Promise<CustomerPreferenceData[]>;
    getMenuItemPerformance(tenantId: string, restaurantId: string, filters?: AnalyticsFilters): Promise<MenuItemPerformance[]>;
    getFinancialInsights(tenantId: string, filters?: AnalyticsFilters): Promise<FinancialInsights>;
    private getRestaurantPerformance;
    private getCommissionBreakdown;
    invalidateCache(tenantId: string, pattern?: string): Promise<void>;
    getAnalyticsSummary(tenantId: string): Promise<any>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=AnalyticsService.d.ts.map