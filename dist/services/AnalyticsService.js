"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const connection_1 = __importDefault(require("@/database/connection"));
const redis_1 = __importDefault(require("@/cache/redis"));
class AnalyticsService {
    pool;
    CACHE_TTL = 300; // 5 minutes cache
    CACHE_PREFIX = 'analytics:';
    constructor() {
        this.pool = connection_1.default.getPool();
    }
    // =========================================
    // ORDER TRENDS ANALYTICS
    // =========================================
    async getOrderTrends(tenantId, filters = {}) {
        const cacheKey = `${this.CACHE_PREFIX}order_trends:${tenantId}:${JSON.stringify(filters)}`;
        try {
            // Try cache first
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        catch (error) {
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
            const params = [
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
            const trends = result.rows.map(row => ({
                date: row.date,
                order_count: parseInt(row.order_count),
                total_revenue: parseFloat(row.total_revenue) / 100, // Convert cents to dollars
                average_order_value: parseFloat(row.average_order_value) / 100,
                unique_customers: parseInt(row.unique_customers)
            }));
            // Cache results
            try {
                await redis_1.default.set(cacheKey, JSON.stringify(trends), this.CACHE_TTL);
            }
            catch (error) {
                console.warn('Failed to cache order trends:', error);
            }
            return trends;
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // CUSTOMER PREFERENCES ANALYTICS
    // =========================================
    async getCustomerPreferences(tenantId, filters = {}) {
        const cacheKey = `${this.CACHE_PREFIX}customer_prefs:${tenantId}:${JSON.stringify(filters)}`;
        try {
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        catch (error) {
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
            const params = [
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
            const preferences = result.rows.map(row => ({
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
                await redis_1.default.set(cacheKey, JSON.stringify(preferences), this.CACHE_TTL);
            }
            catch (error) {
                console.warn('Failed to cache customer preferences:', error);
            }
            return preferences;
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // MENU ITEM PERFORMANCE ANALYTICS
    // =========================================
    async getMenuItemPerformance(tenantId, restaurantId, filters = {}) {
        const cacheKey = `${this.CACHE_PREFIX}menu_performance:${tenantId}:${restaurantId}:${JSON.stringify(filters)}`;
        try {
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        catch (error) {
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
            const performance = result.rows.map(row => {
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
                await redis_1.default.set(cacheKey, JSON.stringify(performance), this.CACHE_TTL);
            }
            catch (error) {
                console.warn('Failed to cache menu performance:', error);
            }
            return performance;
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // FINANCIAL INSIGHTS ANALYTICS
    // =========================================
    async getFinancialInsights(tenantId, filters = {}) {
        const cacheKey = `${this.CACHE_PREFIX}financial_insights:${tenantId}:${JSON.stringify(filters)}`;
        try {
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Convert date strings back to Date objects
                parsed.period_start = new Date(parsed.period_start);
                parsed.period_end = new Date(parsed.period_end);
                return parsed;
            }
        }
        catch (error) {
            console.warn('Redis cache miss for financial insights:', error);
        }
        const { startDate, endDate } = filters;
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        const periodStart = startDate || defaultStartDate;
        const periodEnd = endDate || new Date();
        // Get parallel data
        const [orderTrends, restaurantPerformance, commissionBreakdown] = await Promise.all([
            this.getOrderTrends(tenantId, { startDate: periodStart, endDate: periodEnd }),
            this.getRestaurantPerformance(tenantId, { startDate: periodStart, endDate: periodEnd }),
            this.getCommissionBreakdown(tenantId, { startDate: periodStart, endDate: periodEnd })
        ]);
        // Calculate summary metrics
        const totalGrossRevenue = orderTrends.reduce((sum, day) => sum + day.total_revenue, 0);
        const totalOrders = orderTrends.reduce((sum, day) => sum + day.order_count, 0);
        const totalCommissionEarned = commissionBreakdown.reduce((sum, breakdown) => sum + breakdown.total_amount, 0);
        const averageOrderValue = totalOrders > 0 ? totalGrossRevenue / totalOrders : 0;
        const insights = {
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
            await redis_1.default.set(cacheKey, JSON.stringify(insights), this.CACHE_TTL);
        }
        catch (error) {
            console.warn('Failed to cache financial insights:', error);
        }
        return insights;
    }
    // =========================================
    // RESTAURANT PERFORMANCE ANALYTICS
    // =========================================
    async getRestaurantPerformance(tenantId, filters) {
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
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // COMMISSION BREAKDOWN ANALYTICS
    // =========================================
    async getCommissionBreakdown(tenantId, filters) {
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
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // CACHE MANAGEMENT
    // =========================================
    async invalidateCache(tenantId, pattern) {
        try {
            const searchPattern = pattern ? `${this.CACHE_PREFIX}${pattern}:${tenantId}*` : `${this.CACHE_PREFIX}*:${tenantId}*`;
            // Note: This would need to be implemented based on Redis client capabilities
            // For now, we'll just log the intent
            console.log(`Would invalidate cache pattern: ${searchPattern}`);
        }
        catch (error) {
            console.warn('Failed to invalidate analytics cache:', error);
        }
    }
    // =========================================
    // UTILITY METHODS
    // =========================================
    async getAnalyticsSummary(tenantId) {
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
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=AnalyticsService.js.map