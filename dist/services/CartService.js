"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const redis_1 = __importDefault(require("@/cache/redis"));
const connection_1 = __importDefault(require("@/database/connection"));
class CartService {
    pool;
    CART_TTL = 24 * 60 * 60; // 24 hours in seconds
    CART_KEY_PREFIX = 'cart:';
    constructor() {
        this.pool = connection_1.default.getPool();
    }
    // =========================================
    // CART MANAGEMENT METHODS
    // =========================================
    async getCart(tenantId, userId) {
        const cartKey = this.getCartKey(tenantId, userId);
        try {
            const cartData = await redis_1.default.get(cartKey);
            if (!cartData) {
                return null;
            }
            const cart = JSON.parse(cartData);
            // Check if cart has expired
            if (new Date() > new Date(cart.expiresAt)) {
                await this.clearCart(tenantId, userId);
                return null;
            }
            return cart;
        }
        catch (error) {
            console.error('Failed to get cart from Redis:', error);
            // Fallback to database backup
            return this.getCartFromDatabase(tenantId, userId);
        }
    }
    async addToCart(tenantId, userId, request) {
        // First, get menu item details to validate and get pricing
        const menuItem = await this.getMenuItemById(tenantId, request.restaurantId, request.menuItemId);
        if (!menuItem) {
            throw new Error('Menu item not found');
        }
        if (menuItem.status !== 'available') {
            throw new Error('Menu item is not available');
        }
        // Get current cart
        let cart = await this.getCart(tenantId, userId);
        // If cart doesn't exist, create new one
        if (!cart) {
            cart = {
                userId,
                tenantId,
                restaurantId: request.restaurantId,
                items: [],
                subtotal: 0,
                itemCount: 0,
                lastUpdated: new Date(),
                expiresAt: new Date(Date.now() + this.CART_TTL * 1000)
            };
        }
        // Validate restaurant consistency (cart can only contain items from one restaurant)
        if (cart.restaurantId && cart.restaurantId !== request.restaurantId) {
            throw new Error('Cannot add items from different restaurants to the same cart');
        }
        cart.restaurantId = request.restaurantId;
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.menuItemId === request.menuItemId);
        if (existingItemIndex >= 0) {
            // Update quantity of existing item
            cart.items[existingItemIndex].quantity += request.quantity;
            cart.items[existingItemIndex].specialInstructions = request.specialInstructions || cart.items[existingItemIndex].specialInstructions;
        }
        else {
            // Add new item to cart
            const cartItem = {
                id: `${request.menuItemId}_${Date.now()}`,
                restaurantId: request.restaurantId,
                menuItemId: request.menuItemId,
                menuItemName: menuItem.name,
                menuItemPrice: menuItem.price,
                quantity: request.quantity,
                specialInstructions: request.specialInstructions || undefined,
                addedAt: new Date()
            };
            cart.items.push(cartItem);
        }
        // Recalculate totals
        this.recalculateCart(cart);
        // Save to Redis and database
        await this.saveCart(tenantId, cart);
        await this.backupCartToDatabase(tenantId, cart);
        return cart;
    }
    async updateCartItem(tenantId, userId, itemId, request) {
        const cart = await this.getCart(tenantId, userId);
        if (!cart) {
            throw new Error('Cart not found');
        }
        const itemIndex = cart.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            throw new Error('Cart item not found');
        }
        if (request.quantity !== undefined && request.quantity <= 0) {
            // Remove item if quantity is 0 or negative
            cart.items.splice(itemIndex, 1);
        }
        else {
            // Update item
            if (request.quantity !== undefined) {
                cart.items[itemIndex].quantity = request.quantity;
            }
            if (request.specialInstructions !== undefined) {
                cart.items[itemIndex].specialInstructions = request.specialInstructions;
            }
        }
        // If cart is empty, clear restaurant association
        if (cart.items.length === 0) {
            cart.restaurantId = undefined;
        }
        // Recalculate totals
        this.recalculateCart(cart);
        // Save to Redis and database
        await this.saveCart(tenantId, cart);
        await this.backupCartToDatabase(tenantId, cart);
        return cart;
    }
    async removeFromCart(tenantId, userId, itemId) {
        return this.updateCartItem(tenantId, userId, itemId, { quantity: 0 });
    }
    async clearCart(tenantId, userId) {
        const cartKey = this.getCartKey(tenantId, userId);
        // Clear from Redis
        await redis_1.default.del(cartKey);
        // Clear from database backup
        await this.clearCartFromDatabase(tenantId, userId);
    }
    async validateCart(tenantId, userId) {
        const cart = await this.getCart(tenantId, userId);
        const errors = [];
        if (!cart) {
            return { valid: false, errors: ['Cart is empty'] };
        }
        if (cart.items.length === 0) {
            return { valid: false, errors: ['Cart is empty'] };
        }
        // Validate each menu item
        for (const item of cart.items) {
            const menuItem = await this.getMenuItemById(tenantId, item.restaurantId, item.menuItemId);
            if (!menuItem) {
                errors.push(`Menu item "${item.menuItemName}" is no longer available`);
                continue;
            }
            if (menuItem.status !== 'available') {
                errors.push(`Menu item "${item.menuItemName}" is currently unavailable`);
            }
            if (menuItem.price !== item.menuItemPrice) {
                errors.push(`Price for "${item.menuItemName}" has changed from $${item.menuItemPrice} to $${menuItem.price}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    // =========================================
    // UTILITY METHODS
    // =========================================
    getCartKey(tenantId, userId) {
        return `${this.CART_KEY_PREFIX}${tenantId}:${userId}`;
    }
    recalculateCart(cart) {
        cart.subtotal = cart.items.reduce((total, item) => total + (item.menuItemPrice * item.quantity), 0);
        cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        cart.lastUpdated = new Date();
    }
    async saveCart(tenantId, cart) {
        const cartKey = this.getCartKey(tenantId, cart.userId);
        try {
            await redis_1.default.set(cartKey, JSON.stringify(cart), this.CART_TTL);
        }
        catch (error) {
            console.error('Failed to save cart to Redis:', error);
            throw new Error('Failed to save cart');
        }
    }
    async getMenuItemById(tenantId, restaurantId, menuItemId) {
        const client = await this.pool.connect();
        try {
            // Set tenant context for RLS
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = `
        SELECT id, name, price, status
        FROM menu_items
        WHERE restaurant_id = $1 AND id = $2
      `;
            const result = await client.query(query, [restaurantId, menuItemId]);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    // =========================================
    // DATABASE BACKUP METHODS
    // =========================================
    async backupCartToDatabase(tenantId, cart) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Set tenant context for RLS
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            // Clear existing cart items for this user
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [cart.userId]);
            // Insert current cart items
            if (cart.items.length > 0) {
                const values = cart.items.map((item, index) => {
                    const baseIndex = index * 6;
                    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
                }).join(', ');
                const params = cart.items.flatMap(item => [
                    tenantId,
                    cart.userId,
                    item.restaurantId,
                    item.menuItemId,
                    item.quantity,
                    item.specialInstructions || null
                ]);
                const query = `
          INSERT INTO cart_items (tenant_id, user_id, restaurant_id, menu_item_id, quantity, special_instructions)
          VALUES ${values}
        `;
                await client.query(query, params);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed to backup cart to database:', error);
            // Don't throw error - this is just a backup
        }
        finally {
            client.release();
        }
    }
    async getCartFromDatabase(tenantId, userId) {
        const client = await this.pool.connect();
        try {
            // Set tenant context for RLS
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            const query = `
        SELECT 
          ci.restaurant_id,
          ci.menu_item_id,
          ci.quantity,
          ci.special_instructions,
          ci.created_at as added_at,
          mi.name as menu_item_name,
          mi.price as menu_item_price
        FROM cart_items ci
        JOIN menu_items mi ON ci.menu_item_id = mi.id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at ASC
      `;
            const result = await client.query(query, [userId]);
            if (result.rows.length === 0) {
                return null;
            }
            const items = result.rows.map(row => ({
                id: `${row.menu_item_id}_${row.added_at.getTime()}`,
                restaurantId: row.restaurant_id,
                menuItemId: row.menu_item_id,
                menuItemName: row.menu_item_name,
                menuItemPrice: parseFloat(row.menu_item_price),
                quantity: row.quantity,
                specialInstructions: row.special_instructions,
                addedAt: row.added_at
            }));
            const cart = {
                userId,
                tenantId,
                restaurantId: items[0]?.restaurantId,
                items,
                subtotal: 0,
                itemCount: 0,
                lastUpdated: new Date(),
                expiresAt: new Date(Date.now() + this.CART_TTL * 1000)
            };
            this.recalculateCart(cart);
            // Save back to Redis for faster access
            await this.saveCart(tenantId, cart);
            return cart;
        }
        catch (error) {
            console.error('Failed to get cart from database:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    async clearCartFromDatabase(tenantId, userId) {
        const client = await this.pool.connect();
        try {
            // Set tenant context for RLS
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        }
        catch (error) {
            console.error('Failed to clear cart from database:', error);
        }
        finally {
            client.release();
        }
    }
}
exports.CartService = CartService;
//# sourceMappingURL=CartService.js.map