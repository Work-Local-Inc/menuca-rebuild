/**
 * Restaurant Profile Management API Routes
 * Implements MC-C-BE-004: CRUD operations, configuration, status controls
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

// Restaurant interfaces
export interface Restaurant {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  address: RestaurantAddress;
  contact: RestaurantContact;
  businessHours: BusinessHours[];
  settings: RestaurantSettings;
  status: RestaurantStatus;
  cuisine_type: string[];
  price_range: 'budget' | 'moderate' | 'upscale' | 'fine_dining';
  delivery_zones: DeliveryZone[];
  images: RestaurantImage[];
  rating: number;
  total_reviews: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface RestaurantAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface RestaurantContact {
  phone: string;
  email: string;
  website?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface BusinessHours {
  day_of_week: number; // 0-6, Sunday=0
  open_time: string; // HH:MM format
  close_time: string; // HH:MM format
  is_closed: boolean;
}

export interface RestaurantSettings {
  accepts_reservations: boolean;
  min_order_amount: number;
  delivery_fee: number;
  service_fee_percentage: number;
  tax_rate: number;
  preparation_time: number; // minutes
  max_delivery_distance: number; // miles
  auto_accept_orders: boolean;
  allow_cash_payments: boolean;
  allow_card_payments: boolean;
  notification_preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
  };
}

export enum RestaurantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_APPROVAL = 'pending_approval',
  SUSPENDED = 'suspended',
  CLOSED_TEMPORARILY = 'closed_temporarily'
}

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  delivery_fee: number;
  min_order_amount: number;
  estimated_delivery_time: number; // minutes
}

export interface RestaurantImage {
  id: string;
  url: string;
  alt_text?: string;
  type: 'logo' | 'cover' | 'interior' | 'food' | 'menu';
  order: number;
}

/**
 * GET /api/restaurants
 * Get all restaurants for the current tenant
 */
