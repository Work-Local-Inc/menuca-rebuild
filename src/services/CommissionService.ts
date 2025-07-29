import db from '@/database/connection';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Commission {
  id: string;
  tenant_id: string;
  restaurant_id: string;
  order_id: string;
  transaction_type: 'order_commission' | 'delivery_fee' | 'service_fee' | 'adjustment';
  gross_amount: number; // Total order amount in cents
  commission_rate: number; // Percentage (e.g., 15.5 for 15.5%)
  commission_amount: number; // Calculated commission in cents
  platform_fee: number; // Additional platform fees in cents
  net_amount: number; // Amount to be paid to restaurant in cents
  currency: string;
  status: 'pending' | 'calculated' | 'paid' | 'disputed' | 'refunded';
  calculation_date: Date;
  payment_due_date: Date;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CommissionSummary {
  restaurant_id: string;
  restaurant_name: string;
  period_start: Date;
  period_end: Date;
  total_orders: number;
  gross_revenue: number;
  total_commission: number;
  total_platform_fees: number;
  net_amount_due: number;
  currency: string;
  status: 'pending' | 'calculated' | 'paid';
}

export interface CommissionCalculationRequest {
  orderId: string;
  restaurantId: string;
  grossAmount: number;
  commissionRate?: number; // Override default rate if provided
  additionalFees?: {
    delivery_fee?: number;
    service_fee?: number;
    processing_fee?: number;
  };
  metadata?: Record<string, any>;
}

export interface CommissionReport {
  summary: {
    total_restaurants: number;
    total_orders: number;
    total_gross_revenue: number;
    total_commissions: number;
    total_net_due: number;
    period_start: Date;
    period_end: Date;
  };
  restaurants: CommissionSummary[];
}

export class CommissionService {
  private pool: Pool;
  private readonly DEFAULT_COMMISSION_RATE = 15.0; // 15% default
  private readonly DEFAULT_PLATFORM_FEE = 0.30; // $0.30 in cents (30 cents)

  constructor() {
    this.pool = db.getPool();
  }

  // =========================================
  // COMMISSION CALCULATION METHODS
  // =========================================

  async calculateOrderCommission(
    tenantId: string,
    request: CommissionCalculationRequest
  ): Promise<Commission> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // Get restaurant's commission rate
      const commissionRate = request.commissionRate || await this.getRestaurantCommissionRate(
        tenantId, 
        request.restaurantId
      );

      // Calculate base commission
      const commissionAmount = Math.round(request.grossAmount * (commissionRate / 100));
      
      // Calculate additional fees
      const platformFee = Math.round(this.DEFAULT_PLATFORM_FEE * 100); // Convert to cents
      const deliveryFee = request.additionalFees?.delivery_fee || 0;
      const serviceFee = request.additionalFees?.service_fee || 0;
      const processingFee = request.additionalFees?.processing_fee || 0;
      
      const totalPlatformFees = platformFee + deliveryFee + serviceFee + processingFee;
      
      // Calculate net amount (what restaurant receives)
      const netAmount = request.grossAmount - commissionAmount - totalPlatformFees;

      // Create commission record
      const commission = await this.createCommissionRecord(tenantId, {
        restaurantId: request.restaurantId,
        orderId: request.orderId,
        transactionType: 'order_commission',
        grossAmount: request.grossAmount,
        commissionRate,
        commissionAmount,
        platformFee: totalPlatformFees,
        netAmount,
        metadata: request.metadata
      });

      // Create additional fee records if they exist
      if (deliveryFee > 0) {
        await this.createCommissionRecord(tenantId, {
          restaurantId: request.restaurantId,
          orderId: request.orderId,
          transactionType: 'delivery_fee',
          grossAmount: 0,
          commissionRate: 0,
          commissionAmount: 0,
          platformFee: deliveryFee,
          netAmount: -deliveryFee,
          metadata: { fee_type: 'delivery' }
        });
      }

      if (serviceFee > 0) {
        await this.createCommissionRecord(tenantId, {
          restaurantId: request.restaurantId,
          orderId: request.orderId,
          transactionType: 'service_fee',
          grossAmount: 0,
          commissionRate: 0,
          commissionAmount: 0,
          platformFee: serviceFee,
          netAmount: -serviceFee,
          metadata: { fee_type: 'service' }
        });
      }

      await client.query('COMMIT');
      return commission;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to calculate commission:', error);
      throw new Error('Commission calculation failed');
    } finally {
      client.release();
    }
  }

  async getCommissionsByOrder(tenantId: string, orderId: string): Promise<Commission[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        SELECT c.*, r.name as restaurant_name
        FROM commissions c
        JOIN restaurants r ON c.restaurant_id = r.id
        WHERE c.tenant_id = $1 AND c.order_id = $2
        ORDER BY c.created_at ASC
      `;
      
      const result = await client.query(query, [tenantId, orderId]);
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  async getCommissionsByRestaurant(
    tenantId: string,
    restaurantId: string,
    startDate?: Date,
    endDate?: Date,
    status?: string
  ): Promise<Commission[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      let query = `
        SELECT c.*, o.order_number
        FROM commissions c
        LEFT JOIN orders o ON c.order_id = o.id
        WHERE c.tenant_id = $1 AND c.restaurant_id = $2
      `;
      
      const params: any[] = [tenantId, restaurantId];
      let paramIndex = 3;

      if (startDate) {
        query += ` AND c.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND c.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (status) {
        query += ` AND c.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY c.created_at DESC`;
      
      const result = await client.query(query, params);
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  // =========================================
  // COMMISSION SUMMARY & REPORTING
  // =========================================

  async generateCommissionSummary(
    tenantId: string,
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommissionSummary> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        SELECT 
          r.id as restaurant_id,
          r.name as restaurant_name,
          COUNT(DISTINCT c.order_id) as total_orders,
          COALESCE(SUM(CASE WHEN c.transaction_type = 'order_commission' THEN c.gross_amount ELSE 0 END), 0) as gross_revenue,
          COALESCE(SUM(c.commission_amount), 0) as total_commission,
          COALESCE(SUM(c.platform_fee), 0) as total_platform_fees,
          COALESCE(SUM(c.net_amount), 0) as net_amount_due,
          'usd' as currency,
          CASE 
            WHEN COUNT(CASE WHEN c.status = 'paid' THEN 1 END) = COUNT(*) THEN 'paid'
            WHEN COUNT(CASE WHEN c.status = 'calculated' THEN 1 END) > 0 THEN 'calculated'
            ELSE 'pending'
          END as status
        FROM restaurants r
        LEFT JOIN commissions c ON r.id = c.restaurant_id 
          AND c.created_at >= $2 
          AND c.created_at <= $3
          AND c.tenant_id = $1
        WHERE r.tenant_id = $1 AND r.id = $4
        GROUP BY r.id, r.name
      `;
      
      const result = await client.query(query, [tenantId, startDate, endDate, restaurantId]);
      
      if (result.rows.length === 0) {
        throw new Error('Restaurant not found');
      }

      const row = result.rows[0];
      return {
        restaurant_id: row.restaurant_id,
        restaurant_name: row.restaurant_name,
        period_start: startDate,
        period_end: endDate,
        total_orders: parseInt(row.total_orders),
        gross_revenue: parseFloat(row.gross_revenue),
        total_commission: parseFloat(row.total_commission),
        total_platform_fees: parseFloat(row.total_platform_fees),
        net_amount_due: parseFloat(row.net_amount_due),
        currency: row.currency,
        status: row.status
      };
      
    } finally {
      client.release();
    }
  }

  async generateTenantCommissionReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommissionReport> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Get summary data
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT c.restaurant_id) as total_restaurants,
          COUNT(DISTINCT c.order_id) as total_orders,
          COALESCE(SUM(CASE WHEN c.transaction_type = 'order_commission' THEN c.gross_amount ELSE 0 END), 0) as total_gross_revenue,
          COALESCE(SUM(c.commission_amount), 0) as total_commissions,
          COALESCE(SUM(c.net_amount), 0) as total_net_due
        FROM commissions c
        WHERE c.tenant_id = $1 
          AND c.created_at >= $2 
          AND c.created_at <= $3
      `;
      
      const summaryResult = await client.query(summaryQuery, [tenantId, startDate, endDate]);
      const summaryRow = summaryResult.rows[0];

      // Get restaurant-level data
      const restaurantsQuery = `
        SELECT 
          r.id as restaurant_id,
          r.name as restaurant_name,
          COUNT(DISTINCT c.order_id) as total_orders,
          COALESCE(SUM(CASE WHEN c.transaction_type = 'order_commission' THEN c.gross_amount ELSE 0 END), 0) as gross_revenue,
          COALESCE(SUM(c.commission_amount), 0) as total_commission,
          COALESCE(SUM(c.platform_fee), 0) as total_platform_fees,
          COALESCE(SUM(c.net_amount), 0) as net_amount_due,
          'usd' as currency,
          CASE 
            WHEN COUNT(CASE WHEN c.status = 'paid' THEN 1 END) = COUNT(*) THEN 'paid'
            WHEN COUNT(CASE WHEN c.status = 'calculated' THEN 1 END) > 0 THEN 'calculated'
            ELSE 'pending'
          END as status
        FROM restaurants r
        LEFT JOIN commissions c ON r.id = c.restaurant_id 
          AND c.created_at >= $2 
          AND c.created_at <= $3
          AND c.tenant_id = $1
        WHERE r.tenant_id = $1
        GROUP BY r.id, r.name
        HAVING COUNT(c.id) > 0
        ORDER BY gross_revenue DESC
      `;
      
      const restaurantsResult = await client.query(restaurantsQuery, [tenantId, startDate, endDate]);
      
      const restaurants: CommissionSummary[] = restaurantsResult.rows.map(row => ({
        restaurant_id: row.restaurant_id,
        restaurant_name: row.restaurant_name,
        period_start: startDate,
        period_end: endDate,
        total_orders: parseInt(row.total_orders),
        gross_revenue: parseFloat(row.gross_revenue),
        total_commission: parseFloat(row.total_commission),
        total_platform_fees: parseFloat(row.total_platform_fees),
        net_amount_due: parseFloat(row.net_amount_due),
        currency: row.currency,
        status: row.status
      }));

      return {
        summary: {
          total_restaurants: parseInt(summaryRow.total_restaurants),
          total_orders: parseInt(summaryRow.total_orders),
          total_gross_revenue: parseFloat(summaryRow.total_gross_revenue),
          total_commissions: parseFloat(summaryRow.total_commissions),
          total_net_due: parseFloat(summaryRow.total_net_due),
          period_start: startDate,
          period_end: endDate
        },
        restaurants
      };
      
    } finally {
      client.release();
    }
  }

  // =========================================
  // COMMISSION STATUS MANAGEMENT
  // =========================================

  async updateCommissionStatus(
    tenantId: string,
    commissionId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<Commission | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        UPDATE commissions 
        SET status = $1, metadata = COALESCE(metadata, '{}'::jsonb) || $2, updated_at = NOW()
        WHERE tenant_id = $3 AND id = $4
        RETURNING *
      `;
      
      const result = await client.query(query, [
        status, 
        JSON.stringify(metadata || {}), 
        tenantId, 
        commissionId
      ]);
      
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }

  async markCommissionsPaid(
    tenantId: string,
    restaurantId: string,
    startDate: Date,
    endDate: Date,
    paymentReference?: string
  ): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        UPDATE commissions 
        SET status = 'paid', 
            metadata = COALESCE(metadata, '{}'::jsonb) || $1,
            updated_at = NOW()
        WHERE tenant_id = $2 
          AND restaurant_id = $3 
          AND created_at >= $4 
          AND created_at <= $5
          AND status = 'calculated'
      `;
      
      const metadata = {
        payment_date: new Date().toISOString(),
        payment_reference: paymentReference || null
      };
      
      const result = await client.query(query, [
        JSON.stringify(metadata),
        tenantId,
        restaurantId,
        startDate,
        endDate
      ]);
      
      return result.rowCount || 0;
      
    } finally {
      client.release();
    }
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  private async getRestaurantCommissionRate(tenantId: string, restaurantId: string): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = 'SELECT commission_rate FROM restaurants WHERE tenant_id = $1 AND id = $2';
      const result = await client.query(query, [tenantId, restaurantId]);
      
      if (result.rows.length === 0) {
        throw new Error('Restaurant not found');
      }
      
      return result.rows[0].commission_rate || this.DEFAULT_COMMISSION_RATE;
      
    } finally {
      client.release();
    }
  }

  private async createCommissionRecord(
    tenantId: string,
    data: {
      restaurantId: string;
      orderId: string;
      transactionType: string;
      grossAmount: number;
      commissionRate: number;
      commissionAmount: number;
      platformFee: number;
      netAmount: number;
      metadata?: any;
    }
  ): Promise<Commission> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const commissionId = uuidv4();
      const calculationDate = new Date();
      const paymentDueDate = new Date();
      paymentDueDate.setDate(paymentDueDate.getDate() + 7); // Payment due in 7 days

      const query = `
        INSERT INTO commissions (
          id, tenant_id, restaurant_id, order_id, transaction_type,
          gross_amount, commission_rate, commission_amount, platform_fee, net_amount,
          currency, status, calculation_date, payment_due_date, metadata,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        ) RETURNING *
      `;

      const params = [
        commissionId,
        tenantId,
        data.restaurantId,
        data.orderId,
        data.transactionType,
        data.grossAmount,
        data.commissionRate,
        data.commissionAmount,
        data.platformFee,
        data.netAmount,
        'usd',
        'calculated',
        calculationDate,
        paymentDueDate,
        JSON.stringify(data.metadata || {})
      ];

      const result = await client.query(query, params);
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  // =========================================
  // ADJUSTMENT METHODS
  // =========================================

  async createCommissionAdjustment(
    tenantId: string,
    restaurantId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<Commission> {
    return this.createCommissionRecord(tenantId, {
      restaurantId,
      orderId: `adj_${uuidv4()}`, // Use adjustment ID as order ID
      transactionType: 'adjustment',
      grossAmount: 0,
      commissionRate: 0,
      commissionAmount: 0,
      platformFee: 0,
      netAmount: amount, // Positive for credits, negative for debits
      metadata: {
        reason,
        adjustment_type: amount > 0 ? 'credit' : 'debit',
        ...metadata
      }
    });
  }
}

export const commissionService = new CommissionService();