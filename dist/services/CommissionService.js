"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionService = exports.CommissionService = void 0;
const connection_1 = __importDefault(require("@/database/connection"));
const uuid_1 = require("uuid");
class CommissionService {
    pool;
    DEFAULT_COMMISSION_RATE = 15.0; // 15% default
    DEFAULT_PLATFORM_FEE = 0.30; // $0.30 in cents (30 cents)
    constructor() {
        this.pool = connection_1.default.getPool();
    }
    // =========================================
    // COMMISSION CALCULATION METHODS
    // =========================================
    async calculateOrderCommission(tenantId, request) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            // Get restaurant's commission rate
            const commissionRate = request.commissionRate || await this.getRestaurantCommissionRate(tenantId, request.restaurantId);
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
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed to calculate commission:', error);
            throw new Error('Commission calculation failed');
        }
        finally {
            client.release();
        }
    }
    async getCommissionsByOrder(tenantId, orderId) {
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
        }
        finally {
            client.release();
        }
    }
    async getCommissionsByRestaurant(tenantId, restaurantId, startDate, endDate, status) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            let query = `
        SELECT c.*, o.order_number
        FROM commissions c
        LEFT JOIN orders o ON c.order_id = o.id
        WHERE c.tenant_id = $1 AND c.restaurant_id = $2
      `;
            const params = [tenantId, restaurantId];
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
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // COMMISSION SUMMARY & REPORTING
    // =========================================
    async generateCommissionSummary(tenantId, restaurantId, startDate, endDate) {
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
        }
        finally {
            client.release();
        }
    }
    async generateTenantCommissionReport(tenantId, startDate, endDate) {
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
            const restaurants = restaurantsResult.rows.map(row => ({
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
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // COMMISSION STATUS MANAGEMENT
    // =========================================
    async updateCommissionStatus(tenantId, commissionId, status, metadata) {
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
        }
        finally {
            client.release();
        }
    }
    async markCommissionsPaid(tenantId, restaurantId, startDate, endDate, paymentReference) {
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
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // UTILITY METHODS
    // =========================================
    async getRestaurantCommissionRate(tenantId, restaurantId) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = 'SELECT commission_rate FROM restaurants WHERE tenant_id = $1 AND id = $2';
            const result = await client.query(query, [tenantId, restaurantId]);
            if (result.rows.length === 0) {
                throw new Error('Restaurant not found');
            }
            return result.rows[0].commission_rate || this.DEFAULT_COMMISSION_RATE;
        }
        finally {
            client.release();
        }
    }
    async createCommissionRecord(tenantId, data) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const commissionId = (0, uuid_1.v4)();
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
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // ADJUSTMENT METHODS
    // =========================================
    async createCommissionAdjustment(tenantId, restaurantId, amount, reason, metadata) {
        return this.createCommissionRecord(tenantId, {
            restaurantId,
            orderId: `adj_${(0, uuid_1.v4)()}`, // Use adjustment ID as order ID
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
exports.CommissionService = CommissionService;
exports.commissionService = new CommissionService();
//# sourceMappingURL=CommissionService.js.map