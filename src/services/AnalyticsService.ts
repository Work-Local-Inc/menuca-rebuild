import db from '@/database/connection';
import redis from '@/cache/redis';
import winston from 'winston';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

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

// Advanced Analytics Interfaces
export interface AnalyticsMetric {
  id: string;
  name: string;
  category: AnalyticsCategory;
  value: number;
  previousValue?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
  metadata?: any;
}

export enum AnalyticsCategory {
  REVENUE = 'revenue',
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  CAMPAIGNS = 'campaigns',
  RESTAURANTS = 'restaurants',
  SUPPORT = 'support',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

export interface KPITarget {
  metricId: string;
  targetValue: number;
  thresholdType: 'minimum' | 'maximum' | 'range';
  alertEnabled: boolean;
  alertThreshold: number;
}

export interface AnalyticsInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  category: AnalyticsCategory;
  confidence: number; // 0-100
  actionable: boolean;
  recommendations: string[];
  relatedMetrics: string[];
  generatedAt: Date;
  expiresAt?: Date;
}

export enum InsightType {
  TREND_ANOMALY = 'trend_anomaly',
  PERFORMANCE_DECLINE = 'performance_decline',
  GROWTH_OPPORTUNITY = 'growth_opportunity',
  EFFICIENCY_IMPROVEMENT = 'efficiency_improvement',
  RISK_DETECTION = 'risk_detection',
  SEASONAL_PATTERN = 'seasonal_pattern',
  COMPETITIVE_INTELLIGENCE = 'competitive_intelligence'
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  status: 'active' | 'paused' | 'completed';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cost: number;
    roi: number;
    ctr: number; // Click-through rate
    cpc: number; // Cost per click
    cpa: number; // Cost per acquisition
  };
  performance: {
    reach: number;
    engagement: number;
    brandLift: number;
    customerLifetimeValue: number;
  };
  segmentation: {
    demographics: any;
    geographic: any;
    behavioral: any;
  };
  timeSeriesData: Array<{
    timestamp: Date;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

export interface BusinessIntelligenceDashboard {
  tenantId: string;
  dashboardId: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number; // minutes
  lastUpdated: Date;
  isRealTime: boolean;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  dataSource: string;
  refreshRate: number; // seconds
}

export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  METRIC_CARD = 'metric_card',
  TABLE = 'table',
  HEATMAP = 'heatmap',
  GAUGE = 'gauge',
  FUNNEL = 'funnel',
  GEOGRAPHIC_MAP = 'geographic_map',
  REAL_TIME_FEED = 'real_time_feed'
}

export interface AnalyticsReport {
  id: string;
  tenantId: string;
  name: string;
  type: ReportType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients: string[];
  sections: ReportSection[];
  generatedAt: Date;
  nextScheduled?: Date;
  isAutomated: boolean;
}

export enum ReportType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  CAMPAIGN_PERFORMANCE = 'campaign_performance',
  FINANCIAL_ANALYSIS = 'financial_analysis',
  CUSTOMER_INSIGHTS = 'customer_insights',
  OPERATIONAL_METRICS = 'operational_metrics',
  SECURITY_AUDIT = 'security_audit'
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'insights' | 'text';
  content: any;
  order: number;
}

export class AnalyticsService {
  private pool: Pool;
  private readonly CACHE_TTL = 300; // 5 minutes cache
  private readonly CACHE_PREFIX = 'analytics:';
  private readonly INSIGHTS_CACHE_TTL = 900; // 15 minutes

  constructor() {
    this.pool = db.getPool();
  }

  // =========================================
  // ORDER TRENDS ANALYTICS
  // =========================================

