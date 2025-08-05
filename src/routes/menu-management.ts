/**
 * Menu Management for Restaurants API Routes
 * Implements MC-C-BE-005: Restaurant-specific menu operations, availability, pricing
 */
import express from 'express';
import { authenticateToken } from '@/middleware/auth';
import { requirePermission, Permission } from '@/middleware/rbac';
import { validateTenant } from '@/middleware/tenant';
import db from '@/database/connection';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Menu interfaces
export interface RestaurantMenu {
  id: string;
  restaurantId: string;
  tenantId: string;
  name: string;
  description?: string;
  categories: MenuCategory[];
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  images: MenuItemImage[];
  options: MenuItemOption[];
  nutritional_info?: NutritionalInfo;
  allergens: string[];
  tags: string[];
  availability: ItemAvailability;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  preparation_time: number; // minutes
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface MenuItemOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'select';
  is_required: boolean;
  max_selections?: number;
  choices: OptionChoice[];
}

export interface OptionChoice {
  id: string;
  name: string;
  price_modifier: number;
  is_available: boolean;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  fiber?: number; // grams
  sodium?: number; // mg
  sugar?: number; // grams
}

export interface ItemAvailability {
  is_available: boolean;
  available_days: number[]; // 0-6, Sunday=0
  available_times: Array<{
    start_time: string; // HH:MM
    end_time: string; // HH:MM
  }>;
  stock_quantity?: number;
  out_of_stock_message?: string;
}

/**
 * GET /api/menu-management/restaurant/:restaurantId
 * Get all menus for a restaurant
 */
