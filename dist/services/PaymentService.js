"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const connection_1 = __importDefault(require("@/database/connection"));
const uuid_1 = require("uuid");
class PaymentService {
    stripe;
    pool;
    constructor() {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        this.stripe = new stripe_1.default(stripeSecretKey);
        this.pool = connection_1.default.getPool();
    }
    // =========================================
    // PAYMENT INTENT METHODS
    // =========================================
    async createPaymentIntent(tenantId, userId, request) {
        try {
            // Create Stripe Payment Intent
            const stripePaymentIntent = await this.stripe.paymentIntents.create({
                amount: request.amount,
                currency: request.currency || 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    tenant_id: tenantId,
                    user_id: userId,
                    order_id: request.orderId || '',
                    ...request.metadata
                },
            });
            // Save to database
            const paymentIntent = await this.savePaymentIntent(tenantId, userId, stripePaymentIntent, request.orderId);
            return paymentIntent;
        }
        catch (error) {
            console.error('Failed to create payment intent:', error);
            throw new Error('Failed to create payment intent');
        }
    }
    async getPaymentIntent(tenantId, paymentIntentId) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = `
        SELECT * FROM payment_intents 
        WHERE tenant_id = $1 AND id = $2
      `;
            const result = await client.query(query, [tenantId, paymentIntentId]);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    async updatePaymentIntentStatus(tenantId, paymentIntentId, stripePaymentIntent) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = `
        UPDATE payment_intents 
        SET status = $1, updated_at = NOW()
        WHERE tenant_id = $2 AND stripe_payment_intent_id = $3
        RETURNING *
      `;
            const result = await client.query(query, [
                stripePaymentIntent.status,
                tenantId,
                stripePaymentIntent.id
            ]);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    async confirmPaymentIntent(tenantId, paymentIntentId, paymentMethodId) {
        try {
            // Get our payment intent record
            const paymentIntent = await this.getPaymentIntent(tenantId, paymentIntentId);
            if (!paymentIntent) {
                throw new Error('Payment intent not found');
            }
            // Confirm with Stripe
            const stripePaymentIntent = await this.stripe.paymentIntents.confirm(paymentIntent.stripe_payment_intent_id, {
                payment_method: paymentMethodId,
                return_url: `${process.env.CLIENT_URL}/payment/complete`,
            });
            // Update our database
            await this.updatePaymentIntentStatus(tenantId, paymentIntentId, stripePaymentIntent);
            return stripePaymentIntent;
        }
        catch (error) {
            console.error('Failed to confirm payment intent:', error);
            throw new Error('Failed to confirm payment');
        }
    }
    // =========================================
    // PAYMENT METHOD METHODS
    // =========================================
    async savePaymentMethod(tenantId, userId, stripePaymentMethod, isDefault = false) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            // If this is set as default, unset other defaults
            if (isDefault) {
                await client.query('UPDATE payment_methods SET is_default = false WHERE tenant_id = $1 AND user_id = $2', [tenantId, userId]);
            }
            const paymentMethodId = (0, uuid_1.v4)();
            const query = `
        INSERT INTO payment_methods (
          id, tenant_id, user_id, stripe_payment_method_id, type, 
          card_last4, card_brand, is_default, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
            const params = [
                paymentMethodId,
                tenantId,
                userId,
                stripePaymentMethod.id,
                stripePaymentMethod.type,
                stripePaymentMethod.card?.last4 || null,
                stripePaymentMethod.card?.brand || null,
                isDefault
            ];
            const result = await client.query(query, params);
            await client.query('COMMIT');
            return result.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed to save payment method:', error);
            throw new Error('Failed to save payment method');
        }
        finally {
            client.release();
        }
    }
    async getUserPaymentMethods(tenantId, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = `
        SELECT * FROM payment_methods 
        WHERE tenant_id = $1 AND user_id = $2 
        ORDER BY is_default DESC, created_at DESC
      `;
            const result = await client.query(query, [tenantId, userId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    async deletePaymentMethod(tenantId, userId, paymentMethodId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            // Get the payment method to get Stripe ID
            const getQuery = 'SELECT stripe_payment_method_id FROM payment_methods WHERE tenant_id = $1 AND user_id = $2 AND id = $3';
            const getResult = await client.query(getQuery, [tenantId, userId, paymentMethodId]);
            if (getResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }
            const stripePaymentMethodId = getResult.rows[0].stripe_payment_method_id;
            // Detach from Stripe
            await this.stripe.paymentMethods.detach(stripePaymentMethodId);
            // Delete from our database
            const deleteQuery = 'DELETE FROM payment_methods WHERE tenant_id = $1 AND user_id = $2 AND id = $3';
            const deleteResult = await client.query(deleteQuery, [tenantId, userId, paymentMethodId]);
            await client.query('COMMIT');
            return deleteResult.rowCount > 0;
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed to delete payment method:', error);
            throw new Error('Failed to delete payment method');
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // WEBHOOK HANDLING
    // =========================================
    async handleWebhook(payload, signature) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET not configured');
        }
        try {
            const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'payment_method.attached':
                    await this.handlePaymentMethodAttached(event.data.object);
                    break;
                default:
                    console.log(`Unhandled webhook event type: ${event.type}`);
            }
        }
        catch (error) {
            console.error('Webhook handling failed:', error);
            throw error;
        }
    }
    async handlePaymentSucceeded(paymentIntent) {
        const tenantId = paymentIntent.metadata.tenant_id;
        const orderId = paymentIntent.metadata.order_id;
        if (tenantId) {
            // Update payment intent status
            await this.updatePaymentIntentStatus(tenantId, '', paymentIntent);
            // If there's an order, mark it as paid
            if (orderId) {
                await this.updateOrderPaymentStatus(tenantId, orderId, 'paid');
            }
        }
    }
    async handlePaymentFailed(paymentIntent) {
        const tenantId = paymentIntent.metadata.tenant_id;
        const orderId = paymentIntent.metadata.order_id;
        if (tenantId) {
            // Update payment intent status
            await this.updatePaymentIntentStatus(tenantId, '', paymentIntent);
            // If there's an order, mark it as payment failed
            if (orderId) {
                await this.updateOrderPaymentStatus(tenantId, orderId, 'payment_failed');
            }
        }
    }
    async handlePaymentMethodAttached(paymentMethod) {
        // Payment method attached to customer - we might want to save this
        console.log('Payment method attached:', paymentMethod.id);
    }
    // =========================================
    // UTILITY METHODS
    // =========================================
    async savePaymentIntent(tenantId, userId, stripePaymentIntent, orderId) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const paymentIntentId = (0, uuid_1.v4)();
            const query = `
        INSERT INTO payment_intents (
          id, tenant_id, user_id, order_id, stripe_payment_intent_id,
          amount, currency, status, client_secret, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;
            const params = [
                paymentIntentId,
                tenantId,
                userId,
                orderId || null,
                stripePaymentIntent.id,
                stripePaymentIntent.amount,
                stripePaymentIntent.currency,
                stripePaymentIntent.status,
                stripePaymentIntent.client_secret,
                JSON.stringify(stripePaymentIntent.metadata)
            ];
            const result = await client.query(query, params);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async updateOrderPaymentStatus(tenantId, orderId, status) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = `
        UPDATE orders 
        SET payment_status = $1, updated_at = NOW() 
        WHERE tenant_id = $2 AND id = $3
      `;
            await client.query(query, [status, tenantId, orderId]);
        }
        catch (error) {
            console.error('Failed to update order payment status:', error);
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // REFUND METHODS
    // =========================================
    async createRefund(tenantId, paymentIntentId, amount, reason) {
        try {
            const paymentIntent = await this.getPaymentIntent(tenantId, paymentIntentId);
            if (!paymentIntent) {
                throw new Error('Payment intent not found');
            }
            const refundParams = {
                payment_intent: paymentIntent.stripe_payment_intent_id,
                reason: reason || 'requested_by_customer',
                metadata: {
                    tenant_id: tenantId,
                    original_payment_intent: paymentIntentId
                }
            };
            // Only add amount if specified (undefined means full refund)
            if (amount !== undefined) {
                refundParams.amount = amount;
            }
            const refund = await this.stripe.refunds.create(refundParams);
            // You might want to save refund info to database here
            await this.saveRefundRecord(tenantId, paymentIntentId, refund);
            return refund;
        }
        catch (error) {
            console.error('Failed to create refund:', error);
            throw new Error('Failed to process refund');
        }
    }
    async saveRefundRecord(tenantId, paymentIntentId, refund) {
        const client = await this.pool.connect();
        try {
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = `
        INSERT INTO refunds (
          id, tenant_id, payment_intent_id, stripe_refund_id, amount, 
          currency, status, reason, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `;
            const params = [
                (0, uuid_1.v4)(),
                tenantId,
                paymentIntentId,
                refund.id,
                refund.amount,
                refund.currency,
                refund.status,
                refund.reason || null
            ];
            await client.query(query, params);
        }
        catch (error) {
            console.error('Failed to save refund record:', error);
            // Don't throw - refund was successful with Stripe
        }
        finally {
            client.release();
        }
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=PaymentService.js.map