import express, { Request, Response, NextFunction } from 'express';
import { CartService } from '@/services/CartService';
import { authenticateToken, requireMinRole } from '@/middleware/auth';
import { UserRole } from '@/types/auth';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const cartService = new CartService();

// =========================================
// CART ROUTES
// =========================================

// Get user's cart
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await cartService.getCart(
      req.tenantContext!.tenantId,
      req.user!.id
    );

    if (!cart) {
      res.json({
        userId: req.user!.id,
        tenantId: req.tenantContext!.tenantId,
        items: [],
        subtotal: 0,
        itemCount: 0,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      return;
    }

    res.json(cart);
  } catch (error) {
    logger.error('Failed to get cart:', error);
    next(error);
  }
});

// Add item to cart
router.post('/items', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
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

    const cart = await cartService.addToCart(
      req.tenantContext!.tenantId,
      req.user!.id,
      {
        restaurantId,
        menuItemId,
        quantity: parseInt(quantity),
        specialInstructions
      }
    );

    res.status(201).json(cart);
  } catch (error) {
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
router.put('/items/:itemId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, specialInstructions } = req.body;
    const { itemId } = req.params;

    if (quantity !== undefined && quantity < 0) {
      res.status(400).json({ error: 'Quantity cannot be negative' });
      return;
    }

    const updateRequest: any = { specialInstructions };
    if (quantity !== undefined) {
      updateRequest.quantity = parseInt(quantity);
    }

    const cart = await cartService.updateCartItem(
      req.tenantContext!.tenantId,
      req.user!.id,
      itemId,
      updateRequest
    );

    res.json(cart);
  } catch (error) {
    logger.error('Failed to update cart item:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    next(error);
  }
});

// Remove item from cart
router.delete('/items/:itemId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;

    const cart = await cartService.removeFromCart(
      req.tenantContext!.tenantId,
      req.user!.id,
      itemId
    );

    res.json(cart);
  } catch (error) {
    logger.error('Failed to remove item from cart:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    next(error);
  }
});

// Clear entire cart
router.delete('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cartService.clearCart(
      req.tenantContext!.tenantId,
      req.user!.id
    );

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to clear cart:', error);
    next(error);
  }
});

// Validate cart (check for price changes, availability, etc.)
router.get('/validate', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = await cartService.validateCart(
      req.tenantContext!.tenantId,
      req.user!.id
    );

    res.json(validation);
  } catch (error) {
    logger.error('Failed to validate cart:', error);
    next(error);
  }
});

// =========================================
// CHECKOUT ROUTES
// =========================================

// Checkout cart and create order
router.post('/checkout',
  authenticateToken,
  requireMinRole(UserRole.CUSTOMER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { delivery_address, special_instructions, tip_amount } = req.body;

      const order = await cartService.checkoutCart(
        req.tenantContext!.tenantId,
        req.user!.id,
        delivery_address,
        special_instructions,
        tip_amount
      );

      logger.info('Cart checkout successful', {
        tenantId: req.tenantContext!.tenantId,
        userId: req.user!.id,
        orderId: order.id,
        restaurantId: order.restaurant_id,
        totalAmount: order.total_amount
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      logger.error('Cart checkout failed:', error);
      
      if (error instanceof Error && (error.message.includes('Cart is empty') || error.message.includes('Cart must contain items'))) {
        res.status(400).json({
          error: error.message
        });
        return;
      }
      
      next(error);
    }
  }
);

export default router;