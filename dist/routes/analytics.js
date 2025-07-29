"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AnalyticsService_1 = require("@/services/AnalyticsService");
const auth_1 = require("@/middleware/auth");
const auth_2 = require("@/types/auth");
const winston_1 = __importDefault(require("winston"));
const router = express_1.default.Router();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [new winston_1.default.transports.Console()]
});
// =========================================
// ORDER TRENDS ANALYTICS ROUTES
// =========================================
// Get order trends (requires manager+ role)
router.get('/orders/trends', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.MANAGER), async (req, res, next) => {
    try {
        const { startDate, endDate, restaurantId } = req.query;
        // Validate date parameters
        let parsedStartDate;
        let parsedEndDate;
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                res.status(400).json({ error: 'Invalid startDate format' });
                return;
            }
        }
        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                res.status(400).json({ error: 'Invalid endDate format' });
                return;
            }
        }
        const filters = {};
        if (parsedStartDate)
            filters.startDate = parsedStartDate;
        if (parsedEndDate)
            filters.endDate = parsedEndDate;
        if (restaurantId)
            filters.restaurantId = restaurantId;
        const trends = await AnalyticsService_1.analyticsService.getOrderTrends(req.tenantContext.tenantId, filters);
        logger.info('Order trends retrieved', {
            tenantId: req.tenantContext.tenantId,
            userId: req.user.id,
            recordCount: trends.length,
            dateRange: { startDate: parsedStartDate, endDate: parsedEndDate }
        });
        res.json({
            success: true,
            data: {
                trends,
                summary: {
                    total_days: trends.length,
                    total_orders: trends.reduce((sum, day) => sum + day.order_count, 0),
                    total_revenue: trends.reduce((sum, day) => sum + day.total_revenue, 0),
                    avg_daily_orders: trends.length > 0 ?
                        trends.reduce((sum, day) => sum + day.order_count, 0) / trends.length : 0,
                    avg_daily_revenue: trends.length > 0 ?
                        trends.reduce((sum, day) => sum + day.total_revenue, 0) / trends.length : 0
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to get order trends:', error);
        next(error);
    }
});
// =========================================
// CUSTOMER PREFERENCES ANALYTICS ROUTES  
// =========================================
// Get customer preferences (requires manager+ role)
router.get('/customers/preferences', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.MANAGER), async (req, res, next) => {
    try {
        const { startDate, endDate, customerId } = req.query;
        let parsedStartDate;
        let parsedEndDate;
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                res.status(400).json({ error: 'Invalid startDate format' });
                return;
            }
        }
        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                res.status(400).json({ error: 'Invalid endDate format' });
                return;
            }
        }
        const filters = {};
        if (parsedStartDate)
            filters.startDate = parsedStartDate;
        if (parsedEndDate)
            filters.endDate = parsedEndDate;
        if (customerId)
            filters.customerId = customerId;
        const preferences = await AnalyticsService_1.analyticsService.getCustomerPreferences(req.tenantContext.tenantId, filters);
        // Calculate insights
        const totalCustomers = preferences.length;
        const totalSpent = preferences.reduce((sum, cust) => sum + cust.total_spent, 0);
        const avgSpentPerCustomer = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
        const cuisinePreferences = preferences.reduce((acc, cust) => {
            acc[cust.favorite_cuisine] = (acc[cust.favorite_cuisine] || 0) + 1;
            return acc;
        }, {});
        logger.info('Customer preferences retrieved', {
            tenantId: req.tenantContext.tenantId,
            userId: req.user.id,
            customerCount: totalCustomers
        });
        res.json({
            success: true,
            data: {
                customers: preferences,
                insights: {
                    total_customers: totalCustomers,
                    total_spent: totalSpent,
                    avg_spent_per_customer: avgSpentPerCustomer,
                    cuisine_preferences: cuisinePreferences
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to get customer preferences:', error);
        next(error);
    }
});
// =========================================
// MENU PERFORMANCE ANALYTICS ROUTES
// =========================================
// Get menu item performance (requires manager+ role)
router.get('/restaurants/:restaurantId/menu/performance', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.MANAGER), async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate } = req.query;
        // Authorization: Restaurant owners can see their own, admins can see all
        if (req.user.role === auth_2.UserRole.MANAGER) {
            // TODO: Verify the user owns this restaurant
            // This would require checking restaurant ownership in the database
        }
        let parsedStartDate;
        let parsedEndDate;
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                res.status(400).json({ error: 'Invalid startDate format' });
                return;
            }
        }
        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                res.status(400).json({ error: 'Invalid endDate format' });
                return;
            }
        }
        const filters = {};
        if (parsedStartDate)
            filters.startDate = parsedStartDate;
        if (parsedEndDate)
            filters.endDate = parsedEndDate;
        const performance = await AnalyticsService_1.analyticsService.getMenuItemPerformance(req.tenantContext.tenantId, restaurantId, filters);
        // Calculate insights
        const totalItems = performance.length;
        const totalRevenue = performance.reduce((sum, item) => sum + item.total_revenue, 0);
        const bestPerformer = performance.length > 0 ? performance[0] : null;
        const avgProfitMargin = totalItems > 0 ?
            performance.reduce((sum, item) => sum + item.profit_margin, 0) / totalItems : 0;
        logger.info('Menu performance retrieved', {
            tenantId: req.tenantContext.tenantId,
            userId: req.user.id,
            restaurantId,
            itemCount: totalItems
        });
        res.json({
            success: true,
            data: {
                items: performance,
                insights: {
                    total_items: totalItems,
                    total_revenue: totalRevenue,
                    best_performer: bestPerformer,
                    avg_profit_margin: avgProfitMargin,
                    trending_up: performance.filter(item => item.trend_direction === 'up').length,
                    trending_down: performance.filter(item => item.trend_direction === 'down').length
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to get menu performance:', error);
        next(error);
    }
});
// =========================================
// FINANCIAL INSIGHTS ANALYTICS ROUTES
// =========================================
// Get financial insights (admin only)
router.get('/financial/insights', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.ADMIN), async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let parsedStartDate;
        let parsedEndDate;
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                res.status(400).json({ error: 'Invalid startDate format' });
                return;
            }
        }
        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                res.status(400).json({ error: 'Invalid endDate format' });
                return;
            }
        }
        const filters = {};
        if (parsedStartDate)
            filters.startDate = parsedStartDate;
        if (parsedEndDate)
            filters.endDate = parsedEndDate;
        const insights = await AnalyticsService_1.analyticsService.getFinancialInsights(req.tenantContext.tenantId, filters);
        logger.info('Financial insights retrieved', {
            tenantId: req.tenantContext.tenantId,
            userId: req.user.id,
            totalRevenue: insights.total_gross_revenue,
            totalCommission: insights.total_commission_earned,
            period: { start: insights.period_start, end: insights.period_end }
        });
        res.json({
            success: true,
            data: insights
        });
    }
    catch (error) {
        logger.error('Failed to get financial insights:', error);
        next(error);
    }
});
// =========================================
// DASHBOARD SUMMARY ROUTES
// =========================================
// Get analytics dashboard summary (requires manager+ role)
router.get('/dashboard/summary', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.MANAGER), async (req, res, next) => {
    try {
        const summary = await AnalyticsService_1.analyticsService.getAnalyticsSummary(req.tenantContext.tenantId);
        logger.info('Analytics dashboard summary retrieved', {
            tenantId: req.tenantContext.tenantId,
            userId: req.user.id,
            totalOrders: summary.summary.total_orders,
            totalRevenue: summary.summary.total_revenue
        });
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger.error('Failed to get analytics summary:', error);
        next(error);
    }
});
// =========================================
// CACHE MANAGEMENT ROUTES
// =========================================
// Invalidate analytics cache (admin only)
router.post('/cache/invalidate', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.ADMIN), async (req, res, next) => {
    try {
        const { pattern } = req.body;
        await AnalyticsService_1.analyticsService.invalidateCache(req.tenantContext.tenantId, pattern);
        logger.info('Analytics cache invalidated', {
            tenantId: req.tenantContext.tenantId,
            userId: req.user.id,
            pattern: pattern || 'all'
        });
        res.json({
            success: true,
            message: 'Analytics cache invalidated successfully'
        });
    }
    catch (error) {
        logger.error('Failed to invalidate analytics cache:', error);
        next(error);
    }
});
// =========================================
// REAL-TIME METRICS ROUTES
// =========================================
// Get real-time metrics (requires manager+ role)
router.get('/realtime/metrics', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.MANAGER), async (req, res, next) => {
    try {
        // Get today's data for real-time metrics
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayTrends = await AnalyticsService_1.analyticsService.getOrderTrends(req.tenantContext.tenantId, {
            startDate: startOfDay,
            endDate: today
        });
        const realTimeMetrics = {
            today_orders: todayTrends.reduce((sum, day) => sum + day.order_count, 0),
            today_revenue: todayTrends.reduce((sum, day) => sum + day.total_revenue, 0),
            today_customers: todayTrends.reduce((sum, day) => sum + day.unique_customers, 0),
            last_updated: new Date().toISOString(),
            hourly_breakdown: todayTrends // This would be more granular in production
        };
        res.json({
            success: true,
            data: realTimeMetrics
        });
    }
    catch (error) {
        logger.error('Failed to get real-time metrics:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map