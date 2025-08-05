import cache from '@/cache/memory';
import db from '@/database/connection';
import { orderService } from '@/services/OrderService';
import { Pool } from 'pg';

export interface CartItem {
  id: string;
  restaurantId: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  specialInstructions?: string | undefined;
  addedAt: Date;
}

export interface Cart {
  userId: string;
  tenantId: string;
  restaurantId?: string | undefined; // Cart can only contain items from one restaurant
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  lastUpdated: Date;
  expiresAt: Date;
}

export interface AddToCartRequest {
  restaurantId: string;
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface UpdateCartItemRequest {
  quantity?: number;
  specialInstructions?: string;
}

export class CartService {
  private pool: Pool;
  private readonly CART_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly CART_KEY_PREFIX = 'cart:';

  constructor() {
    this.pool = db.getPool();
  }

  // =========================================
  // CART MANAGEMENT METHODS
  // =========================================

  async getCart(tenantId: string, userId: string): Promise<Cart | null> {
    const cartKey = this.getCartKey(tenantId, userId);
    
    try {
      const cartData = await cache.get(cartKey);
      
      if (!cartData) {
        return null;
      }

      const cart = JSON.parse(cartData) as Cart;
      
      // Check if cart has expired
      if (new Date() > new Date(cart.expiresAt)) {
        await this.clearCart(tenantId, userId);
        return null;
      }

      return cart;
    } catch (error) {
      console.error('Failed to get cart from Redis:', error);
      
      // Fallback to database backup
      return this.getCartFromDatabase(tenantId, userId);
    }
  }

  async addToCart(tenantId: string, userId: string, request: AddToCartRequest): Promise<Cart> {
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
    } else {
      // Add new item to cart
      const cartItem: CartItem = {
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

  async updateCartItem(tenantId: string, userId: string, itemId: string, request: UpdateCartItemRequest): Promise<Cart> {
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
    } else {
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

  async removeFromCart(tenantId: string, userId: string, itemId: string): Promise<Cart> {
    return this.updateCartItem(tenantId, userId, itemId, { quantity: 0 });
  }

  async clearCart(tenantId: string, userId: string): Promise<void> {
    const cartKey = this.getCartKey(tenantId, userId);
    
    // Clear from Redis
    await cache.del(cartKey);
    
    // Clear from database backup
    await this.clearCartFromDatabase(tenantId, userId);
  }

  async validateCart(tenantId: string, userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const cart = await this.getCart(tenantId, userId);
    const errors: string[] = [];
    
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

  private getCartKey(tenantId: string, userId: string): string {
    return `${this.CART_KEY_PREFIX}${tenantId}:${userId}`;
  }

  private recalculateCart(cart: Cart): void {
    cart.subtotal = cart.items.reduce((total, item) => total + (item.menuItemPrice * item.quantity), 0);
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.lastUpdated = new Date();
  }

  private async saveCart(tenantId: string, cart: Cart): Promise<void> {
    const cartKey = this.getCartKey(tenantId, cart.userId);
    
    try {
      await cache.set(cartKey, JSON.stringify(cart), this.CART_TTL);
    } catch (error) {
      console.error('Failed to save cart to Redis:', error);
      throw new Error('Failed to save cart');
    }
  }

  private async getMenuItemById(tenantId: string, restaurantId: string, menuItemId: string) {
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
      
    } finally {
      client.release();
    }
  }

  // =========================================
  // DATABASE BACKUP METHODS
  // =========================================

  private async backupCartToDatabase(tenantId: string, cart: Cart): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Set tenant context for RLS
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Clear existing cart items for this user
      await client.query(
        'DELETE FROM cart_items WHERE user_id = $1',
        [cart.userId]
      );
      
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
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to backup cart to database:', error);
      // Don't throw error - this is just a backup
    } finally {
      client.release();
    }
  }

  private async getCartFromDatabase(tenantId: string, userId: string): Promise<Cart | null> {
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
      
      const items: CartItem[] = result.rows.map(row => ({
        id: `${row.menu_item_id}_${row.added_at.getTime()}`,
        restaurantId: row.restaurant_id,
        menuItemId: row.menu_item_id,
        menuItemName: row.menu_item_name,
        menuItemPrice: parseFloat(row.menu_item_price),
        quantity: row.quantity,
        specialInstructions: row.special_instructions,
        addedAt: row.added_at
      }));
      
      const cart: Cart = {
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
      
    } catch (error) {
      console.error('Failed to get cart from database:', error);
      return null;
    } finally {
      client.release();
    }
  }

  private async clearCartFromDatabase(tenantId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Set tenant context for RLS
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      
    } catch (error) {
      console.error('Failed to clear cart from database:', error);
    } finally {
      client.release();
    }
  }

  // =========================================
  // CHECKOUT INTEGRATION
  // =========================================

  async checkoutCart(
    tenantId: string, 
    userId: string, 
    deliveryAddress?: any,
    specialInstructions?: string,
    tipAmount?: number
  ): Promise<any> {
    const cart = await this.getCart(tenantId, userId);
    
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    if (!cart.restaurantId) {
      throw new Error('Cart must contain items from a restaurant');
    }

    try {
      // Convert cart items to order format
      const orderItems = cart.items.map(item => {
        const orderItem: any = {
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          price: Math.round(item.menuItemPrice * 100), // Convert to cents
        };
        
        if (item.specialInstructions) {
          orderItem.special_instructions = item.specialInstructions;
        }
        
        return orderItem;
      });

      // Create order through OrderService
      const orderRequest: any = {
        customer_id: userId,
        restaurant_id: cart.restaurantId,
        items: orderItems,
        tip_amount: tipAmount ? Math.round(tipAmount * 100) : 0 // Convert to cents
      };

      if (deliveryAddress) {
        orderRequest.delivery_address = deliveryAddress;
      }

      if (specialInstructions) {
        orderRequest.special_instructions = specialInstructions;
      }

      const order = await orderService.createOrder(tenantId, orderRequest);

      // Clear the cart after successful order creation
      await this.clearCart(tenantId, userId);

      return order;
    } catch (error) {
      console.error('Checkout failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Checkout failed: ${errorMessage}`);
    }
  }
}

export const cartService = new CartService();