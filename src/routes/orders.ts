import express, { Request, Response, NextFunction } from 'express';
import { orderService, OrderStatus, OrderFilters } from '@/services/OrderService';
import { authenticateToken, requireMinRole } from '@/middleware/auth';
import { UserRole } from '@/types/auth';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// =========================================
// ORDER CREATION ROUTES
// =========================================

// Create new order (customers only)
router.post('/', 
  authenticateToken, 
  requireMinRole(UserRole.CUSTOMER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customer_id, restaurant_id, items, delivery_address, special_instructions, tip_amount } = req.body;

      // Validate required fields
      if (!customer_id || !restaurant_id || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          error: 'Missing required fields: customer_id, restaurant_id, and items array'
        });
        return;
      }

      // Validate that customer can only create orders for themselves (unless admin)
      if (req.user!.role !== UserRole.ADMIN && req.user!.id !== customer_id) {
        res.status(403).json({
          error: 'You can only create orders for yourself'
        });
        return;
      }

      // Validate items structure
      for (const item of items) {
        if (!item.menu_item_id || !item.quantity || !item.price) {
          res.status(400).json({
            error: 'Each item must have menu_item_id, quantity, and price'
          });
          return;
        }

        if (item.quantity <= 0 || item.price <= 0) {
          res.status(400).json({
            error: 'Item quantity and price must be positive numbers'
          });
          return;
        }
      }

      const order = await orderService.createOrder(req.tenantContext!.tenantId, {
        customer_id,
        restaurant_id,
        items,
        delivery_address,
        special_instructions,
        tip_amount
      });

      logger.info('Order created successfully', {
        tenantId: req.tenantContext!.tenantId,
        orderId: order.id,
        customerId: customer_id,
        restaurantId: restaurant_id,
        itemCount: items.length,
        totalAmount: order.total_amount
      });

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Failed to create order:', error);
      next(error);
    }
  }
);

// =========================================
// ORDER RETRIEVAL ROUTES
// =========================================

// Get single order (customer, restaurant staff, or admin)
router.get('/:orderId',
  authenticateToken,
  requireMinRole(UserRole.CUSTOMER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      
      const order = await orderService.getOrder(req.tenantContext!.tenantId, orderId);
      
      if (!order) {
        res.status(404).json({
          error: 'Order not found'
        });
        return;
      }

      // Authorization check: customers can only see their own orders, staff can see restaurant orders
      if (req.user!.role === UserRole.CUSTOMER && order.customer_id !== req.user!.id) {
        res.status(403).json({
          error: 'You can only view your own orders'
        });
        return;
      }

      // Get order items
      const orderItems = await orderService.getOrderItems(req.tenantContext!.tenantId, orderId);

      res.json({
        success: true,
        data: {
          ...order,
          items: orderItems
        }
      });
    } catch (error) {
      logger.error('Failed to get order:', error);
      next(error);
    }
  }
);

// Get orders with filtering (role-based access)
router.get('/',
  authenticateToken,
  requireMinRole(UserRole.CUSTOMER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        status, 
        restaurant_id, 
        customer_id, 
        start_date, 
        end_date, 
        limit = 20, 
        offset = 0 
      } = req.query;

      const filters: OrderFilters = {};

      // Parse and validate filters
      if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
        filters.status = status as OrderStatus;
      }

      if (restaurant_id) {
        filters.restaurant_id = restaurant_id as string;
      }

      if (customer_id) {
        filters.customer_id = customer_id as string;
      }

      if (start_date) {
        const startDate = new Date(start_date as string);
        if (!isNaN(startDate.getTime())) {
          filters.start_date = startDate;
        }
      }

      if (end_date) {
        const endDate = new Date(end_date as string);
        if (!isNaN(endDate.getTime())) {
          filters.end_date = endDate;
        }
      }

      filters.limit = Math.min(parseInt(limit as string) || 20, 100); // Max 100 orders per request
      filters.offset = parseInt(offset as string) || 0;

      // Role-based filtering
      if (req.user!.role === UserRole.CUSTOMER) {
        // Customers can only see their own orders
        filters.customer_id = req.user!.id;
      } else if (req.user!.role === UserRole.STAFF || req.user!.role === UserRole.MANAGER) {
        // Staff/Managers can see orders for their restaurant(s)
        // Note: In production, we'd need to check which restaurants the user has access to
        if (!restaurant_id) {
          res.status(400).json({
            error: 'Restaurant staff must specify restaurant_id'
          });
          return;
        }
      }
      // Admins can see all orders (no additional filtering)

      const orders = await orderService.getOrdersByFilter(req.tenantContext!.tenantId, filters);

      logger.info('Orders retrieved', {
        tenantId: req.tenantContext!.tenantId,
        userId: req.user!.id,
        userRole: req.user!.role,
        orderCount: orders.length,
        filters
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: orders.length
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get orders:', error);
      next(error);
    }
  }
);

// =========================================
// ORDER STATUS MANAGEMENT ROUTES
// =========================================

