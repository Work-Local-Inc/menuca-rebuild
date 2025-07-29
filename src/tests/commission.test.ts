import { describe, test, expect } from '@jest/globals';
import { commissionService } from '@/services/CommissionService';
import { testData } from './setup';
import { v4 as uuidv4 } from 'uuid';

describe('Commission Service', () => {
  describe('Commission Calculation', () => {
    test('should calculate commission correctly', async () => {
      const orderId = uuidv4();
      const grossAmount = 2000; // $20.00 in cents

      const commission = await commissionService.calculateOrderCommission(
        testData.tenantId,
        {
          orderId,
          restaurantId: testData.restaurantId,
          grossAmount,
          commissionRate: 15.0
        }
      );

      expect(commission).toBeDefined();
      expect(commission.order_id).toBe(orderId);
      expect(commission.restaurant_id).toBe(testData.restaurantId);
      expect(commission.gross_amount).toBe(grossAmount);
      expect(commission.commission_rate).toBe(15.0);
      expect(commission.commission_amount).toBe(300); // 15% of $20.00 = $3.00
      expect(commission.platform_fee).toBe(30); // $0.30 default platform fee
      expect(commission.net_amount).toBe(1670); // $20.00 - $3.00 - $0.30 = $16.70
      expect(commission.status).toBe('calculated');
    });

    test('should use restaurant default commission rate', async () => {
      const orderId = uuidv4();
      const grossAmount = 1000; // $10.00 in cents

      const commission = await commissionService.calculateOrderCommission(
        testData.tenantId,
        {
          orderId,
          restaurantId: testData.restaurantId,
          grossAmount
          // No commission rate provided - should use restaurant default (15%)
        }
      );

      expect(commission.commission_rate).toBe(15.0);
      expect(commission.commission_amount).toBe(150); // 15% of $10.00 = $1.50
    });

    test('should handle additional fees correctly', async () => {
      const orderId = uuidv4();
      const grossAmount = 2000; // $20.00 in cents

      const commission = await commissionService.calculateOrderCommission(
        testData.tenantId,
        {
          orderId,
          restaurantId: testData.restaurantId,
          grossAmount,
          commissionRate: 15.0,
          additionalFees: {
            delivery_fee: 200, // $2.00
            service_fee: 100   // $1.00
          }
        }
      );

      // Should include additional fees in platform_fee
      const expectedPlatformFee = 30 + 200 + 100; // Default + delivery + service
      expect(commission.platform_fee).toBe(expectedPlatformFee);
      expect(commission.net_amount).toBe(1370); // $20.00 - $3.00 - $3.30 = $13.70
    });
  });

  describe('Commission Queries', () => {
    let testOrderId: string;

    beforeEach(async () => {
      // Create a test commission
      testOrderId = uuidv4();
      await commissionService.calculateOrderCommission(
        testData.tenantId,
        {
          orderId: testOrderId,
          restaurantId: testData.restaurantId,
          grossAmount: 1500
        }
      );
    });

    test('should retrieve commissions by order', async () => {
      const commissions = await commissionService.getCommissionsByOrder(
        testData.tenantId,
        testOrderId
      );

      expect(commissions).toHaveLength(1);
      expect(commissions[0].order_id).toBe(testOrderId);
      expect(commissions[0].restaurant_id).toBe(testData.restaurantId);
    });

    test('should retrieve commissions by restaurant', async () => {
      const commissions = await commissionService.getCommissionsByRestaurant(
        testData.tenantId,
        testData.restaurantId
      );

      expect(commissions.length).toBeGreaterThan(0);
      expect(commissions[0].restaurant_id).toBe(testData.restaurantId);
    });

    test('should filter commissions by status', async () => {
      const commissions = await commissionService.getCommissionsByRestaurant(
        testData.tenantId,
        testData.restaurantId,
        undefined, // startDate
        undefined, // endDate
        'calculated'
      );

      expect(commissions.length).toBeGreaterThan(0);
      commissions.forEach(commission => {
        expect(commission.status).toBe('calculated');
      });
    });
  });

  describe('Commission Summaries', () => {
    test('should generate commission summary for restaurant', async () => {
      // Create a test commission first
      const orderId = uuidv4();
      await commissionService.calculateOrderCommission(
        testData.tenantId,
        {
          orderId,
          restaurantId: testData.restaurantId,
          grossAmount: 2000
        }
      );

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const summary = await commissionService.generateCommissionSummary(
        testData.tenantId,
        testData.restaurantId,
        startDate,
        endDate
      );

      expect(summary).toBeDefined();
      expect(summary.restaurant_id).toBe(testData.restaurantId);
      expect(summary.restaurant_name).toBe(testData.testRestaurant.name);
      expect(summary.total_orders).toBeGreaterThan(0);
      expect(summary.gross_revenue).toBeGreaterThan(0);
      expect(summary.total_commission).toBeGreaterThan(0);
      expect(summary.net_amount_due).toBeGreaterThan(0);
    });

    test('should generate tenant-wide commission report', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const report = await commissionService.generateTenantCommissionReport(
        testData.tenantId,
        startDate,
        endDate
      );

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.restaurants).toBeDefined();
      expect(Array.isArray(report.restaurants)).toBe(true);
    });
  });

  describe('Commission Status Management', () => {
    let testCommissionId: string;

    beforeEach(async () => {
      // Create a test commission
      const orderId = uuidv4();
      const commission = await commissionService.calculateOrderCommission(
        testData.tenantId,
        {
          orderId,
          restaurantId: testData.restaurantId,
          grossAmount: 1000
        }
      );
      testCommissionId = commission.id;
    });

    test('should update commission status', async () => {
      const updatedCommission = await commissionService.updateCommissionStatus(
        testData.tenantId,
        testCommissionId,
        'paid',
        { payment_reference: 'TEST_PAY_123' }
      );

      expect(updatedCommission).toBeDefined();
      expect(updatedCommission!.status).toBe('paid');
      expect(updatedCommission!.metadata.payment_reference).toBe('TEST_PAY_123');
    });

    test('should mark multiple commissions as paid', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const updatedCount = await commissionService.markCommissionsPaid(
        testData.tenantId,
        testData.restaurantId,
        startDate,
        endDate,
        'BATCH_PAY_123'
      );

      expect(updatedCount).toBeGreaterThan(0);
    });
  });

  describe('Commission Adjustments', () => {
    test('should create positive adjustment (credit)', async () => {
      const adjustment = await commissionService.createCommissionAdjustment(
        testData.tenantId,
        testData.restaurantId,
        500, // $5.00 credit
        'Promotional credit',
        { promotion_id: 'PROMO_123' }
      );

      expect(adjustment).toBeDefined();
      expect(adjustment.transaction_type).toBe('adjustment');
      expect(adjustment.net_amount).toBe(500);
      expect(adjustment.restaurant_id).toBe(testData.restaurantId);
      expect(adjustment.metadata.reason).toBe('Promotional credit');
      expect(adjustment.metadata.adjustment_type).toBe('credit');
    });

    test('should create negative adjustment (debit)', async () => {
      const adjustment = await commissionService.createCommissionAdjustment(
        testData.tenantId,
        testData.restaurantId,
        -300, // $3.00 debit
        'Chargeback fee',
        { chargeback_id: 'CB_456' }
      );

      expect(adjustment).toBeDefined();
      expect(adjustment.transaction_type).toBe('adjustment');
      expect(adjustment.net_amount).toBe(-300);
      expect(adjustment.metadata.adjustment_type).toBe('debit');
    });
  });
});