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
    restaurantId?: string | undefined;
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
export declare class CartService {
    private pool;
    private readonly CART_TTL;
    private readonly CART_KEY_PREFIX;
    constructor();
    getCart(tenantId: string, userId: string): Promise<Cart | null>;
    addToCart(tenantId: string, userId: string, request: AddToCartRequest): Promise<Cart>;
    updateCartItem(tenantId: string, userId: string, itemId: string, request: UpdateCartItemRequest): Promise<Cart>;
    removeFromCart(tenantId: string, userId: string, itemId: string): Promise<Cart>;
    clearCart(tenantId: string, userId: string): Promise<void>;
    validateCart(tenantId: string, userId: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    private getCartKey;
    private recalculateCart;
    private saveCart;
    private getMenuItemById;
    private backupCartToDatabase;
    private getCartFromDatabase;
    private clearCartFromDatabase;
}
//# sourceMappingURL=CartService.d.ts.map