router.get('/', 
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_READ),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const { page = 1, limit = 20, status, cuisine_type, city } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let queryConditions = ['tenant_id = $1'];
      let queryParams: any[] = [tenantId];
      let paramCounter = 2;
      
      if (status) {
        queryConditions.push(`status = $${paramCounter}`);
        queryParams.push(status);
        paramCounter++;
      }
      
      if (cuisine_type) {
        queryConditions.push(`$${paramCounter} = ANY(cuisine_type)`);
        queryParams.push(cuisine_type);
        paramCounter++;
      }
      
      if (city) {
        queryConditions.push(`(address->>'city') ILIKE $${paramCounter}`);
        queryParams.push(`%${city}%`);
        paramCounter++;
      }
      
      const countQuery = `
        SELECT COUNT(*) 
        FROM restaurants 
        WHERE ${queryConditions.join(' AND ')}
      `;
      
      const dataQuery = `
        SELECT 
          id, tenant_id, name, description, address, contact, 
          business_hours, settings, status, cuisine_type, 
          price_range, delivery_zones, images, rating, 
          total_reviews, created_at, updated_at, created_by
        FROM restaurants 
        WHERE ${queryConditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;
      
      queryParams.push(Number(limit), offset);
      
      const [countResult, dataResult] = await Promise.all([
        client.query(countQuery, queryParams.slice(0, -2)),
        client.query(dataQuery, queryParams)
      ]);
      
      const totalCount = parseInt(countResult.rows[0].count);
      const restaurants = dataResult.rows.map(mapRowToRestaurant);
      
      return res.json({
        success: true,
        data: restaurants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
      
    } catch (error) {
      logger.error('Error fetching restaurants:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch restaurants'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/restaurants/:id
 * Get a specific restaurant by ID
 */
router.get('/:id',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_READ),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const restaurantId = req.params.id;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const result = await client.query(`
        SELECT 
          id, tenant_id, name, description, address, contact, 
          business_hours, settings, status, cuisine_type, 
          price_range, delivery_zones, images, rating, 
          total_reviews, created_at, updated_at, created_by
        FROM restaurants 
        WHERE id = $1 AND tenant_id = $2
      `, [restaurantId, tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
      
      const restaurant = mapRowToRestaurant(result.rows[0]);
      
      return res.json({
        success: true,
        data: restaurant
      });
      
    } catch (error) {
      logger.error('Error fetching restaurant:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch restaurant'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/restaurants
 * Create a new restaurant
 */
router.post('/',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_CREATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const restaurantData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'address', 'contact', 'cuisine_type'];
      for (const field of requiredFields) {
        if (!restaurantData[field]) {
          return res.status(400).json({
            success: false,
            error: `Missing required field: ${field}`
          });
        }
      }
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const restaurantId = uuidv4();
      
      // Default business hours (9 AM - 9 PM, closed Sundays)
      const defaultBusinessHours: BusinessHours[] = [
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true }, // Sunday
        { day_of_week: 1, open_time: '09:00', close_time: '21:00', is_closed: false }, // Monday
        { day_of_week: 2, open_time: '09:00', close_time: '21:00', is_closed: false }, // Tuesday
        { day_of_week: 3, open_time: '09:00', close_time: '21:00', is_closed: false }, // Wednesday
        { day_of_week: 4, open_time: '09:00', close_time: '21:00', is_closed: false }, // Thursday
        { day_of_week: 5, open_time: '09:00', close_time: '22:00', is_closed: false }, // Friday
        { day_of_week: 6, open_time: '09:00', close_time: '22:00', is_closed: false }  // Saturday
      ];
      
      // Default settings
      const defaultSettings: RestaurantSettings = {
        accepts_reservations: false,
        min_order_amount: 10,
        delivery_fee: 2.99,
        service_fee_percentage: 3.5,
        tax_rate: 8.25,
        preparation_time: 30,
        max_delivery_distance: 5,
        auto_accept_orders: false,
        allow_cash_payments: true,
        allow_card_payments: true,
        notification_preferences: {
          email_notifications: true,
          sms_notifications: true,
          push_notifications: true
        }
      };
      
      const result = await client.query(`
        INSERT INTO restaurants (
          id, tenant_id, name, description, address, contact, 
          business_hours, settings, status, cuisine_type, 
          price_range, delivery_zones, images, rating, 
          total_reviews, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `, [
        restaurantId,
        tenantId,
        restaurantData.name,
        restaurantData.description || '',
        JSON.stringify(restaurantData.address),
        JSON.stringify(restaurantData.contact),
        JSON.stringify(restaurantData.business_hours || defaultBusinessHours),
        JSON.stringify(restaurantData.settings || defaultSettings),
        restaurantData.status || RestaurantStatus.PENDING_APPROVAL,
        restaurantData.cuisine_type,
        restaurantData.price_range || 'moderate',
        JSON.stringify(restaurantData.delivery_zones || []),
        JSON.stringify(restaurantData.images || []),
        0, // initial rating
        0, // initial review count
        userId
      ]);
      
      const restaurant = mapRowToRestaurant(result.rows[0]);
      
      logger.info(`Restaurant created: ${restaurantId} by user ${userId}`);
      
      return res.status(201).json({
        success: true,
        data: restaurant
      });
      
    } catch (error) {
      logger.error('Error creating restaurant:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create restaurant'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PUT /api/restaurants/:id
 * Update a restaurant
 */
router.put('/:id',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const restaurantId = req.params.id;
      const updateData = req.body;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Check if restaurant exists
      const existingResult = await client.query(`
        SELECT id FROM restaurants 
        WHERE id = $1 AND tenant_id = $2
      `, [restaurantId, tenantId]);
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
      
      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      const allowedFields = [
        'name', 'description', 'address', 'contact', 'business_hours',
        'settings', 'status', 'cuisine_type', 'price_range', 'delivery_zones', 'images'
      ];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (['address', 'contact', 'business_hours', 'settings', 'delivery_zones', 'images'].includes(field)) {
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
      
      // Add updated_at
      updateFields.push(`updated_at = NOW()`);
      
      // Add WHERE conditions
      updateValues.push(restaurantId, tenantId);
      
      const result = await client.query(`
        UPDATE restaurants 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter} AND tenant_id = $${paramCounter + 1}
        RETURNING *
      `, updateValues);
      
      const restaurant = mapRowToRestaurant(result.rows[0]);
      
      logger.info(`Restaurant updated: ${restaurantId}`);
      
      return res.json({
        success: true,
        data: restaurant
      });
      
    } catch (error) {
      logger.error('Error updating restaurant:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update restaurant'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant (soft delete by setting status to inactive)
 */
router.delete('/:id',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_DELETE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const restaurantId = req.params.id;
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Soft delete by updating status
      const result = await client.query(`
        UPDATE restaurants 
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING id
      `, [RestaurantStatus.INACTIVE, restaurantId, tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
      
      logger.info(`Restaurant soft deleted: ${restaurantId}`);
      
      return res.json({
        success: true,
        message: 'Restaurant deleted successfully'
      });
      
    } catch (error) {
      logger.error('Error deleting restaurant:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete restaurant'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PATCH /api/restaurants/:id/status
 * Update restaurant status
 */
router.patch('/:id/status',
  authenticateToken,
  validateTenant,
  requirePermission(Permission.RESTAURANT_UPDATE),
  async (req, res) => {
    const client = await db.getPool().connect();
    
    try {
      const tenantId = req.tenantId;
      const restaurantId = req.params.id;
      const { status } = req.body;
      
      if (!Object.values(RestaurantStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status value'
        });
      }
      
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const result = await client.query(`
        UPDATE restaurants 
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING status
      `, [status, restaurantId, tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
      
      logger.info(`Restaurant status updated: ${restaurantId} -> ${status}`);
      
      return res.json({
        success: true,
        data: { status: result.rows[0].status }
      });
      
    } catch (error) {
      logger.error('Error updating restaurant status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update restaurant status'
      });
    } finally {
      client.release();
    }
  }
);

// Helper function to map database row to Restaurant interface
function mapRowToRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    address: row.address,
    contact: row.contact,
    businessHours: row.business_hours,
    settings: row.settings,
    status: row.status,
    cuisine_type: row.cuisine_type,
    price_range: row.price_range,
    delivery_zones: row.delivery_zones,
    images: row.images,
    rating: parseFloat(row.rating) || 0,
    total_reviews: parseInt(row.total_reviews) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by
  };
}

export default router;