  async getOrderTrends(
    tenantId: string,
    filters: AnalyticsFilters = {}
  ): Promise<OrderTrendData[]> {
    const cacheKey = `${this.CACHE_PREFIX}order_trends:${tenantId}:${JSON.stringify(filters)}`;
    
    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache miss for order trends:', error);
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const { startDate, endDate, restaurantId } = filters;
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      
      let query = `
        SELECT 
          DATE(o.created_at) as date,
          COUNT(o.id) as order_count,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(AVG(o.total_amount), 0) as average_order_value,
          COUNT(DISTINCT o.customer_id) as unique_customers
        FROM orders o
        WHERE o.tenant_id = $1
          AND o.status != 'cancelled'
          AND o.created_at >= $2
          AND o.created_at <= $3
      `;
      
      const params: any[] = [
        tenantId,
        startDate || defaultStartDate,
        endDate || new Date()
      ];
      
      let paramIndex = 4;
      if (restaurantId) {
        query += ` AND o.restaurant_id = $${paramIndex}`;
        params.push(restaurantId);
        paramIndex++;
      }
      
      query += `
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at) ASC
      `;
      
      const result = await client.query(query, params);
      
      const trends: OrderTrendData[] = result.rows.map(row => ({
        date: row.date,
        order_count: parseInt(row.order_count),
        total_revenue: parseFloat(row.total_revenue) / 100, // Convert cents to dollars
        average_order_value: parseFloat(row.average_order_value) / 100,
        unique_customers: parseInt(row.unique_customers)
      }));
      
      // Cache results
      try {
        await redis.set(cacheKey, JSON.stringify(trends), this.CACHE_TTL);
      } catch (error) {
        console.warn('Failed to cache order trends:', error);
      }
      
      return trends;
    } finally {
      client.release();
    }
  }

  // =========================================
  // CUSTOMER PREFERENCES ANALYTICS
  // =========================================

  async getCustomerPreferences(
    tenantId: string,
    filters: AnalyticsFilters = {}
  ): Promise<CustomerPreferenceData[]> {
    const cacheKey = `${this.CACHE_PREFIX}customer_prefs:${tenantId}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache miss for customer preferences:', error);
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const { startDate, endDate, customerId } = filters;
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 90); // 3 months
      
      let query = `
        SELECT 
          u.id as customer_id,
          u.email as customer_email,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_spent,
          MODE() WITHIN GROUP (ORDER BY r.cuisine_type) as favorite_cuisine,
          TO_CHAR(
            MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM o.created_at)), 
            'HH24:MI'
          ) || ':00' as preferred_order_time,
          MAX(o.created_at) as last_order_date,
          COALESCE(AVG(o.total_amount), 0) as avg_order_value
        FROM users u
        JOIN orders o ON u.id = o.customer_id
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE u.tenant_id = $1
          AND o.tenant_id = $1
          AND o.status != 'cancelled'
          AND o.created_at >= $2
          AND o.created_at <= $3
      `;
      
      const params: any[] = [
        tenantId,
        startDate || defaultStartDate,
        endDate || new Date()
      ];
      
      let paramIndex = 4;
      if (customerId) {
        query += ` AND u.id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }
      
      query += `
        GROUP BY u.id, u.email
        HAVING COUNT(o.id) >= 2
        ORDER BY total_spent DESC
        LIMIT 100
      `;
      
      const result = await client.query(query, params);
      
      const preferences: CustomerPreferenceData[] = result.rows.map(row => ({
        customer_id: row.customer_id,
        customer_email: row.customer_email,
        total_orders: parseInt(row.total_orders),
        total_spent: parseFloat(row.total_spent) / 100,
        favorite_cuisine: row.favorite_cuisine || 'mixed',
        preferred_order_time: row.preferred_order_time || '12:00:00',
        last_order_date: row.last_order_date,
        avg_order_value: parseFloat(row.avg_order_value) / 100
      }));
      
      // Cache results
      try {
        await redis.set(cacheKey, JSON.stringify(preferences), this.CACHE_TTL);
      } catch (error) {
        console.warn('Failed to cache customer preferences:', error);
      }
      
      return preferences;
    } finally {
      client.release();
    }
  }

  // =========================================
  // MENU ITEM PERFORMANCE ANALYTICS
  // =========================================

  async getMenuItemPerformance(
    tenantId: string,
    restaurantId: string,
    filters: AnalyticsFilters = {}
  ): Promise<MenuItemPerformance[]> {
    const cacheKey = `${this.CACHE_PREFIX}menu_performance:${tenantId}:${restaurantId}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache miss for menu performance:', error);
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const { startDate, endDate } = filters;
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      
      const query = `
        SELECT 
          mi.id as item_id,
          mi.name as item_name,
          mc.name as category,
          COUNT(oi.id) as total_orders,
          COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
          COALESCE(AVG(oi.price), 0) as avg_price,
          COALESCE(mi.cost, 0) as item_cost,
          CASE 
            WHEN COUNT(oi.id) > LAG(COUNT(oi.id)) OVER (PARTITION BY mi.id ORDER BY DATE_TRUNC('week', o.created_at)) THEN 'up'
            WHEN COUNT(oi.id) < LAG(COUNT(oi.id)) OVER (PARTITION BY mi.id ORDER BY DATE_TRUNC('week', o.created_at)) THEN 'down'
            ELSE 'stable'
          END as trend_direction
        FROM menu_items mi
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE mi.tenant_id = $1 
          AND mi.restaurant_id = $2
          AND (o.created_at IS NULL OR (
            o.created_at >= $3 
            AND o.created_at <= $4
            AND o.status != 'cancelled'
          ))
        GROUP BY mi.id, mi.name, mc.name, mi.cost
        ORDER BY total_revenue DESC
      `;
      
      const result = await client.query(query, [
        tenantId,
        restaurantId,
        startDate || defaultStartDate,
        endDate || new Date()
      ]);
      
      const performance: MenuItemPerformance[] = result.rows.map(row => {
        const revenue = parseFloat(row.total_revenue) / 100;
        const cost = parseFloat(row.item_cost) / 100;
        const profit = revenue - (cost * parseInt(row.total_orders));
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        return {
          item_id: row.item_id,
          item_name: row.item_name,
          category: row.category || 'Uncategorized',
          total_orders: parseInt(row.total_orders),
          total_revenue: revenue,
          profit_margin: profitMargin,
          trend_direction: row.trend_direction || 'stable'
        };
      });
      
      // Cache results
      try {
        await redis.set(cacheKey, JSON.stringify(performance), this.CACHE_TTL);
      } catch (error) {
        console.warn('Failed to cache menu performance:', error);
      }
      
      return performance;
    } finally {
      client.release();
    }
  }

  // =========================================
  // FINANCIAL INSIGHTS ANALYTICS
  // =========================================

  async getFinancialInsights(
    tenantId: string,
    filters: AnalyticsFilters = {}
  ): Promise<FinancialInsights> {
    const cacheKey = `${this.CACHE_PREFIX}financial_insights:${tenantId}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Convert date strings back to Date objects
        parsed.period_start = new Date(parsed.period_start);
        parsed.period_end = new Date(parsed.period_end);
        return parsed;
      }
    } catch (error) {
      console.warn('Redis cache miss for financial insights:', error);
    }

    const { startDate, endDate } = filters;
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    const periodStart = startDate || defaultStartDate;
    const periodEnd = endDate || new Date();

    // Get parallel data
    const [
      orderTrends,
      restaurantPerformance,
      commissionBreakdown
    ] = await Promise.all([
      this.getOrderTrends(tenantId, { startDate: periodStart, endDate: periodEnd }),
      this.getRestaurantPerformance(tenantId, { startDate: periodStart, endDate: periodEnd }),
      this.getCommissionBreakdown(tenantId, { startDate: periodStart, endDate: periodEnd })
    ]);

    // Calculate summary metrics
    const totalGrossRevenue = orderTrends.reduce((sum, day) => sum + day.total_revenue, 0);
    const totalOrders = orderTrends.reduce((sum, day) => sum + day.order_count, 0);
    const totalCommissionEarned = commissionBreakdown.reduce((sum, breakdown) => sum + breakdown.total_amount, 0);
    const averageOrderValue = totalOrders > 0 ? totalGrossRevenue / totalOrders : 0;

    const insights: FinancialInsights = {
      period_start: periodStart,
      period_end: periodEnd,
      total_gross_revenue: totalGrossRevenue,
      total_commission_earned: totalCommissionEarned,
      total_orders: totalOrders,
      average_order_value: averageOrderValue,
      top_performing_restaurants: restaurantPerformance.slice(0, 10),
      revenue_by_day: orderTrends,
      commission_breakdown: commissionBreakdown
    };
    
    // Cache results
    try {
      await redis.set(cacheKey, JSON.stringify(insights), this.CACHE_TTL);
    } catch (error) {
      console.warn('Failed to cache financial insights:', error);
    }
    
    return insights;
  }

  // =========================================
  // RESTAURANT PERFORMANCE ANALYTICS
  // =========================================

  private async getRestaurantPerformance(
    tenantId: string,
    filters: AnalyticsFilters
  ): Promise<RestaurantPerformance[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        SELECT 
          r.id as restaurant_id,
          r.name as restaurant_name,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(SUM(c.commission_amount), 0) as commission_earned,
          COALESCE(AVG(r.rating), 4.0) as customer_satisfaction,
          -- Calculate growth rate compared to previous period
          (COUNT(o.id) - COALESCE(prev.prev_orders, 0)) * 100.0 / NULLIF(COALESCE(prev.prev_orders, 1), 0) as growth_rate
        FROM restaurants r
        LEFT JOIN orders o ON r.id = o.restaurant_id 
          AND o.created_at >= $2 
          AND o.created_at <= $3
          AND o.status != 'cancelled'
        LEFT JOIN commissions c ON o.id = c.order_id
        LEFT JOIN (
          SELECT 
            restaurant_id,
            COUNT(*) as prev_orders
          FROM orders
          WHERE created_at >= $2 - INTERVAL '30 days'
            AND created_at < $2
            AND status != 'cancelled'
          GROUP BY restaurant_id
        ) prev ON r.id = prev.restaurant_id
        WHERE r.tenant_id = $1
        GROUP BY r.id, r.name, r.rating, prev.prev_orders
        ORDER BY total_revenue DESC
      `;
      
      const result = await client.query(query, [
        tenantId,
        filters.startDate,
        filters.endDate
      ]);
      
      return result.rows.map(row => ({
        restaurant_id: row.restaurant_id,
        restaurant_name: row.restaurant_name,
        total_orders: parseInt(row.total_orders),
        total_revenue: parseFloat(row.total_revenue) / 100,
        commission_earned: parseFloat(row.commission_earned) / 100,
        growth_rate: parseFloat(row.growth_rate) || 0,
        customer_satisfaction: parseFloat(row.customer_satisfaction)
      }));
    } finally {
      client.release();
    }
  }

  // =========================================
  // COMMISSION BREAKDOWN ANALYTICS
  // =========================================

  private async getCommissionBreakdown(
    tenantId: string,
    filters: AnalyticsFilters
  ): Promise<CommissionBreakdown[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        SELECT 
          c.transaction_type,
          COUNT(*) as count,
          COALESCE(SUM(c.commission_amount), 0) as total_amount
        FROM commissions c
        WHERE c.tenant_id = $1
          AND c.created_at >= $2
          AND c.created_at <= $3
        GROUP BY c.transaction_type
        ORDER BY total_amount DESC
      `;
      
      const result = await client.query(query, [
        tenantId,
        filters.startDate,
        filters.endDate
      ]);
      
      const totalCommissions = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
      
      return result.rows.map(row => ({
        transaction_type: row.transaction_type,
        count: parseInt(row.count),
        total_amount: parseFloat(row.total_amount) / 100,
        percentage_of_total: totalCommissions > 0 ? (parseFloat(row.total_amount) / totalCommissions) * 100 : 0
      }));
    } finally {
      client.release();
    }
  }

  // =========================================
  // CACHE MANAGEMENT
  // =========================================

  async invalidateCache(tenantId: string, pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern ? `${this.CACHE_PREFIX}${pattern}:${tenantId}*` : `${this.CACHE_PREFIX}*:${tenantId}*`;
      
      // Note: This would need to be implemented based on Redis client capabilities
      // For now, we'll just log the intent
      console.log(`Would invalidate cache pattern: ${searchPattern}`);
    } catch (error) {
      console.warn('Failed to invalidate analytics cache:', error);
    }
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  async getAnalyticsSummary(tenantId: string): Promise<any> {
    const defaultFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
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
      trends: orderTrends.slice(-7), // Last 7 days
      top_customers: customerPrefs.slice(0, 5),
      recent_performance: financialInsights.top_performing_restaurants.slice(0, 5)
    };
  }

  // =========================================
  // ADVANCED ANALYTICS METHODS
  // =========================================

  /**
   * Get comprehensive analytics metrics for tenant
   */
  async getAdvancedAnalyticsMetrics(
    tenantId: string,
    category?: AnalyticsCategory,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    }
  ): Promise<AnalyticsMetric[]> {
    const cacheKey = `${this.CACHE_PREFIX}advanced_metrics:${tenantId}:${category || 'all'}:${timeRange.start.getTime()}-${timeRange.end.getTime()}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed for advanced analytics metrics:', error);
    }

    const client = await this.pool.connect();
    const metrics: AnalyticsMetric[] = [];

    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // Revenue Metrics
      if (!category || category === AnalyticsCategory.REVENUE) {
        const revenueMetrics = await this.calculateAdvancedRevenueMetrics(client, tenantId, timeRange);
        metrics.push(...revenueMetrics);
      }

      // Order Metrics
      if (!category || category === AnalyticsCategory.ORDERS) {
        const orderMetrics = await this.calculateAdvancedOrderMetrics(client, tenantId, timeRange);
        metrics.push(...orderMetrics);
      }

      // Customer Metrics
      if (!category || category === AnalyticsCategory.CUSTOMERS) {
        const customerMetrics = await this.calculateAdvancedCustomerMetrics(client, tenantId, timeRange);
        metrics.push(...customerMetrics);
      }

      // Campaign Metrics
      if (!category || category === AnalyticsCategory.CAMPAIGNS) {
        const campaignMetrics = await this.calculateAdvancedCampaignMetrics(client, tenantId, timeRange);
        metrics.push(...campaignMetrics);
      }

      // Restaurant Performance Metrics
      if (!category || category === AnalyticsCategory.RESTAURANTS) {
        const restaurantMetrics = await this.calculateAdvancedRestaurantMetrics(client, tenantId, timeRange);
        metrics.push(...restaurantMetrics);
      }

      // Performance Metrics
      if (!category || category === AnalyticsCategory.PERFORMANCE) {
        const performanceMetrics = await this.calculateAdvancedPerformanceMetrics(client, tenantId, timeRange);
        metrics.push(...performanceMetrics);
      }

      // Cache results
      try {
        await redis.set(cacheKey, JSON.stringify(metrics), this.CACHE_TTL);
      } catch (error) {
        logger.warn('Cache write failed for advanced analytics metrics:', error);
      }

      return metrics;

    } finally {
      client.release();
    }
  }

  /**
   * Calculate advanced revenue-related metrics
   */
  private async calculateAdvancedRevenueMetrics(
    client: any,
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    // Total Revenue with period comparison
    const revenueResult = await client.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as current_revenue,
        COUNT(*) as transaction_count,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders 
      WHERE tenant_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
    `, [tenantId, timeRange.start, timeRange.end]);

    // Previous period for comparison
    const periodLength = timeRange.end.getTime() - timeRange.start.getTime();
    const previousStart = new Date(timeRange.start.getTime() - periodLength);
    const previousRevenue = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0) as previous_revenue
      FROM orders 
      WHERE tenant_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
    `, [tenantId, previousStart, timeRange.start]);

    const currentRevenue = parseFloat(revenueResult.rows[0].current_revenue) || 0;
    const prevRevenue = parseFloat(previousRevenue.rows[0].previous_revenue) || 0;
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    metrics.push({
      id: 'total_revenue_advanced',
      name: 'Total Revenue (Advanced)',
      category: AnalyticsCategory.REVENUE,
      value: currentRevenue / 100, // Convert cents to dollars
      previousValue: prevRevenue / 100,
      changePercent: revenueChange,
      trend: revenueChange > 5 ? 'up' : revenueChange < -5 ? 'down' : 'stable',
      timestamp: new Date(),
      metadata: {
        transactionCount: parseInt(revenueResult.rows[0].transaction_count),
        uniqueCustomers: parseInt(revenueResult.rows[0].unique_customers),
        averageOrderValue: currentRevenue / parseInt(revenueResult.rows[0].transaction_count) / 100 || 0,
        revenuePerCustomer: currentRevenue / parseInt(revenueResult.rows[0].unique_customers) / 100 || 0
      }
    });

    // Revenue Growth Rate
    metrics.push({
      id: 'revenue_growth_rate',
      name: 'Revenue Growth Rate',
      category: AnalyticsCategory.REVENUE,
      value: revenueChange,
      trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable',
      timestamp: new Date(),
      metadata: {
        periodComparison: 'previous_period',
        isHealthy: revenueChange > 10
      }
    });

    // Commission Revenue
    const commissionResult = await client.query(`
      SELECT 
        COALESCE(SUM(commission_amount), 0) as commission_revenue,
        COALESCE(SUM(platform_fee), 0) as platform_fees,
        COUNT(*) as commission_transactions
      FROM commission_tracking 
      WHERE tenant_id = $1 
        AND status = 'completed'
        AND processed_at BETWEEN $2 AND $3
    `, [tenantId, timeRange.start, timeRange.end]);

    const commissionRevenue = parseFloat(commissionResult.rows[0].commission_revenue) || 0;
    const platformFees = parseFloat(commissionResult.rows[0].platform_fees) || 0;
    const commissionMargin = currentRevenue > 0 ? (commissionRevenue / currentRevenue) * 100 : 0;

    metrics.push({
      id: 'commission_revenue_advanced',
      name: 'Commission Revenue',
      category: AnalyticsCategory.REVENUE,
      value: commissionRevenue / 100,
      trend: 'stable',
      timestamp: new Date(),
      metadata: { 
        platformFees: platformFees / 100,
        commissionMargin: commissionMargin,
        transactionCount: parseInt(commissionResult.rows[0].commission_transactions)
      }
    });

    return metrics;
  }

  /**
   * Calculate advanced order-related metrics
   */
  private async calculateAdvancedOrderMetrics(
    client: any,
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    // Order fulfillment metrics
    const orderResult = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_fulfillment_time
      FROM orders 
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `, [tenantId, timeRange.start, timeRange.end]);

    const totalOrders = parseInt(orderResult.rows[0].total_orders);
    const completedOrders = parseInt(orderResult.rows[0].completed_orders);
    const cancelledOrders = parseInt(orderResult.rows[0].cancelled_orders);
    const avgFulfillmentTime = parseFloat(orderResult.rows[0].avg_fulfillment_time) || 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    metrics.push({
      id: 'order_completion_rate_advanced',
      name: 'Order Completion Rate',
      category: AnalyticsCategory.ORDERS,
      value: completionRate,
      trend: completionRate > 90 ? 'up' : completionRate < 80 ? 'down' : 'stable',
      timestamp: new Date(),
      metadata: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        avgFulfillmentTime: Math.round(avgFulfillmentTime),
        cancellationRate
      }
    });

    // Order frequency analysis
    const frequencyResult = await client.query(`
      SELECT 
        AVG(daily_orders) as avg_daily_orders,
        MAX(daily_orders) as peak_daily_orders,
        MIN(daily_orders) as min_daily_orders
      FROM (
        SELECT DATE(created_at) as order_date, COUNT(*) as daily_orders
        FROM orders 
        WHERE tenant_id = $1 
          AND created_at BETWEEN $2 AND $3
          AND status != 'cancelled'
        GROUP BY DATE(created_at)
      ) daily_stats
    `, [tenantId, timeRange.start, timeRange.end]);

    const avgDailyOrders = parseFloat(frequencyResult.rows[0].avg_daily_orders) || 0;
    const peakDailyOrders = parseInt(frequencyResult.rows[0].peak_daily_orders) || 0;
    
    metrics.push({
      id: 'order_frequency',
      name: 'Average Daily Orders',
      category: AnalyticsCategory.ORDERS,
      value: avgDailyOrders,
      trend: 'stable',
      timestamp: new Date(),
      metadata: {
        peakDailyOrders,
        orderVolatility: peakDailyOrders > avgDailyOrders * 2 ? 'high' : 'normal'
      }
    });

    return metrics;
  }

  /**
   * Calculate advanced customer-related metrics
   */
  private async calculateAdvancedCustomerMetrics(
    client: any,
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    // Customer acquisition and retention
    const customerResult = await client.query(`
      SELECT 
        COUNT(DISTINCT o.customer_id) as active_customers,
        COUNT(DISTINCT CASE WHEN first_order.first_order_date >= $2 THEN o.customer_id END) as new_customers,
        COUNT(DISTINCT CASE WHEN repeat_orders.order_count > 1 THEN o.customer_id END) as repeat_customers
      FROM orders o
      LEFT JOIN (
        SELECT customer_id, MIN(created_at) as first_order_date
        FROM orders 
        WHERE tenant_id = $1 AND status = 'completed'
        GROUP BY customer_id
      ) first_order ON o.customer_id = first_order.customer_id
      LEFT JOIN (
        SELECT customer_id, COUNT(*) as order_count
        FROM orders 
        WHERE tenant_id = $1 
          AND status = 'completed'
          AND created_at BETWEEN $2 AND $3
        GROUP BY customer_id
      ) repeat_orders ON o.customer_id = repeat_orders.customer_id
      WHERE o.tenant_id = $1 
        AND o.created_at BETWEEN $2 AND $3
        AND o.status = 'completed'
    `, [tenantId, timeRange.start, timeRange.end]);

    const activeCustomers = parseInt(customerResult.rows[0].active_customers);
    const newCustomers = parseInt(customerResult.rows[0].new_customers);
    const repeatCustomers = parseInt(customerResult.rows[0].repeat_customers);
    const retentionRate = activeCustomers > 0 ? (repeatCustomers / activeCustomers) * 100 : 0;

    metrics.push({
      id: 'customer_retention_rate',
      name: 'Customer Retention Rate',
      category: AnalyticsCategory.CUSTOMERS,
      value: retentionRate,
      trend: retentionRate > 60 ? 'up' : retentionRate < 40 ? 'down' : 'stable',
      timestamp: new Date(),
      metadata: {
        activeCustomers,
        newCustomers,
        repeatCustomers,
        acquisitionRate: activeCustomers > 0 ? (newCustomers / activeCustomers) * 100 : 0
      }
    });

    // Customer Lifetime Value
    const clvResult = await client.query(`
      SELECT 
        AVG(customer_total) as avg_clv,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY customer_total) as median_clv,
        MAX(customer_total) as highest_clv
      FROM (
        SELECT customer_id, SUM(total_amount) as customer_total
        FROM orders 
        WHERE tenant_id = $1 
          AND status = 'completed'
          AND created_at <= $2
        GROUP BY customer_id
      ) customer_totals
    `, [tenantId, timeRange.end]);

    const avgCLV = parseFloat(clvResult.rows[0].avg_clv) / 100 || 0;
    const medianCLV = parseFloat(clvResult.rows[0].median_clv) / 100 || 0;

    metrics.push({
      id: 'customer_lifetime_value_advanced',
      name: 'Customer Lifetime Value',
      category: AnalyticsCategory.CUSTOMERS,
      value: avgCLV,
      trend: 'stable',
      timestamp: new Date(),
      metadata: {
        medianCLV,
        highestCLV: parseFloat(clvResult.rows[0].highest_clv) / 100 || 0,
        distribution: avgCLV > medianCLV * 1.5 ? 'skewed_high' : 'normal'
      }
    });

    return metrics;
  }

  /**
   * Calculate advanced campaign-related metrics
   */
  private async calculateAdvancedCampaignMetrics(
    client: any,
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    // Campaign performance analysis
    const campaignResult = await client.query(`
      SELECT 
        COUNT(*) as active_campaigns,
        COALESCE(SUM(budget_spent), 0) as total_spend,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(revenue_attributed), 0) as attributed_revenue
      FROM campaigns 
      WHERE tenant_id = $1 
        AND status = 'active'
        AND created_at BETWEEN $2 AND $3
    `, [tenantId, timeRange.start, timeRange.end]);

    const totalSpend = parseFloat(campaignResult.rows[0].total_spend) / 100 || 0;
    const totalImpressions = parseInt(campaignResult.rows[0].total_impressions) || 0;
    const totalClicks = parseInt(campaignResult.rows[0].total_clicks) || 0;
    const totalConversions = parseInt(campaignResult.rows[0].total_conversions) || 0;
    const attributedRevenue = parseFloat(campaignResult.rows[0].attributed_revenue) / 100 || 0;
    
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const roas = totalSpend > 0 ? attributedRevenue / totalSpend : 0; // Return on Ad Spend
    const cac = totalConversions > 0 ? totalSpend / totalConversions : 0; // Customer Acquisition Cost

    metrics.push({
      id: 'campaign_roas',
      name: 'Return on Ad Spend (ROAS)',
      category: AnalyticsCategory.CAMPAIGNS,
      value: roas,
      trend: roas > 3 ? 'up' : roas < 2 ? 'down' : 'stable',
      timestamp: new Date(),
      metadata: {
        totalSpend,
        attributedRevenue,
        ctr,
        conversionRate,
        cac,
        totalImpressions,
        totalClicks,
        totalConversions
      }
    });

    return metrics;
  }

  /**
   * Calculate advanced restaurant performance metrics
   */
  private async calculateAdvancedRestaurantMetrics(
    client: any,
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    // Restaurant operational efficiency
    const restaurantResult = await client.query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_restaurants,
        AVG(r.rating) as avg_rating,
        COUNT(DISTINCT o.id) as total_orders,
        AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at))/60) as avg_prep_time,
        COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) * 100.0 / NULLIF(COUNT(o.id), 0) as cancellation_rate
      FROM restaurants r
      LEFT JOIN orders o ON r.id = o.restaurant_id 
        AND o.created_at BETWEEN $2 AND $3
      WHERE r.tenant_id = $1 
        AND r.status = 'active'
    `, [tenantId, timeRange.start, timeRange.end]);

    const totalRestaurants = parseInt(restaurantResult.rows[0].total_restaurants);
    const avgRating = parseFloat(restaurantResult.rows[0].avg_rating) || 0;
    const avgPrepTime = parseFloat(restaurantResult.rows[0].avg_prep_time) || 0;
    const cancellationRate = parseFloat(restaurantResult.rows[0].cancellation_rate) || 0;
    const ordersPerRestaurant = totalRestaurants > 0 ? parseInt(restaurantResult.rows[0].total_orders) / totalRestaurants : 0;

    // Calculate composite performance score
    const ratingScore = (avgRating / 5) * 100;
    const efficiencyScore = Math.max(0, 100 - (avgPrepTime / 30) * 100); // 30 min baseline
    const reliabilityScore = Math.max(0, 100 - cancellationRate);
    const performanceScore = (ratingScore + efficiencyScore + reliabilityScore) / 3;

    metrics.push({
      id: 'restaurant_performance_score',
      name: 'Restaurant Performance Score',
      category: AnalyticsCategory.RESTAURANTS,
      value: performanceScore,
      trend: performanceScore > 85 ? 'up' : performanceScore < 70 ? 'down' : 'stable',
      timestamp: new Date(),
      metadata: {
        totalRestaurants,
        avgRating,
        avgPrepTime: Math.round(avgPrepTime),
        cancellationRate,
        ordersPerRestaurant,
        ratingScore,
        efficiencyScore,
        reliabilityScore
      }
    });

    return metrics;
  }

  /**
   * Calculate advanced system performance metrics
   */
  private async calculateAdvancedPerformanceMetrics(
    client: any,
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    // API and system performance
    const apiResult = await client.query(`
      SELECT 
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
        COUNT(CASE WHEN status_code >= 500 THEN 1 END) as server_error_count
      FROM api_logs 
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `, [tenantId, timeRange.start, timeRange.end]);

    const totalRequests = parseInt(apiResult.rows[0].total_requests) || 0;
    const avgResponseTime = parseFloat(apiResult.rows[0].avg_response_time) || 0;
    const p95ResponseTime = parseFloat(apiResult.rows[0].p95_response_time) || 0;
    const errorCount = parseInt(apiResult.rows[0].error_count) || 0;
    const serverErrorCount = parseInt(apiResult.rows[0].server_error_count) || 0;
    
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    const availability = totalRequests > 0 ? ((totalRequests - serverErrorCount) / totalRequests) * 100 : 100;
    
    // Calculate Apdex score (Application Performance Index)
    // Assumes 500ms satisfactory, 2000ms tolerable
    const apdexResult = await client.query(`
      SELECT 
        COUNT(CASE WHEN response_time <= 500 THEN 1 END) as satisfied,
        COUNT(CASE WHEN response_time > 500 AND response_time <= 2000 THEN 1 END) as tolerable,
        COUNT(*) as total
      FROM api_logs 
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `, [tenantId, timeRange.start, timeRange.end]);

    const satisfied = parseInt(apdexResult.rows[0].satisfied) || 0;
    const tolerable = parseInt(apdexResult.rows[0].tolerable) || 0;
    const total = parseInt(apdexResult.rows[0].total) || 1;
    const apdexScore = (satisfied + (tolerable * 0.5)) / total;

    metrics.push({
      id: 'system_performance_score',
      name: 'System Performance Score',
      category: AnalyticsCategory.PERFORMANCE,
      value: apdexScore * 100,
      trend: apdexScore > 0.9 ? 'up' : apdexScore < 0.7 ? 'down' : 'stable',
      timestamp: new Date(),
      metadata: {
        totalRequests,
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        errorRate,
        availability,
        apdexScore
      }
    });

    return metrics;
  }

  /**
   * Generate intelligent insights from analytics data
   */
  async generateAdvancedInsights(tenantId: string): Promise<AnalyticsInsight[]> {
    const cacheKey = `${this.CACHE_PREFIX}advanced_insights:${tenantId}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed for advanced insights:', error);
    }

    const insights: AnalyticsInsight[] = [];
    const currentMetrics = await this.getAdvancedAnalyticsMetrics(tenantId);

    // Revenue trend analysis
    const revenueMetric = currentMetrics.find(m => m.id === 'total_revenue_advanced');
    if (revenueMetric && revenueMetric.changePercent !== undefined) {
      if (revenueMetric.changePercent < -15) {
        insights.push({
          id: `revenue_decline_${Date.now()}`,
          type: InsightType.PERFORMANCE_DECLINE,
          title: 'Significant Revenue Decline',
          description: `Revenue has decreased by ${Math.abs(revenueMetric.changePercent).toFixed(1)}% compared to the previous period.`,
          severity: 'critical',
          category: AnalyticsCategory.REVENUE,
          confidence: 90,
          actionable: true,
          recommendations: [
            'Conduct immediate revenue impact analysis',
            'Review recent campaign performance and ROI',
            'Analyze customer churn and satisfaction metrics',
            'Investigate operational issues affecting order completion',
            'Consider emergency promotional campaigns'
          ],
          relatedMetrics: ['total_revenue_advanced', 'customer_retention_rate', 'order_completion_rate_advanced'],
          generatedAt: new Date()
        });
      } else if (revenueMetric.changePercent > 25) {
        insights.push({
          id: `exceptional_growth_${Date.now()}`,
          type: InsightType.GROWTH_OPPORTUNITY,
          title: 'Exceptional Revenue Growth',
          description: `Revenue has increased by ${revenueMetric.changePercent.toFixed(1)}% - significant growth opportunity identified.`,
          severity: 'info',
          category: AnalyticsCategory.REVENUE,
          confidence: 95,
          actionable: true,
          recommendations: [
            'Scale successful marketing campaigns immediately',
            'Increase inventory and capacity to meet demand',
            'Expand to new geographic markets',
            'Invest in customer retention programs',
            'Consider premium service offerings'
          ],
          relatedMetrics: ['total_revenue_advanced', 'campaign_roas'],
          generatedAt: new Date()
        });
      }
    }

    // Customer retention analysis
    const retentionRate = currentMetrics.find(m => m.id === 'customer_retention_rate');
    if (retentionRate && retentionRate.value < 50) {
      insights.push({
        id: `low_retention_${Date.now()}`,
        type: InsightType.RISK_DETECTION,
        title: 'Low Customer Retention Risk',
        description: `Customer retention rate is ${retentionRate.value.toFixed(1)}%, indicating potential churn issues.`,
        severity: 'warning',
        category: AnalyticsCategory.CUSTOMERS,
        confidence: 85,
        actionable: true,
        recommendations: [
          'Implement customer feedback collection system',
          'Create loyalty and rewards programs',
          'Improve onboarding experience for new customers',
          'Analyze customer journey pain points',
          'Develop win-back campaigns for churned customers'
        ],
        relatedMetrics: ['customer_retention_rate', 'customer_lifetime_value_advanced'],
        generatedAt: new Date()
      });
    }

    // Performance optimization opportunities
    const performanceScore = currentMetrics.find(m => m.id === 'system_performance_score');
    if (performanceScore && performanceScore.value < 75) {
      insights.push({
        id: `performance_optimization_${Date.now()}`,
        type: InsightType.EFFICIENCY_IMPROVEMENT,
        title: 'System Performance Optimization Needed',
        description: `System performance score is ${performanceScore.value.toFixed(1)}%, below optimal levels.`,
        severity: 'warning',
        category: AnalyticsCategory.PERFORMANCE,
        confidence: 80,
        actionable: true,
        recommendations: [
          'Optimize database queries and indexing',
          'Implement additional caching layers',
          'Scale infrastructure resources',
          'Review and optimize API endpoints',
          'Conduct performance profiling analysis'
        ],
        relatedMetrics: ['system_performance_score'],
        generatedAt: new Date()
      });
    }

    // ROAS optimization insights
    const roasMetric = currentMetrics.find(m => m.id === 'campaign_roas');
    if (roasMetric && roasMetric.value < 2.5) {
      insights.push({
        id: `roas_optimization_${Date.now()}`,
        type: InsightType.EFFICIENCY_IMPROVEMENT,
        title: 'Campaign ROAS Below Target',
        description: `Return on Ad Spend is ${roasMetric.value.toFixed(2)}x, below the recommended 3x minimum.`,
        severity: 'warning',
        category: AnalyticsCategory.CAMPAIGNS,
        confidence: 88,
        actionable: true,
        recommendations: [
          'Pause underperforming campaigns immediately',
          'Reallocate budget to high-performing channels',
          'Improve landing page conversion rates',
          'Refine audience targeting parameters',
          'A/B test ad creative and messaging'
        ],
        relatedMetrics: ['campaign_roas'],
        generatedAt: new Date()
      });
    }

    // Cache insights
    try {
      await redis.set(cacheKey, JSON.stringify(insights), this.INSIGHTS_CACHE_TTL);
    } catch (error) {
      logger.warn('Cache write failed for advanced insights:', error);
    }

    return insights;
  }

  /**
   * Get detailed campaign analytics with advanced metrics
   */
  async getAdvancedCampaignAnalytics(tenantId: string, campaignId?: string): Promise<CampaignAnalytics[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      let query = `
        SELECT 
          c.*,
          COALESCE(SUM(cl.impressions), 0) as total_impressions,
          COALESCE(SUM(cl.clicks), 0) as total_clicks,
          COALESCE(SUM(cl.conversions), 0) as total_conversions,
          COALESCE(SUM(cl.revenue), 0) as total_revenue,
          COALESCE(SUM(cl.cost), 0) as total_cost,
          COUNT(DISTINCT cl.user_id) as unique_users,
          AVG(cl.engagement_score) as avg_engagement
        FROM campaigns c
        LEFT JOIN campaign_logs cl ON c.id = cl.campaign_id
        WHERE c.tenant_id = $1
      `;
      
      const params = [tenantId];
      
      if (campaignId) {
        query += ' AND c.id = $2';
        params.push(campaignId);
      }
      
      query += ' GROUP BY c.id ORDER BY c.created_at DESC';
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => {
        const impressions = parseInt(row.total_impressions) || 0;
        const clicks = parseInt(row.total_clicks) || 0;
        const conversions = parseInt(row.total_conversions) || 0;
        const revenue = parseFloat(row.total_revenue) / 100 || 0;
        const cost = parseFloat(row.total_cost) / 100 || 0;
        
        return {
          campaignId: row.id,
          campaignName: row.name,
          status: row.status,
          metrics: {
            impressions,
            clicks,
            conversions,
            revenue,
            cost,
            roi: this.calculateROI(revenue, cost),
            ctr: this.calculateCTR(clicks, impressions),
            cpc: this.calculateCPC(cost, clicks),
            cpa: this.calculateCPA(cost, conversions)
          },
          performance: {
            reach: impressions,
            engagement: clicks,
            brandLift: parseFloat(row.avg_engagement) || 0,
            customerLifetimeValue: conversions > 0 ? revenue / conversions : 0
          },
          segmentation: {
            demographics: row.target_demographics || {},
            geographic: row.target_geographic || {},
            behavioral: row.target_behavioral || {}
          },
          timeSeriesData: [] // Would be populated from detailed time-series logs
        };
      });
      
    } finally {
      client.release();
    }
  }

  // Helper calculation methods
  private calculateROI(revenue: number, cost: number): number {
    return cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
  }

  private calculateCTR(clicks: number, impressions: number): number {
    return impressions > 0 ? (clicks / impressions) * 100 : 0;
  }

  private calculateCPC(cost: number, clicks: number): number {
    return clicks > 0 ? cost / clicks : 0;
  }

  private calculateCPA(cost: number, conversions: number): number {
    return conversions > 0 ? cost / conversions : 0;
  }
}

export const analyticsService = new AnalyticsService();