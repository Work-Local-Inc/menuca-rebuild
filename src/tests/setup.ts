import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import db from '@/database/connection';
import redis from '@/cache/redis';
import { v4 as uuidv4 } from 'uuid';

// Test environment setup
const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000000';
const TEST_USER_ID = uuidv4();
const TEST_RESTAURANT_ID = uuidv4();

export const testData: any = {
  tenantId: TEST_TENANT_ID,
  userId: TEST_USER_ID,
  restaurantId: TEST_RESTAURANT_ID,
  categoryId: '',
  menuItemId: '',
  testUser: {
    id: TEST_USER_ID,
    tenant_id: TEST_TENANT_ID,
    email: 'test@menuca.com',
    password: 'testPassword123',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer' as const,
    status: 'active' as const
  },
  testRestaurant: {
    id: TEST_RESTAURANT_ID,
    tenant_id: TEST_TENANT_ID,
    owner_id: TEST_USER_ID,
    name: 'Test Restaurant',
    description: 'A test restaurant',
    cuisine_type: 'american',
    address: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345' },
    phone: '555-0123',
    email: 'restaurant@test.com',
    delivery_radius_km: 5.0,
    min_order_amount: 10.00,
    commission_rate: 15.0,
    status: 'active' as const
  }
};

beforeAll(async () => {
  // Ensure database connection
  const dbConnected = await db.testConnection();
  if (!dbConnected) {
    throw new Error('Database connection failed');
  }

  // Ensure Redis connection  
  await redis.connect();
  const redisConnected = await redis.testConnection();
  if (!redisConnected) {
    throw new Error('Redis connection failed');
  }

  // Setup test data
  await setupTestData();
});

afterAll(async () => {
  // Cleanup test data
  await cleanupTestData();

  // Close connections
  await db.close();
  await redis.close();
});

beforeEach(async () => {
  // Clear Redis cache before each test - skip for now due to interface issues
  // TODO: Implement proper Redis cleanup when interface is available
});

async function setupTestData() {
  const client = await db.getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // Set tenant context
    await client.query('SET app.current_tenant_id = $1', [TEST_TENANT_ID]);

    // Create test tenant if it doesn't exist
    await client.query(`
      INSERT INTO tenants (id, name, domain, subdomain, configuration, commission_rate, status)
      VALUES ($1, 'Test Tenant', 'test.menuca.com', 'test', '{}', 15.0, 'active')
      ON CONFLICT (id) DO NOTHING
    `, [TEST_TENANT_ID]);

    // Create test user if it doesn't exist
    await client.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, email_verified)
      VALUES ($1, $2, $3, '$2b$12$dummy.hash.for.testing', $4, $5, $6, $7, true)
      ON CONFLICT (id) DO NOTHING
    `, [
      TEST_USER_ID,
      TEST_TENANT_ID,
      testData.testUser.email,
      testData.testUser.firstName,
      testData.testUser.lastName,
      testData.testUser.role,
      testData.testUser.status
    ]);

    // Create test restaurant if it doesn't exist
    await client.query(`
      INSERT INTO restaurants (
        id, tenant_id, owner_id, name, description, cuisine_type, address,
        phone, email, delivery_radius_km, min_order_amount, commission_rate, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING
    `, [
      TEST_RESTAURANT_ID,
      TEST_TENANT_ID,
      TEST_USER_ID,
      testData.testRestaurant.name,
      testData.testRestaurant.description,
      testData.testRestaurant.cuisine_type,
      JSON.stringify(testData.testRestaurant.address),
      testData.testRestaurant.phone,
      testData.testRestaurant.email,
      testData.testRestaurant.delivery_radius_km,
      testData.testRestaurant.min_order_amount,
      testData.testRestaurant.commission_rate,
      testData.testRestaurant.status
    ]);

    // Create test menu category
    const categoryId = uuidv4();
    await client.query(`
      INSERT INTO menu_categories (id, tenant_id, restaurant_id, name, description, display_order, is_active)
      VALUES ($1, $2, $3, 'Test Category', 'Test menu category', 1, true)
      ON CONFLICT (id) DO NOTHING
    `, [categoryId, TEST_TENANT_ID, TEST_RESTAURANT_ID]);

    // Create test menu item
    const menuItemId = uuidv4();
    await client.query(`
      INSERT INTO menu_items (
        id, tenant_id, restaurant_id, category_id, name, description, price,
        preparation_time_minutes, status, is_featured, display_order
      ) VALUES ($1, $2, $3, $4, 'Test Burger', 'Delicious test burger', 1299, 15, 'available', false, 1)
      ON CONFLICT (id) DO NOTHING  
    `, [menuItemId, TEST_TENANT_ID, TEST_RESTAURANT_ID, categoryId]);

    // Store IDs for use in tests
    testData.categoryId = categoryId;
    testData.menuItemId = menuItemId;

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function cleanupTestData() {
  const client = await db.getPool().connect();
  
  try {
    await client.query('SET app.current_tenant_id = $1', [TEST_TENANT_ID]);
    
    // Clean up in reverse dependency order
    await client.query('DELETE FROM commission_batch_items WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM commission_payment_batches WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM commissions WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM refunds WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM payment_intents WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM payment_methods WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM cart_items WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM menu_items WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM menu_categories WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM restaurants WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM users WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM tenants WHERE id = $1', [TEST_TENANT_ID]);
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    client.release();
  }
}

// Helper function to create authenticated request context
export function createAuthContext() {
  return {
    user: {
      id: testData.userId,
      tenant_id: testData.tenantId,
      email: testData.testUser.email,
      first_name: testData.testUser.firstName,
      last_name: testData.testUser.lastName,
      role: testData.testUser.role,
      status: testData.testUser.status,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    tenantContext: {
      tenantId: testData.tenantId
    }
  };
}

// Export types for use in tests
export type TestAuthContext = ReturnType<typeof createAuthContext>;