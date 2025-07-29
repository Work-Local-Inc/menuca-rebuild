"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CommissionService_1 = require("@/services/CommissionService");
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
// COMMISSION CALCULATION ROUTES
// =========================================
// Calculate commission for an order (internal use or admin)
router.post('/calculate', auth_1.authenticateToken, (0, auth_1.requireRole)([auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN]), async (req, res, next) => {
    try {
        const { orderId, restaurantId, grossAmount, commissionRate, additionalFees, metadata } = req.body;
        // Validate required fields
        if (!orderId || !restaurantId || !grossAmount) {
            res.status(400).json({
                error: 'Missing required fields: orderId, restaurantId, grossAmount'
            });
            return;
        }
        if (grossAmount <= 0) {
            res.status(400).json({ error: 'Gross amount must be greater than 0' });
            return;
        }
        const commission = await CommissionService_1.commissionService.calculateOrderCommission(req.tenantContext.tenantId, {
            orderId,
            restaurantId,
            grossAmount: Math.round(grossAmount * 100), // Convert to cents
            commissionRate,
            additionalFees: additionalFees ? {
                ...(additionalFees.delivery_fee && { delivery_fee: Math.round(additionalFees.delivery_fee * 100) }),
                ...(additionalFees.service_fee && { service_fee: Math.round(additionalFees.service_fee * 100) }),
                ...(additionalFees.processing_fee && { processing_fee: Math.round(additionalFees.processing_fee * 100) })
            } : undefined,
            metadata
        });
        logger.info('Commission calculated', {
            commissionId: commission.id,
            orderId,
            restaurantId,
            grossAmount: commission.gross_amount,
            commissionAmount: commission.commission_amount,
            netAmount: commission.net_amount,
            adminUserId: req.user.id
        });
        res.status(201).json({
            success: true,
            data: {
                ...commission,
                // Convert cents back to dollars for API response
                gross_amount: commission.gross_amount / 100,
                commission_amount: commission.commission_amount / 100,
                platform_fee: commission.platform_fee / 100,
                net_amount: commission.net_amount / 100
            }
        });
    }
    catch (error) {
        logger.error('Failed to calculate commission:', error);
        next(error);
    }
});
// =========================================
// COMMISSION QUERY ROUTES
// =========================================
// Get commissions for a specific order
router.get('/orders/:orderId', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.MANAGER), async (req, res, next) => {
    try {
        const commissions = await CommissionService_1.commissionService.getCommissionsByOrder(req.tenantContext.tenantId, req.params.orderId);
        // Convert cents to dollars for API response
        const formattedCommissions = commissions.map(commission => ({
            ...commission,
            gross_amount: commission.gross_amount / 100,
            commission_amount: commission.commission_amount / 100,
            platform_fee: commission.platform_fee / 100,
            net_amount: commission.net_amount / 100
        }));
        res.json({
            success: true,
            data: formattedCommissions
        });
    }
    catch (error) {
        logger.error('Failed to get order commissions:', error);
        next(error);
    }
});
// Get commissions for a restaurant
router.get('/restaurants/:restaurantId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { startDate, endDate, status } = req.query;
        // Authorization: Restaurant owners can see their own, admins can see all
        if (req.user.role === auth_2.UserRole.MANAGER) {
            // TODO: Verify the user owns this restaurant
            // This would require checking restaurant ownership in the database
        }
        else if (![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to view restaurant commissions' });
            return;
        }
        const commissions = await CommissionService_1.commissionService.getCommissionsByRestaurant(req.tenantContext.tenantId, req.params.restaurantId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, status);
        // Convert cents to dollars for API response
        const formattedCommissions = commissions.map(commission => ({
            ...commission,
            gross_amount: commission.gross_amount / 100,
            commission_amount: commission.commission_amount / 100,
            platform_fee: commission.platform_fee / 100,
            net_amount: commission.net_amount / 100
        }));
        res.json({
            success: true,
            data: formattedCommissions
        });
    }
    catch (error) {
        logger.error('Failed to get restaurant commissions:', error);
        next(error);
    }
});
// =========================================
// COMMISSION SUMMARY & REPORTING ROUTES
// =========================================
// Get commission summary for a restaurant
router.get('/restaurants/:restaurantId/summary', auth_1.authenticateToken, (0, auth_1.requireMinRole)(auth_2.UserRole.MANAGER), async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate and endDate are required' });
            return;
        }
        // Authorization check (same as above)
        if (req.user.role === auth_2.UserRole.MANAGER) {
            // TODO: Verify the user owns this restaurant
        }
        else if (![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to view restaurant commission summary' });
            return;
        }
        const summary = await CommissionService_1.commissionService.generateCommissionSummary(req.tenantContext.tenantId, req.params.restaurantId, new Date(startDate), new Date(endDate));
        // Convert cents to dollars for API response
        const formattedSummary = {
            ...summary,
            gross_revenue: summary.gross_revenue / 100,
            total_commission: summary.total_commission / 100,
            total_platform_fees: summary.total_platform_fees / 100,
            net_amount_due: summary.net_amount_due / 100
        };
        res.json({
            success: true,
            data: formattedSummary
        });
    }
    catch (error) {
        logger.error('Failed to get commission summary:', error);
        next(error);
    }
});
// Get tenant-wide commission report (admin only)
router.get('/reports/tenant', auth_1.authenticateToken, (0, auth_1.requireRole)([auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN]), async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate and endDate are required' });
            return;
        }
        const report = await CommissionService_1.commissionService.generateTenantCommissionReport(req.tenantContext.tenantId, new Date(startDate), new Date(endDate));
        // Convert cents to dollars for API response
        const formattedReport = {
            summary: {
                ...report.summary,
                total_gross_revenue: report.summary.total_gross_revenue / 100,
                total_commissions: report.summary.total_commissions / 100,
                total_net_due: report.summary.total_net_due / 100
            },
            restaurants: report.restaurants.map(restaurant => ({
                ...restaurant,
                gross_revenue: restaurant.gross_revenue / 100,
                total_commission: restaurant.total_commission / 100,
                total_platform_fees: restaurant.total_platform_fees / 100,
                net_amount_due: restaurant.net_amount_due / 100
            }))
        };
        logger.info('Tenant commission report generated', {
            tenantId: req.tenantContext.tenantId,
            startDate,
            endDate,
            totalRestaurants: report.summary.total_restaurants,
            totalRevenue: report.summary.total_gross_revenue,
            adminUserId: req.user.id
        });
        res.json({
            success: true,
            data: formattedReport
        });
    }
    catch (error) {
        logger.error('Failed to generate commission report:', error);
        next(error);
    }
});
// =========================================
// COMMISSION STATUS MANAGEMENT ROUTES
// =========================================
// Update commission status (admin only)
router.put('/:commissionId/status', auth_1.authenticateToken, (0, auth_1.requireRole)([auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN]), async (req, res, next) => {
    try {
        const { status, metadata } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }
        const validStatuses = ['pending', 'calculated', 'paid', 'disputed', 'refunded'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                error: 'Invalid status',
                validStatuses
            });
            return;
        }
        const commission = await CommissionService_1.commissionService.updateCommissionStatus(req.tenantContext.tenantId, req.params.commissionId, status, metadata);
        if (!commission) {
            res.status(404).json({ error: 'Commission not found' });
            return;
        }
        logger.info('Commission status updated', {
            commissionId: req.params.commissionId,
            oldStatus: commission.status,
            newStatus: status,
            adminUserId: req.user.id
        });
        res.json({
            success: true,
            data: {
                ...commission,
                gross_amount: commission.gross_amount / 100,
                commission_amount: commission.commission_amount / 100,
                platform_fee: commission.platform_fee / 100,
                net_amount: commission.net_amount / 100
            }
        });
    }
    catch (error) {
        logger.error('Failed to update commission status:', error);
        next(error);
    }
});
// Mark commissions as paid for a restaurant (admin only)
router.post('/restaurants/:restaurantId/mark-paid', auth_1.authenticateToken, (0, auth_1.requireRole)([auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN]), async (req, res, next) => {
    try {
        const { startDate, endDate, paymentReference } = req.body;
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate and endDate are required' });
            return;
        }
        const updatedCount = await CommissionService_1.commissionService.markCommissionsPaid(req.tenantContext.tenantId, req.params.restaurantId, new Date(startDate), new Date(endDate), paymentReference);
        logger.info('Commissions marked as paid', {
            restaurantId: req.params.restaurantId,
            startDate,
            endDate,
            updatedCount,
            paymentReference,
            adminUserId: req.user.id
        });
        res.json({
            success: true,
            data: {
                message: `${updatedCount} commissions marked as paid`,
                updatedCount,
                paymentReference
            }
        });
    }
    catch (error) {
        logger.error('Failed to mark commissions as paid:', error);
        next(error);
    }
});
// =========================================
// COMMISSION ADJUSTMENT ROUTES
// =========================================
// Create commission adjustment (admin only)
router.post('/adjustments', auth_1.authenticateToken, (0, auth_1.requireRole)([auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN]), async (req, res, next) => {
    try {
        const { restaurantId, amount, reason, metadata } = req.body;
        if (!restaurantId || amount === undefined || !reason) {
            res.status(400).json({
                error: 'Missing required fields: restaurantId, amount, reason'
            });
            return;
        }
        if (amount === 0) {
            res.status(400).json({ error: 'Adjustment amount cannot be zero' });
            return;
        }
        const adjustment = await CommissionService_1.commissionService.createCommissionAdjustment(req.tenantContext.tenantId, restaurantId, Math.round(amount * 100), // Convert to cents
        reason, metadata);
        logger.info('Commission adjustment created', {
            adjustmentId: adjustment.id,
            restaurantId,
            amount: adjustment.net_amount,
            reason,
            adminUserId: req.user.id
        });
        res.status(201).json({
            success: true,
            data: {
                ...adjustment,
                gross_amount: adjustment.gross_amount / 100,
                commission_amount: adjustment.commission_amount / 100,
                platform_fee: adjustment.platform_fee / 100,
                net_amount: adjustment.net_amount / 100
            }
        });
    }
    catch (error) {
        logger.error('Failed to create commission adjustment:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=commission.js.map