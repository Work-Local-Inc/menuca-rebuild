import db from '@/database/connection';
import cache from '@/cache/memory';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed', 
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_id: string;
  restaurant_id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  tip_amount: number;
  currency: string;
  payment_status: string;
  payment_id?: string;
  delivery_address?: any;
  special_instructions?: string;
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  total_price: number;
  special_instructions?: string;
}

export interface CreateOrderRequest {
  customer_id: string;
  restaurant_id: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }>;
  delivery_address?: any;
  special_instructions?: string;
  tip_amount?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  restaurant_id?: string;
  customer_id?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export class OrderService {
  private pool: Pool;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'order:';

  constructor() {
    this.pool = db.getPool();
  }

  // =========================================
  // ORDER CREATION
  // =========================================

  async createOrder(tenantId: string, orderData: CreateOrderRequest): Promise<Order> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // Generate order number
      const orderNumber = await this.generateOrderNumber(client, tenantId);

      // Calculate totals
      const { subtotal, taxAmount, deliveryFee, totalAmount } = await this.calculateOrderTotals(
        client, 
        tenantId, 
        orderData.items, 
        orderData.restaurant_id
      );

      // Create order
      const orderId = uuidv4();
      const orderQuery = `
        INSERT INTO orders (
          id, tenant_id, customer_id, restaurant_id, order_number,
          status, total_amount, subtotal, tax_amount, delivery_fee, tip_amount,
          currency, payment_status, delivery_address, special_instructions,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        ) RETURNING *
      `;

      const orderResult = await client.query(orderQuery, [
        orderId,
        tenantId,
        orderData.customer_id,
        orderData.restaurant_id,
        orderNumber,
        OrderStatus.PENDING,
        totalAmount,
        subtotal,
        taxAmount,
        deliveryFee,
        orderData.tip_amount || 0,
        'usd',
        'pending',
        orderData.delivery_address ? JSON.stringify(orderData.delivery_address) : null,
        orderData.special_instructions
      ]);

      // Create order items
      for (const item of orderData.items) {
        const itemTotalPrice = item.price * item.quantity;
        
        await client.query(`
          INSERT INTO order_items (
            id, tenant_id, order_id, menu_item_id, quantity, price, total_price, special_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          uuidv4(),
          tenantId,
          orderId,
          item.menu_item_id,
          item.quantity,
          item.price,
          itemTotalPrice,
          item.special_instructions
        ]);
      }

      await client.query('COMMIT');

      const order = orderResult.rows[0];
      
      // Invalidate relevant caches
      await this.invalidateOrderCaches(tenantId, orderData.restaurant_id);
      
      return this.mapDatabaseOrder(order);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // =========================================
  // ORDER RETRIEVAL
  // =========================================

  async getOrder(tenantId: string, orderId: string): Promise<Order | null> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantId}:${orderId}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache miss for order:', error);
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const result = await client.query(
        'SELECT * FROM orders WHERE id = $1 AND tenant_id = $2',
        [orderId, tenantId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const order = this.mapDatabaseOrder(result.rows[0]);
      
      // Cache the result
      try {
        await cache.set(cacheKey, JSON.stringify(order), this.CACHE_TTL);
      } catch (error) {
        console.warn('Failed to cache order:', error);
      }

      return order;
    } finally {
      client.release();
    }
  }

  async getOrdersByFilter(tenantId: string, filters: OrderFilters = {}): Promise<Order[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      let query = 'SELECT * FROM orders WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      // Apply filters
      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters.restaurant_id) {
        query += ` AND restaurant_id = $${paramIndex}`;
        queryParams.push(filters.restaurant_id);
        paramIndex++;
      }

      if (filters.customer_id) {
        query += ` AND customer_id = $${paramIndex}`;
        queryParams.push(filters.customer_id);
        paramIndex++;
      }

      if (filters.start_date) {
        query += ` AND created_at >= $${paramIndex}`;
        queryParams.push(filters.start_date);
        paramIndex++;
      }

      if (filters.end_date) {
        query += ` AND created_at <= $${paramIndex}`;
        queryParams.push(filters.end_date);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        queryParams.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        queryParams.push(filters.offset);
      }

      const result = await client.query(query, queryParams);
      return result.rows.map(row => this.mapDatabaseOrder(row));
    } finally {
      client.release();
    }
  }

  async getOrderItems(tenantId: string, orderId: string): Promise<OrderItem[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const result = await client.query(`
        SELECT oi.*, mi.name as menu_item_name, mi.description as menu_item_description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = $1 AND oi.tenant_id = $2
        ORDER BY oi.created_at ASC
      `, [orderId, tenantId]);

      return result.rows.map(row => ({
        id: row.id,
        tenant_id: row.tenant_id,
        order_id: row.order_id,
        menu_item_id: row.menu_item_id,
        quantity: parseInt(row.quantity),
        price: parseFloat(row.price) / 100, // Convert cents to dollars
        total_price: parseFloat(row.total_price) / 100,
        special_instructions: row.special_instructions,
        menu_item_name: row.menu_item_name,
        menu_item_description: row.menu_item_description
      }));
    } finally {
      client.release();
    }
  }

  // =========================================
  // ORDER STATUS MANAGEMENT
  // =========================================

  async updateOrderStatus(
    tenantId: string, 
    orderId: string, 
    newStatus: OrderStatus,
    updatedBy?: string
  ): Promise<Order> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Validate status transition
      const currentOrder = await this.getOrder(tenantId, orderId);
      if (!currentOrder) {
        throw new Error('Order not found');
      }

      if (!this.isValidStatusTransition(currentOrder.status, newStatus)) {
        throw new Error(`Invalid status transition from ${currentOrder.status} to ${newStatus}`);
      }

      // Update order status
      const updateQuery = `
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        ${newStatus === OrderStatus.DELIVERED ? ', actual_delivery_time = NOW()' : ''}
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
      `;

      const result = await client.query(updateQuery, [newStatus, orderId, tenantId]);
      
      if (result.rows.length === 0) {
        throw new Error('Order not found or update failed');
      }

      const updatedOrder = this.mapDatabaseOrder(result.rows[0]);
      
      // Invalidate caches
      await this.invalidateOrderCaches(tenantId, currentOrder.restaurant_id);
      
      // Log status change
      console.log(`Order ${orderId} status changed from ${currentOrder.status} to ${newStatus}${updatedBy ? ` by ${updatedBy}` : ''}`);

      return updatedOrder;
    } finally {
      client.release();
    }
  }

  // =========================================
  // ORDER EXPORT
  // =========================================

  async exportOrderHistory(
    tenantId: string, 
    filters: OrderFilters = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const orders = await this.getOrdersByFilter(tenantId, filters);
    
    if (format === 'json') {
      return JSON.stringify(orders, null, 2);
    }

    // CSV format
    const headers = [
      'Order ID', 'Order Number', 'Restaurant', 'Customer', 'Status', 
      'Total Amount', 'Payment Status', 'Created At', 'Updated At'
    ];

    const csvRows = [headers.join(',')];
    
    for (const order of orders) {
      const row = [
        order.id,
        order.order_number,
        order.restaurant_id,
        order.customer_id,
        order.status,
        order.total_amount.toFixed(2),
        order.payment_status,
        order.created_at.toISOString(),
        order.updated_at.toISOString()
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  // =========================================
  // RESTAURANT DASHBOARD QUERIES
  // =========================================

  async getRestaurantOrderSummary(tenantId: string, restaurantId: string): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await client.query(`
        SELECT 
          COUNT(*) as total_orders_today,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
          COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
          COUNT(CASE WHEN status = 'out_for_delivery' THEN 1 END) as out_for_delivery_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue_today
        FROM orders 
        WHERE restaurant_id = $1 
          AND tenant_id = $2 
          AND created_at >= $3
      `, [restaurantId, tenantId, today]);

      const summary = result.rows[0];
      
      return {
        total_orders_today: parseInt(summary.total_orders_today),
        pending_orders: parseInt(summary.pending_orders),
        confirmed_orders: parseInt(summary.confirmed_orders),
        preparing_orders: parseInt(summary.preparing_orders),
        ready_orders: parseInt(summary.ready_orders),
        out_for_delivery_orders: parseInt(summary.out_for_delivery_orders),
        delivered_orders: parseInt(summary.delivered_orders),
        total_revenue_today: parseFloat(summary.total_revenue_today) / 100
      };
    } finally {
      client.release();
    }
  }

  // =========================================
  // PRIVATE HELPER METHODS
  // =========================================

  private async generateOrderNumber(client: any, tenantId: string): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
    `, [tenantId]);
    
    const dailyCount = parseInt(result.rows[0].count) + 1;
    const orderNumber = `${datePrefix}-${dailyCount.toString().padStart(4, '0')}`;
    
    return orderNumber;
  }

  private async calculateOrderTotals(
    client: any, 
    tenantId: string, 
    items: CreateOrderRequest['items'],
    restaurantId: string
  ): Promise<{ subtotal: number; taxAmount: number; deliveryFee: number; totalAmount: number }> {
    let subtotal = 0;
    
    // Calculate subtotal
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    // Get restaurant tax rate (default 8.25% if not specified)
    const taxResult = await client.query(`
      SELECT COALESCE(tax_rate, 8.25) as tax_rate 
      FROM restaurants 
      WHERE id = $1 AND tenant_id = $2
    `, [restaurantId, tenantId]);
    
    const taxRate = parseFloat(taxResult.rows[0]?.tax_rate || 8.25) / 100;
    const taxAmount = Math.round(subtotal * taxRate);
    
    // Default delivery fee (could be restaurant-specific)
    const deliveryFee = 299; // $2.99 in cents
    
    const totalAmount = subtotal + taxAmount + deliveryFee;

    return { subtotal, taxAmount, deliveryFee, totalAmount };
  }

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // Terminal state
      [OrderStatus.CANCELLED]: [] // Terminal state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private mapDatabaseOrder(dbOrder: any): Order {
    return {
      id: dbOrder.id,
      tenant_id: dbOrder.tenant_id,
      customer_id: dbOrder.customer_id,
      restaurant_id: dbOrder.restaurant_id,
      order_number: dbOrder.order_number,
      status: dbOrder.status as OrderStatus,
      total_amount: parseFloat(dbOrder.total_amount) / 100, // Convert cents to dollars
      subtotal: parseFloat(dbOrder.subtotal) / 100,
      tax_amount: parseFloat(dbOrder.tax_amount) / 100,
      delivery_fee: parseFloat(dbOrder.delivery_fee) / 100,
      tip_amount: parseFloat(dbOrder.tip_amount) / 100,
      currency: dbOrder.currency,
      payment_status: dbOrder.payment_status,
      payment_id: dbOrder.payment_id,
      delivery_address: dbOrder.delivery_address ? JSON.parse(dbOrder.delivery_address) : null,
      special_instructions: dbOrder.special_instructions,
      estimated_delivery_time: dbOrder.estimated_delivery_time,
      actual_delivery_time: dbOrder.actual_delivery_time,
      created_at: new Date(dbOrder.created_at),
      updated_at: new Date(dbOrder.updated_at)
    };
  }

  private async invalidateOrderCaches(tenantId: string, restaurantId: string): Promise<void> {
    try {
      // Implementation would depend on Redis client capabilities
      console.log(`Invalidating order caches for tenant ${tenantId} restaurant ${restaurantId}`);
    } catch (error) {
      console.warn('Failed to invalidate order caches:', error);
    }
  }
}

export const orderService = new OrderService();