"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CartService_1 = require("@/services/CartService");
const auth_1 = require("@/middleware/auth");
const winston_1 = __importDefault(require("winston"));
const router = express_1.default.Router();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [new winston_1.default.transports.Console()]
});
const cartService = new CartService_1.CartService();
// =========================================
// CART ROUTES
// =========================================
// Get user's cart
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req.tenantContext.tenantId, req.user.id);
        if (!cart) {
            res.json({
                userId: req.user.id,
                tenantId: req.tenantContext.tenantId,
                items: [],
                subtotal: 0,
                itemCount: 0,
                lastUpdated: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });
            return;
        }
        res.json(cart);
    }
    catch (error) {
        logger.error('Failed to get cart:', error);
        next(error);
    }
});
// Add item to cart
router.post('/items', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { restaurantId, menuItemId, quantity, specialInstructions } = req.body;
        // Validate required fields
        if (!restaurantId || !menuItemId || !quantity) {
            res.status(400).json({
                error: 'Missing required fields: restaurantId, menuItemId, quantity'
            });
            return;
        }
        if (quantity <= 0) {
            res.status(400).json({ error: 'Quantity must be greater than 0' });
            return;
        }
        const cart = await cartService.addToCart(req.tenantContext.tenantId, req.user.id, {
            restaurantId,
            menuItemId,
            quantity: parseInt(quantity),
            specialInstructions
        });
        res.status(201).json(cart);
    }
    catch (error) {
        logger.error('Failed to add item to cart:', error);
        if (error instanceof Error) {
            if (error.message.includes('not found') || error.message.includes('not available')) {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message.includes('different restaurants')) {
                res.status(400).json({ error: error.message });
                return;
            }
        }
        next(error);
    }
});
// Update cart item
router.put('/items/:itemId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { quantity, specialInstructions } = req.body;
        const { itemId } = req.params;
        if (quantity !== undefined && quantity < 0) {
            res.status(400).json({ error: 'Quantity cannot be negative' });
            return;
        }
        const updateRequest = { specialInstructions };
        if (quantity !== undefined) {
            updateRequest.quantity = parseInt(quantity);
        }
        const cart = await cartService.updateCartItem(req.tenantContext.tenantId, req.user.id, itemId, updateRequest);
        res.json(cart);
    }
    catch (error) {
        logger.error('Failed to update cart item:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        next(error);
    }
});
// Remove item from cart
router.delete('/items/:itemId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const cart = await cartService.removeFromCart(req.tenantContext.tenantId, req.user.id, itemId);
        res.json(cart);
    }
    catch (error) {
        logger.error('Failed to remove item from cart:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        next(error);
    }
});
// Clear entire cart
router.delete('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        await cartService.clearCart(req.tenantContext.tenantId, req.user.id);
        res.status(204).send();
    }
    catch (error) {
        logger.error('Failed to clear cart:', error);
        next(error);
    }
});
// Validate cart (check for price changes, availability, etc.)
router.get('/validate', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const validation = await cartService.validateCart(req.tenantContext.tenantId, req.user.id);
        res.json(validation);
    }
    catch (error) {
        logger.error('Failed to validate cart:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=cart.js.map