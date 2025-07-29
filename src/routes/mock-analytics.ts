import express, { Request, Response, NextFunction } from 'express';
import { mockAnalyticsService } from '@/services/MockAnalyticsService';
import { User } from '@/types/auth';
import winston from 'winston';

interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password_hash'>;
  tenantContext?: { tenantId: string };
}

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Mock authentication middleware
const mockAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.user = { 
    id: 'demo-user', 
    tenant_id: 'demo-tenant',
    email: 'demo@example.com',
    first_name: 'Demo',
    last_name: 'User',
    role: 'admin' as any,
    status: 'active' as any,
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  req.tenantContext = { tenantId: 'demo-tenant' };
  next();
};

// Get order trends
router.get('/orders/trends', mockAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, restaurantId } = req.query;

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
    }

    const filters: any = {};
    if (parsedStartDate) filters.startDate = parsedStartDate;
    if (parsedEndDate) filters.endDate = parsedEndDate;
    if (restaurantId) filters.restaurantId = restaurantId as string;

    const trends = await mockAnalyticsService.getOrderTrends(
      req.tenantContext!.tenantId,
      filters
    );

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
  } catch (error) {
    logger.error('Failed to get order trends:', error);
    next(error);
  }
});

// Get customer preferences
router.get('/customers/preferences', mockAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, customerId } = req.query;

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
    }

    const filters: any = {};
    if (parsedStartDate) filters.startDate = parsedStartDate;
    if (parsedEndDate) filters.endDate = parsedEndDate;
    if (customerId) filters.customerId = customerId as string;

    const preferences = await mockAnalyticsService.getCustomerPreferences(
      req.tenantContext!.tenantId,
      filters
    );

    const totalCustomers = preferences.length;
    const totalSpent = preferences.reduce((sum, cust) => sum + cust.total_spent, 0);
    const avgSpentPerCustomer = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    res.json({
      success: true,
      data: {
        customers: preferences,
        insights: {
          total_customers: totalCustomers,
          total_spent: totalSpent,
          avg_spent_per_customer: avgSpentPerCustomer,
          cuisine_preferences: preferences.reduce((acc, cust) => {
            acc[cust.favorite_cuisine] = (acc[cust.favorite_cuisine] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get customer preferences:', error);
    next(error);
  }
});

// Get menu item performance
router.get('/restaurants/:restaurantId/menu/performance', mockAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
    }

    const filters: any = {};
    if (parsedStartDate) filters.startDate = parsedStartDate;
    if (parsedEndDate) filters.endDate = parsedEndDate;

    const performance = await mockAnalyticsService.getMenuItemPerformance(
      req.tenantContext!.tenantId,
      restaurantId,
      filters
    );

    const totalItems = performance.length;
    const totalRevenue = performance.reduce((sum, item) => sum + item.total_revenue, 0);
    const bestPerformer = performance.length > 0 ? performance[0] : null;
    const avgProfitMargin = totalItems > 0 ? 
      performance.reduce((sum, item) => sum + item.profit_margin, 0) / totalItems : 0;

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
  } catch (error) {
    logger.error('Failed to get menu performance:', error);
    next(error);
  }
});

// Get financial insights
router.get('/financial/insights', mockAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
    }

    const filters: any = {};
    if (parsedStartDate) filters.startDate = parsedStartDate;
    if (parsedEndDate) filters.endDate = parsedEndDate;

    const insights = await mockAnalyticsService.getFinancialInsights(
      req.tenantContext!.tenantId,
      filters
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Failed to get financial insights:', error);
    next(error);
  }
});

// Get analytics dashboard summary
router.get('/dashboard/summary', mockAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await mockAnalyticsService.getAnalyticsSummary(
      req.tenantContext!.tenantId
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Failed to get analytics summary:', error);
    next(error);
  }
});

// Get real-time metrics
router.get('/realtime/metrics', mockAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todayTrends = await mockAnalyticsService.getOrderTrends(
      req.tenantContext!.tenantId,
      {
        startDate: startOfDay,
        endDate: today
      }
    );

    const realTimeMetrics = {
      today_orders: todayTrends.reduce((sum, day) => sum + day.order_count, 0),
      today_revenue: todayTrends.reduce((sum, day) => sum + day.total_revenue, 0),
      today_customers: todayTrends.reduce((sum, day) => sum + day.unique_customers, 0),
      last_updated: new Date().toISOString(),
      hourly_breakdown: todayTrends
    };

    res.json({
      success: true,
      data: realTimeMetrics
    });
  } catch (error) {
    logger.error('Failed to get real-time metrics:', error);
    next(error);
  }
});

export default router;