// Update order status (restaurant staff and admin only)
router.patch('/:orderId/status',
  authenticateToken,
  requireMinRole(UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({
          error: 'Invalid or missing status. Valid statuses: ' + Object.values(OrderStatus).join(', ')
        });
        return;
      }

      // Verify order exists and user has access
      const existingOrder = await orderService.getOrder(req.tenantContext!.tenantId, orderId);
      if (!existingOrder) {
        res.status(404).json({
          error: 'Order not found'
        });
        return;
      }

      // Authorization: staff can only update orders for their restaurant
      if (req.user!.role !== UserRole.ADMIN) {
        // In production, verify user has access to this restaurant
        console.log(`User ${req.user!.id} updating order ${orderId} for restaurant ${existingOrder.restaurant_id}`);
      }

      const updatedOrder = await orderService.updateOrderStatus(
        req.tenantContext!.tenantId, 
        orderId, 
        status as OrderStatus,
        req.user!.id
      );

      logger.info('Order status updated', {
        tenantId: req.tenantContext!.tenantId,
        orderId,
        oldStatus: existingOrder.status,
        newStatus: status,
        updatedBy: req.user!.id
      });

      res.json({
        success: true,
        data: updatedOrder
      });
    } catch (error) {
      logger.error('Failed to update order status:', error);
      
      if (error instanceof Error && error.message.includes('Invalid status transition')) {
        res.status(400).json({
          error: error.message
        });
        return;
      }
      
      next(error);
    }
  }
);

// =========================================
// RESTAURANT DASHBOARD ROUTES
// =========================================

// Get restaurant order summary (restaurant staff and admin)
router.get('/restaurant/:restaurantId/summary',
  authenticateToken,
  requireMinRole(UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;

      // Authorization: staff can only see their restaurant data
      if (req.user!.role !== UserRole.ADMIN) {
        // In production, verify user has access to this restaurant
        console.log(`User ${req.user!.id} accessing summary for restaurant ${restaurantId}`);
      }

      const summary = await orderService.getRestaurantOrderSummary(
        req.tenantContext!.tenantId, 
        restaurantId
      );

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Failed to get restaurant order summary:', error);
      next(error);
    }
  }
);

// Get active orders for restaurant (for kitchen display)
router.get('/restaurant/:restaurantId/active',
  authenticateToken,
  requireMinRole(UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;

      const activeStatuses = [
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.OUT_FOR_DELIVERY
      ];

      const orders = await orderService.getOrdersByFilter(req.tenantContext!.tenantId, {
        restaurant_id: restaurantId,
        limit: 50 // Reasonable limit for active orders
      });

      // Filter to only active orders and get items for each
      const activeOrders = orders.filter(order => activeStatuses.includes(order.status));
      
      const ordersWithItems = await Promise.all(
        activeOrders.map(async (order) => {
          const items = await orderService.getOrderItems(req.tenantContext!.tenantId, order.id);
          return { ...order, items };
        })
      );

      res.json({
        success: true,
        data: {
          orders: ordersWithItems,
          summary: {
            total_active: activeOrders.length,
            confirmed: activeOrders.filter(o => o.status === OrderStatus.CONFIRMED).length,
            preparing: activeOrders.filter(o => o.status === OrderStatus.PREPARING).length,
            ready: activeOrders.filter(o => o.status === OrderStatus.READY).length,
            out_for_delivery: activeOrders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY).length
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get active orders:', error);
      next(error);
    }
  }
);

// =========================================
// ORDER EXPORT ROUTES
// =========================================

// Export order history (accountant and admin only)
router.get('/export/history',
  authenticateToken,
  requireMinRole(UserRole.MANAGER), // Assuming managers/accountants have manager role
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        format = 'csv',
        start_date,
        end_date,
        restaurant_id,
        status
      } = req.query;

      if (format !== 'csv' && format !== 'json') {
        res.status(400).json({
          error: 'Invalid format. Supported formats: csv, json'
        });
        return;
      }

      const filters: OrderFilters = {};

      if (start_date) {
        const startDate = new Date(start_date as string);
        if (!isNaN(startDate.getTime())) {
          filters.start_date = startDate;
        }
      }

      if (end_date) {
        const endDate = new Date(end_date as string);
        if (!isNaN(endDate.getTime())) {
          filters.end_date = endDate;
        }
      }

      if (restaurant_id) {
        filters.restaurant_id = restaurant_id as string;
      }

      if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
        filters.status = status as OrderStatus;
      }

      // Limit export to reasonable size
      filters.limit = 1000;

      const exportData = await orderService.exportOrderHistory(
        req.tenantContext!.tenantId,
        filters,
        format as 'csv' | 'json'
      );

      logger.info('Order history exported', {
        tenantId: req.tenantContext!.tenantId,
        userId: req.user!.id,
        format,
        filters,
        dataLength: exportData.length
      });

      // Set appropriate headers
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=order-history.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=order-history.json');
      }

      res.send(exportData);
    } catch (error) {
      logger.error('Failed to export order history:', error);
      next(error);
    }
  }
);

export default router;