router.get('/restaurant/:restaurantId',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_READ),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const restaurantId = req.params.restaurantId;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Verify restaurant belongs to tenant and user has access
      const restaurantCheck = await client.query(`
        SELECT id FROM restaurants 
        WHERE id = $1 AND tenant_id = $2
      `, [restaurantId, tenantId]);
      
      if (restaurantCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
      
      // Get menus with categories and items
      const menusResult = await client.query(`
        SELECT 
          m.id, m.restaurant_id, m.tenant_id, m.name, m.description,
          m.is_active, m.display_order, m.created_at, m.updated_at, m.created_by,
          json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'description', c.description,
              'display_order', c.display_order,
              'is_active', c.is_active,
              'items', c.items
            ) ORDER BY c.display_order
          ) FILTER (WHERE c.id IS NOT NULL) as categories
        FROM restaurant_menus m
        LEFT JOIN menu_categories c ON m.id = c.menu_id AND c.is_active = true
        WHERE m.restaurant_id = $1 AND m.tenant_id = $2
        GROUP BY m.id, m.restaurant_id, m.tenant_id, m.name, m.description,
                 m.is_active, m.display_order, m.created_at, m.updated_at, m.created_by
        ORDER BY m.display_order, m.created_at
      `, [restaurantId, tenantId]);
      
      const menus = menusResult.rows.map(mapRowToMenu);
      
      return res.json({
        success: true,
        data: menus
      });
      
    } catch (error) {
      logger.error('Error fetching restaurant menus:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch restaurant menus'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/menu-management/restaurant/:restaurantId/menus
 * Create a new menu for a restaurant
 */
router.post('/restaurant/:restaurantId/menus',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const restaurantId = req.params.restaurantId;
      const userId = req.userId;
      const menuData = req.body;
      
      // Validate required fields
      if (!menuData.name) {
        return res.status(400).json({
          success: false,
          error: 'Menu name is required'
        });
      }
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Verify restaurant exists and user has access
      const restaurantCheck = await client.query(`
        SELECT id FROM restaurants 
        WHERE id = $1 AND tenant_id = $2
      `, [restaurantId, tenantId]);
      
      if (restaurantCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
      
      const menuId = uuidv4();
      
      // Get next display order
      const orderResult = await client.query(`
        SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
        FROM restaurant_menus 
        WHERE restaurant_id = $1 AND tenant_id = $2
      `, [restaurantId, tenantId]);
      
      const displayOrder = orderResult.rows[0].next_order;
      
      const result = await client.query(`
        INSERT INTO restaurant_menus (
          id, restaurant_id, tenant_id, name, description, 
          is_active, display_order, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        menuId,
        restaurantId,
        tenantId,
        menuData.name,
        menuData.description || '',
        menuData.is_active !== false, // default to true
        displayOrder,
        userId
      ]);
      
      const menu = {
        ...mapRowToMenu(result.rows[0]),
        categories: []
      };
      
      logger.info(`Menu created: ${menuId} for restaurant ${restaurantId}`);
      
      return res.status(201).json({
        success: true,
        data: menu
      });
      
    } catch (error) {
      logger.error('Error creating menu:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create menu'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PUT /api/menu-management/menus/:menuId
 * Update a menu
 */
router.put('/menus/:menuId',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const menuId = req.params.menuId;
      const updateData = req.body;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      const allowedFields = ['name', 'description', 'is_active', 'display_order'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = $${paramCounter}`);
          updateValues.push(updateData[field]);
          paramCounter++;
        }
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }
      
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(menuId, tenantId);
      
      const result = await client.query(`
        UPDATE restaurant_menus 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter} AND tenant_id = $${paramCounter + 1}
        RETURNING *
      `, updateValues);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menu not found'
        });
      }
      
      const menu = mapRowToMenu(result.rows[0]);
      
      logger.info(`Menu updated: ${menuId}`);
      
      return res.json({
        success: true,
        data: menu
      });
      
    } catch (error) {
      logger.error('Error updating menu:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update menu'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/menu-management/menus/:menuId/categories
 * Create a new category in a menu
 */
router.post('/menus/:menuId/categories',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const menuId = req.params.menuId;
      const categoryData = req.body;
      
      if (!categoryData.name) {
        return res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
      }
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Verify menu exists and belongs to tenant
      const menuCheck = await client.query(`
        SELECT id FROM restaurant_menus 
        WHERE id = $1 AND tenant_id = $2
      `, [menuId, tenantId]);
      
      if (menuCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menu not found'
        });
      }
      
      const categoryId = uuidv4();
      
      // Get next display order
      const orderResult = await client.query(`
        SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
        FROM menu_categories 
        WHERE menu_id = $1
      `, [menuId]);
      
      const displayOrder = orderResult.rows[0].next_order;
      
      const result = await client.query(`
        INSERT INTO menu_categories (
          id, menu_id, name, description, display_order, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        categoryId,
        menuId,
        categoryData.name,
        categoryData.description || '',
        displayOrder,
        categoryData.is_active !== false
      ]);
      
      const category = {
        ...result.rows[0],
        items: []
      };
      
      logger.info(`Menu category created: ${categoryId} in menu ${menuId}`);
      
      return res.status(201).json({
        success: true,
        data: category
      });
      
    } catch (error) {
      logger.error('Error creating menu category:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create menu category'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/menu-management/categories/:categoryId/items
 * Create a new menu item in a category
 */
router.post('/categories/:categoryId/items',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const categoryId = req.params.categoryId;
      const itemData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'price'];
      for (const field of requiredFields) {
        if (!itemData[field]) {
          return res.status(400).json({
            success: false,
            error: `Missing required field: ${field}`
          });
        }
      }
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Verify category exists and belongs to tenant
      const categoryCheck = await client.query(`
        SELECT c.id 
        FROM menu_categories c
        JOIN restaurant_menus m ON c.menu_id = m.id
        WHERE c.id = $1 AND m.tenant_id = $2
      `, [categoryId, tenantId]);
      
      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }
      
      const itemId = uuidv4();
      
      // Get next display order
      const orderResult = await client.query(`
        SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
        FROM menu_items 
        WHERE category_id = $1
      `, [categoryId]);
      
      const displayOrder = orderResult.rows[0].next_order;
      
      // Default availability
      const defaultAvailability: ItemAvailability = {
        is_available: true,
        available_days: [1, 2, 3, 4, 5, 6, 7], // All days
        available_times: [{ start_time: '00:00', end_time: '23:59' }]
      };
      
      const result = await client.query(`
        INSERT INTO menu_items (
          id, category_id, name, description, price, cost,
          images, options, nutritional_info, allergens, tags,
          availability, display_order, is_active, is_featured,
          preparation_time
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `, [
        itemId,
        categoryId,
        itemData.name,
        itemData.description || '',
        itemData.price,
        itemData.cost || 0,
        JSON.stringify(itemData.images || []),
        JSON.stringify(itemData.options || []),
        JSON.stringify(itemData.nutritional_info || {}),
        itemData.allergens || [],
        itemData.tags || [],
        JSON.stringify(itemData.availability || defaultAvailability),
        displayOrder,
        itemData.is_active !== false,
        itemData.is_featured || false,
        itemData.preparation_time || 15
      ]);
      
      const menuItem = mapRowToMenuItem(result.rows[0]);
      
      logger.info(`Menu item created: ${itemId} in category ${categoryId}`);
      
      return res.status(201).json({
        success: true,
        data: menuItem
      });
      
    } catch (error) {
      logger.error('Error creating menu item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create menu item'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PUT /api/menu-management/items/:itemId
 * Update a menu item
 */
router.put('/items/:itemId',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const itemId = req.params.itemId;
      const updateData = req.body;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      const allowedFields = [
        'name', 'description', 'price', 'cost', 'images', 'options',
        'nutritional_info', 'allergens', 'tags', 'availability',
        'display_order', 'is_active', 'is_featured', 'preparation_time'
      ];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (['images', 'options', 'nutritional_info', 'availability'].includes(field)) {
            updateFields.push(`${field} = $${paramCounter}::jsonb`);
            updateValues.push(JSON.stringify(updateData[field]));
          } else {
            updateFields.push(`${field} = $${paramCounter}`);
            updateValues.push(updateData[field]);
          }
          paramCounter++;
        }
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }
      
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(itemId, tenantId);
      
      const result = await client.query(`
        UPDATE menu_items 
        SET ${updateFields.join(', ')}
        FROM menu_categories c, restaurant_menus m
        WHERE menu_items.id = $${paramCounter} 
          AND menu_items.category_id = c.id 
          AND c.menu_id = m.id 
          AND m.tenant_id = $${paramCounter + 1}
        RETURNING menu_items.*
      `, updateValues);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }
      
      const menuItem = mapRowToMenuItem(result.rows[0]);
      
      logger.info(`Menu item updated: ${itemId}`);
      
      return res.json({
        success: true,
        data: menuItem
      });
      
    } catch (error) {
      logger.error('Error updating menu item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update menu item'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PATCH /api/menu-management/items/:itemId/availability
 * Update menu item availability
 */
router.patch('/items/:itemId/availability',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const itemId = req.params.itemId;
      const { is_available, out_of_stock_message } = req.body;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Get current availability and update
      const currentResult = await client.query(`
        SELECT mi.availability 
        FROM menu_items mi
        JOIN menu_categories c ON mi.category_id = c.id
        JOIN restaurant_menus m ON c.menu_id = m.id
        WHERE mi.id = $1 AND m.tenant_id = $2
      `, [itemId, tenantId]);
      
      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }
      
      const currentAvailability = currentResult.rows[0].availability;
      const updatedAvailability = {
        ...currentAvailability,
        is_available: is_available !== undefined ? is_available : currentAvailability.is_available,
        out_of_stock_message: out_of_stock_message !== undefined ? out_of_stock_message : currentAvailability.out_of_stock_message
      };
      
      const result = await client.query(`
        UPDATE menu_items 
        SET availability = $1::jsonb, updated_at = NOW()
        FROM menu_categories c, restaurant_menus m
        WHERE menu_items.id = $2 
          AND menu_items.category_id = c.id 
          AND c.menu_id = m.id 
          AND m.tenant_id = $3
        RETURNING menu_items.availability
      `, [JSON.stringify(updatedAvailability), itemId, tenantId]);
      
      logger.info(`Menu item availability updated: ${itemId}`);
      
      return res.json({
        success: true,
        data: { availability: result.rows[0].availability }
      });
      
    } catch (error) {
      logger.error('Error updating menu item availability:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update menu item availability'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * DELETE /api/menu-management/items/:itemId
 * Delete a menu item (soft delete by setting is_active to false)
 */
router.delete('/items/:itemId',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const itemId = req.params.itemId;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const result = await client.query(`
        UPDATE menu_items 
        SET is_active = false, updated_at = NOW()
        FROM menu_categories c, restaurant_menus m
        WHERE menu_items.id = $1 
          AND menu_items.category_id = c.id 
          AND c.menu_id = m.id 
          AND m.tenant_id = $2
        RETURNING menu_items.id
      `, [itemId, tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }
      
      logger.info(`Menu item soft deleted: ${itemId}`);
      
      return res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
      
    } catch (error) {
      logger.error('Error deleting menu item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete menu item'
      });
    } finally {
      client.release();
    }
  }
);

// Helper functions
function mapRowToMenu(row: any): RestaurantMenu {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    categories: row.categories || [],
    is_active: row.is_active,
    display_order: row.display_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by
  };
}

function mapRowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    cost: parseFloat(row.cost),
    images: row.images || [],
    options: row.options || [],
    nutritional_info: row.nutritional_info || {},
    allergens: row.allergens || [],
    tags: row.tags || [],
    availability: row.availability,
    display_order: row.display_order,
    is_active: row.is_active,
    is_featured: row.is_featured,
    preparation_time: row.preparation_time,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export default router;