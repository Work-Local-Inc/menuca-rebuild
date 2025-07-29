export interface Restaurant {
    id: string;
    tenant_id: string;
    owner_id: string;
    name: string;
    description?: string;
    cuisine_type?: string;
    address: any;
    phone?: string;
    email?: string;
    website?: string;
    operating_hours?: any;
    delivery_radius_km: number;
    min_order_amount: number;
    commission_rate?: number;
    status: 'active' | 'inactive' | 'pending_approval' | 'suspended';
    featured: boolean;
    rating: number;
    review_count: number;
    created_at: Date;
    updated_at: Date;
}
export interface MenuCategory {
    id: string;
    tenant_id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    display_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface MenuItem {
    id: string;
    tenant_id: string;
    restaurant_id: string;
    category_id?: string;
    name: string;
    description?: string;
    price: number;
    cost?: number;
    preparation_time_minutes: number;
    calories?: number;
    ingredients?: string[];
    allergens?: string[];
    dietary_tags?: string[];
    image_url?: string;
    status: 'available' | 'unavailable' | 'seasonal' | 'discontinued';
    is_featured: boolean;
    display_order: number;
    created_at: Date;
    updated_at: Date;
}
export interface RestaurantFilters {
    cuisine?: string;
    featured?: boolean;
    status?: string;
}
export interface MenuItemFilters {
    category?: string;
    status?: string;
    featured?: boolean;
}
export interface PaginationOptions {
    page: number;
    limit: number;
    filters?: RestaurantFilters;
}
export declare class MenuService {
    private pool;
    constructor();
    getRestaurants(tenantId: string, options: PaginationOptions): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getRestaurantById(tenantId: string, restaurantId: string): Promise<Restaurant | null>;
    createRestaurant(tenantId: string, ownerId: string, data: Partial<Restaurant>): Promise<Restaurant>;
    updateRestaurant(tenantId: string, restaurantId: string, data: Partial<Restaurant>): Promise<Restaurant | null>;
    getMenuCategories(tenantId: string, restaurantId: string): Promise<MenuCategory[]>;
    createMenuCategory(tenantId: string, restaurantId: string, data: Partial<MenuCategory>): Promise<MenuCategory>;
    getMenuItems(tenantId: string, restaurantId: string, filters?: MenuItemFilters): Promise<MenuItem[]>;
    getMenuItemById(tenantId: string, restaurantId: string, itemId: string): Promise<MenuItem | null>;
    createMenuItem(tenantId: string, restaurantId: string, data: Partial<MenuItem>): Promise<MenuItem>;
    updateMenuItem(tenantId: string, restaurantId: string, itemId: string, data: Partial<MenuItem>): Promise<MenuItem | null>;
    deleteMenuItem(tenantId: string, restaurantId: string, itemId: string): Promise<boolean>;
    private executeWithTenant;
}
//# sourceMappingURL=MenuService.d.ts.map