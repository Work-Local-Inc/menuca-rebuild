import Stripe from 'stripe';
import db from '@/database/connection';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentIntent {
  id: string;
  tenant_id: string;
  user_id: string;
  order_id?: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency?: string;
  orderId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: string;
  card_last4?: string;
  card_brand?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PaymentService {
  private stripe: Stripe;
  private pool: Pool;

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(stripeSecretKey);
    this.pool = db.getPool();
  }

  // =========================================
  // PAYMENT INTENT METHODS
  // =========================================

  async createPaymentIntent(
    tenantId: string, 
    userId: string, 
    request: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> {
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
      const paymentIntent = await this.savePaymentIntent(
        tenantId,
        userId,
        stripePaymentIntent,
        request.orderId
      );

      return paymentIntent;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async getPaymentIntent(tenantId: string, paymentIntentId: string): Promise<PaymentIntent | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        SELECT * FROM payment_intents 
        WHERE tenant_id = $1 AND id = $2
      `;
      
      const result = await client.query(query, [tenantId, paymentIntentId]);
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }

  async updatePaymentIntentStatus(
    tenantId: string, 
    paymentIntentId: string, 
    stripePaymentIntent: Stripe.PaymentIntent
  ): Promise<PaymentIntent | null> {
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
      
    } finally {
      client.release();
    }
  }

  async confirmPaymentIntent(
    tenantId: string, 
    paymentIntentId: string, 
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Get our payment intent record
      const paymentIntent = await this.getPaymentIntent(tenantId, paymentIntentId);
      
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Confirm with Stripe
      const stripePaymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntent.stripe_payment_intent_id,
        {
          payment_method: paymentMethodId,
          return_url: `${process.env.CLIENT_URL}/payment/complete`,
        }
      );

      // Update our database
      await this.updatePaymentIntentStatus(tenantId, paymentIntentId, stripePaymentIntent);

      return stripePaymentIntent;
    } catch (error) {
      console.error('Failed to confirm payment intent:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  // =========================================
  // PAYMENT METHOD METHODS
  // =========================================

  async savePaymentMethod(
    tenantId: string,
    userId: string,
    stripePaymentMethod: Stripe.PaymentMethod,
    isDefault: boolean = false
  ): Promise<PaymentMethod> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // If this is set as default, unset other defaults
      if (isDefault) {
        await client.query(
          'UPDATE payment_methods SET is_default = false WHERE tenant_id = $1 AND user_id = $2',
          [tenantId, userId]
        );
      }

      const paymentMethodId = uuidv4();
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
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to save payment method:', error);
      throw new Error('Failed to save payment method');
    } finally {
      client.release();
    }
  }

  async getUserPaymentMethods(tenantId: string, userId: string): Promise<PaymentMethod[]> {
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
      
    } finally {
      client.release();
    }
  }

  async deletePaymentMethod(tenantId: string, userId: string, paymentMethodId: string): Promise<boolean> {
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
      return deleteResult.rowCount! > 0;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to delete payment method:', error);
      throw new Error('Failed to delete payment method');
    } finally {
      client.release();
    }
  }

  // =========================================
  // WEBHOOK HANDLING
  // =========================================

  async handleWebhook(payload: string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    // Payment method attached to customer - we might want to save this
    console.log('Payment method attached:', paymentMethod.id);
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  private async savePaymentIntent(
    tenantId: string,
    userId: string,
    stripePaymentIntent: Stripe.PaymentIntent,
    orderId?: string
  ): Promise<PaymentIntent> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const paymentIntentId = uuidv4();
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
      
    } finally {
      client.release();
    }
  }

  private async updateOrderPaymentStatus(tenantId: string, orderId: string, status: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const query = `
        UPDATE orders 
        SET payment_status = $1, updated_at = NOW() 
        WHERE tenant_id = $2 AND id = $3
      `;
      
      await client.query(query, [status, tenantId, orderId]);
      
    } catch (error) {
      console.error('Failed to update order payment status:', error);
    } finally {
      client.release();
    }
  }

  // =========================================
  // REFUND METHODS
  // =========================================

  async createRefund(
    tenantId: string,
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const paymentIntent = await this.getPaymentIntent(tenantId, paymentIntentId);
      
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntent.stripe_payment_intent_id,
        reason: (reason as Stripe.RefundCreateParams.Reason) || 'requested_by_customer',
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
    } catch (error) {
      console.error('Failed to create refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  private async saveRefundRecord(tenantId: string, paymentIntentId: string, refund: Stripe.Refund): Promise<void> {
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
        uuidv4(),
        tenantId,
        paymentIntentId,
        refund.id,
        refund.amount,
        refund.currency,
        refund.status,
        refund.reason || null
      ];

      await client.query(query, params);
      
    } catch (error) {
      console.error('Failed to save refund record:', error);
      // Don't throw - refund was successful with Stripe
    } finally {
      client.release();
    }
  }
}

export const paymentService = new PaymentService();