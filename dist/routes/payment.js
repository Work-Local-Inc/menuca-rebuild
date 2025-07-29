"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PaymentService_1 = require("@/services/PaymentService");
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
// PAYMENT INTENT ROUTES
// =========================================
// Create payment intent
router.post('/intents', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { amount, currency, orderId, metadata } = req.body;
        // Validate input
        if (!amount || amount <= 0) {
            res.status(400).json({
                error: 'Valid amount is required (in cents)'
            });
            return;
        }
        const paymentIntent = await PaymentService_1.paymentService.createPaymentIntent(req.tenantContext.tenantId, req.user.id, {
            amount: parseInt(amount),
            currency: currency || 'usd',
            orderId,
            metadata
        });
        logger.info('Payment intent created', {
            paymentIntentId: paymentIntent.id,
            userId: req.user.id,
            amount: paymentIntent.amount,
            tenantId: req.tenantContext.tenantId
        });
        res.status(201).json({
            success: true,
            data: {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status
            }
        });
    }
    catch (error) {
        logger.error('Failed to create payment intent:', error);
        next(error);
    }
});
// Get payment intent
router.get('/intents/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const paymentIntent = await PaymentService_1.paymentService.getPaymentIntent(req.tenantContext.tenantId, req.params.id);
        if (!paymentIntent) {
            res.status(404).json({ error: 'Payment intent not found' });
            return;
        }
        // Only allow users to see their own payment intents (or admins)
        if (paymentIntent.user_id !== req.user.id &&
            ![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to view this payment intent' });
            return;
        }
        res.json({
            success: true,
            data: paymentIntent
        });
    }
    catch (error) {
        logger.error('Failed to get payment intent:', error);
        next(error);
    }
});
// Confirm payment intent
router.post('/intents/:id/confirm', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { paymentMethodId } = req.body;
        if (!paymentMethodId) {
            res.status(400).json({ error: 'Payment method ID is required' });
            return;
        }
        // Verify the payment intent belongs to the user
        const paymentIntent = await PaymentService_1.paymentService.getPaymentIntent(req.tenantContext.tenantId, req.params.id);
        if (!paymentIntent) {
            res.status(404).json({ error: 'Payment intent not found' });
            return;
        }
        if (paymentIntent.user_id !== req.user.id) {
            res.status(403).json({ error: 'Not authorized to confirm this payment' });
            return;
        }
        const stripePaymentIntent = await PaymentService_1.paymentService.confirmPaymentIntent(req.tenantContext.tenantId, req.params.id, paymentMethodId);
        logger.info('Payment intent confirmed', {
            paymentIntentId: req.params.id,
            userId: req.user.id,
            status: stripePaymentIntent.status
        });
        res.json({
            success: true,
            data: {
                id: stripePaymentIntent.id,
                status: stripePaymentIntent.status,
                clientSecret: stripePaymentIntent.client_secret
            }
        });
    }
    catch (error) {
        logger.error('Failed to confirm payment intent:', error);
        next(error);
    }
});
// =========================================
// PAYMENT METHOD ROUTES
// =========================================
// Get user's payment methods
router.get('/methods', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const paymentMethods = await PaymentService_1.paymentService.getUserPaymentMethods(req.tenantContext.tenantId, req.user.id);
        res.json({
            success: true,
            data: paymentMethods
        });
    }
    catch (error) {
        logger.error('Failed to get payment methods:', error);
        next(error);
    }
});
// Delete a payment method
router.delete('/methods/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const success = await PaymentService_1.paymentService.deletePaymentMethod(req.tenantContext.tenantId, req.user.id, req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Payment method not found' });
            return;
        }
        logger.info('Payment method deleted', {
            paymentMethodId: req.params.id,
            userId: req.user.id
        });
        res.status(204).send();
    }
    catch (error) {
        logger.error('Failed to delete payment method:', error);
        next(error);
    }
});
// =========================================
// REFUND ROUTES
// =========================================
// Create refund (admin only)
router.post('/intents/:id/refund', auth_1.authenticateToken, (0, auth_1.requireRole)([auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN]), async (req, res, next) => {
    try {
        const { amount, reason } = req.body;
        const refund = await PaymentService_1.paymentService.createRefund(req.tenantContext.tenantId, req.params.id, amount ? parseInt(amount) : undefined, reason);
        logger.info('Refund created', {
            paymentIntentId: req.params.id,
            refundId: refund.id,
            amount: refund.amount,
            adminUserId: req.user.id
        });
        res.status(201).json({
            success: true,
            data: {
                id: refund.id,
                amount: refund.amount,
                currency: refund.currency,
                status: refund.status,
                reason: refund.reason
            }
        });
    }
    catch (error) {
        logger.error('Failed to create refund:', error);
        next(error);
    }
});
// =========================================
// WEBHOOK ROUTE
// =========================================
// Stripe webhook endpoint
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            res.status(400).json({ error: 'Missing stripe-signature header' });
            return;
        }
        await PaymentService_1.paymentService.handleWebhook(req.body.toString(), signature);
        logger.info('Webhook processed successfully');
        res.status(200).json({ received: true });
    }
    catch (error) {
        logger.error('Webhook processing failed:', error);
        res.status(400).json({
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// =========================================
// UTILITY ROUTES
// =========================================
// Get Stripe publishable key for frontend
router.get('/config', (req, res) => {
    res.json({
        success: true,
        data: {
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
        }
    });
});
exports.default = router;
//# sourceMappingURL=payment.js.map