"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const connection_1 = __importDefault(require("@/database/connection"));
class MenuService {
    pool;
    constructor() {
        this.pool = connection_1.default.getPool();
    }
    // =========================================
    // RESTAURANT METHODS
    // =========================================
    async getRestaurants(tenantId, options) {
        const { page, limit, filters = {} } = options;
        const offset = (page - 1) * limit;
        // Build dynamic WHERE clause (RLS handles tenant isolation)
        const conditions = [];
        const baseParams = [];
        let paramIndex = 1;
        if (filters.cuisine) {
            conditions.push(`cuisine_type = $${paramIndex}`);
            baseParams.push(filters.cuisine);
            paramIndex++;
        }
        if (filters.featured !== undefined) {
            conditions.push(`featured = $${paramIndex}`);
            baseParams.push(filters.featured);
            paramIndex++;
        }
        if (filters.status) {
            conditions.push(`status = $${paramIndex}`);
            baseParams.push(filters.status);
            paramIndex++;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        // Get total count
        const countQuery = `
      SELECT COUNT(*) as total
      FROM restaurants
      ${whereClause}
    `.trim();
        // Get restaurants with pagination
        const dataQuery = `
      SELECT *
      FROM restaurants
      ${whereClause}
      ORDER BY featured DESC, rating DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `.trim();
        const dataParams = [...baseParams, limit, offset];
        const [countResult, dataResult] = await Promise.all([
            this.executeWithTenant(tenantId, countQuery, baseParams),
            this.executeWithTenant(tenantId, dataQuery, dataParams)
        ]);
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1
            }
        };
    }
    async getRestaurantById(tenantId, restaurantId) {
        const query = `
      SELECT *
      FROM restaurants
      WHERE id = $1
    `;
        const result = await this.executeWithTenant(tenantId, query, [restaurantId]);
        return result.rows[0] || null;
    }
    async createRestaurant(tenantId, ownerId, data) {
        const query = `
      INSERT INTO restaurants (
        tenant_id, owner_id, name, description, cuisine_type, address, 
        phone, email, website, operating_hours, delivery_radius_km, 
        min_order_amount, commission_rate, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
    `;
        const params = [
            tenantId,
            ownerId,
            data.name,
            data.description || null,
            data.cuisine_type || null,
            data.address || {},
            data.phone || null,
            data.email || null,
            data.website || null,
            data.operating_hours || {},
            data.delivery_radius_km || 5.0,
            data.min_order_amount || 0.00,
            data.commission_rate || null,
            data.status || 'pending_approval'
        ];
        const result = await this.executeWithTenant(tenantId, query, params);
        return result.rows[0];
    }
    async updateRestaurant(tenantId, restaurantId, data) {
        const updates = [];
        const params = [tenantId, restaurantId];
        let paramIndex = 3;
        // Build dynamic SET clause
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id' && key !== 'tenant_id' && key !== 'created_at') {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        });
        if (updates.length === 0) {
            return this.getRestaurantById(tenantId, restaurantId);
        }
        const query = `
      UPDATE restaurants
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
        const result = await this.executeWithTenant(tenantId, query, params);
        return result.rows[0] || null;
    }
    // =========================================
    // MENU CATEGORY METHODS
    // =========================================
    async getMenuCategories(tenantId, restaurantId) {
        const query = `
      SELECT *
      FROM menu_categories
      WHERE tenant_id = $1 AND restaurant_id = $2 AND is_active = true
      ORDER BY display_order ASC, name ASC
    `;
        const result = await this.executeWithTenant(tenantId, query, [tenantId, restaurantId]);
        return result.rows;
    }
    async createMenuCategory(tenantId, restaurantId, data) {
        const query = `
      INSERT INTO menu_categories (
        tenant_id, restaurant_id, name, description, display_order, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      RETURNING *
    `;
        const params = [
            tenantId,
            restaurantId,
            data.name,
            data.description || null,
            data.display_order || 0,
            data.is_active !== false
        ];
        const result = await this.executeWithTenant(tenantId, query, params);
        return result.rows[0];
    }
    // =========================================
    // MENU ITEM METHODS
    // =========================================
    async getMenuItems(tenantId, restaurantId, filters = {}) {
        const conditions = ['tenant_id = $1', 'restaurant_id = $2'];
        const params = [tenantId, restaurantId];
        let paramIndex = 3;
        if (filters.category) {
            conditions.push(`category_id = $${paramIndex}`);
            params.push(filters.category);
            paramIndex++;
        }
        if (filters.status) {
            conditions.push(`status = $${paramIndex}`);
            params.push(filters.status);
            paramIndex++;
        }
        else {
            // Default to available items only
            conditions.push(`status = $${paramIndex}`);
            params.push('available');
            paramIndex++;
        }
        if (filters.featured !== undefined) {
            conditions.push(`is_featured = $${paramIndex}`);
            params.push(filters.featured);
            paramIndex++;
        }
        const whereClause = conditions.join(' AND ');
        const query = `
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE ${whereClause}
      ORDER BY mi.is_featured DESC, mi.display_order ASC, mi.name ASC
    `;
        const result = await this.executeWithTenant(tenantId, query, params);
        return result.rows;
    }
    async getMenuItemById(tenantId, restaurantId, itemId) {
        const query = `
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.tenant_id = $1 AND mi.restaurant_id = $2 AND mi.id = $3
    `;
        const result = await this.executeWithTenant(tenantId, query, [tenantId, restaurantId, itemId]);
        return result.rows[0] || null;
    }
    async createMenuItem(tenantId, restaurantId, data) {
        const query = `
      INSERT INTO menu_items (
        tenant_id, restaurant_id, category_id, name, description, price, cost,
        preparation_time_minutes, calories, ingredients, allergens, dietary_tags,
        image_url, status, is_featured, display_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;
        const params = [
            tenantId,
            restaurantId,
            data.category_id || null,
            data.name,
            data.description || null,
            data.price,
            data.cost || null,
            data.preparation_time_minutes || 0,
            data.calories || null,
            data.ingredients || [],
            data.allergens || [],
            data.dietary_tags || [],
            data.image_url || null,
            data.status || 'available',
            data.is_featured || false,
            data.display_order || 0
        ];
        const result = await this.executeWithTenant(tenantId, query, params);
        return result.rows[0];
    }
    async updateMenuItem(tenantId, restaurantId, itemId, data) {
        const updates = [];
        const params = [tenantId, restaurantId, itemId];
        let paramIndex = 4;
        // Build dynamic SET clause
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id' && key !== 'tenant_id' && key !== 'restaurant_id' && key !== 'created_at') {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        });
        if (updates.length === 0) {
            return this.getMenuItemById(tenantId, restaurantId, itemId);
        }
        const query = `
      UPDATE menu_items
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $1 AND restaurant_id = $2 AND id = $3
      RETURNING *
    `;
        const result = await this.executeWithTenant(tenantId, query, params);
        return result.rows[0] || null;
    }
    async deleteMenuItem(tenantId, restaurantId, itemId) {
        const query = `
      DELETE FROM menu_items
      WHERE tenant_id = $1 AND restaurant_id = $2 AND id = $3
    `;
        const result = await this.executeWithTenant(tenantId, query, [tenantId, restaurantId, itemId]);
        return result.rowCount > 0;
    }
    // =========================================
    // UTILITY METHODS
    // =========================================
    async executeWithTenant(tenantId, query, params) {
        const client = await this.pool.connect();
        try {
            // Set tenant context for RLS
            await client.query('SET app.current_tenant_id = $1', [tenantId]);
            // Debug logging
            console.log('Executing query:', query);
            console.log('With params:', params);
            // Execute the query
            const result = await client.query(query, params);
            return result;
        }
        catch (error) {
            console.error('Query execution failed:', {
                query,
                params,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.MenuService = MenuService;
//# sourceMappingURL=MenuService.js.map