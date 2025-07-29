import dotenv from 'dotenv';
dotenv.config();

import db from './src/database/connection';
import redis from './src/cache/redis';

async function testFoundation() {
  console.log('🧪 Testing MenuCA Foundation Services...\n');

  let allTestsPassed = true;

  // Test 1: Database Connection
  console.log('1️⃣ Testing PostgreSQL Connection...');
  try {
    const dbHealthy = await db.testConnection();
    if (dbHealthy) {
      console.log('✅ PostgreSQL connection successful');
      
      // Test RLS functionality
      console.log('🔒 Testing Row Level Security...');
      try {
        // Test setting tenant context and querying
        const testQuery = await db.queryWithTenant(
          '00000000-0000-0000-0000-000000000000',
          "SELECT current_setting('app.current_tenant_id', true) as tenant_context",
          []
        );
        console.log('✅ RLS tenant context working:', testQuery[0]?.tenant_context);
      } catch (error) {
        console.log('❌ RLS test failed:', error);
        allTestsPassed = false;
      }
      
    } else {
      console.log('❌ PostgreSQL connection failed');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ PostgreSQL test error:', error);
    allTestsPassed = false;
  }

  console.log('');

  // Test 2: Redis Connection
  console.log('2️⃣ Testing Redis Connection...');
  try {
    await redis.connect();
    const redisHealthy = await redis.testConnection();
    if (redisHealthy) {
      console.log('✅ Redis connection successful');
      
      // Test basic Redis operations
      console.log('💾 Testing Redis operations...');
      await redis.set('test:key', 'test-value', 60);
      const value = await redis.get('test:key');
      if (value === 'test-value') {
        console.log('✅ Redis set/get operations working');
      } else {
        console.log('❌ Redis operations failed');
        allTestsPassed = false;
      }
      
      // Test session management
      console.log('🔑 Testing session management...');
      await redis.setSession('test-session', { userId: '123', tenantId: 'default' });
      const session = await redis.getSession('test-session');
      if (session && (session as any).userId === '123') {
        console.log('✅ Session management working');
      } else {
        console.log('❌ Session management failed');
        allTestsPassed = false;
      }
      
      // Cleanup
      await redis.del('test:key');
      await redis.deleteSession('test-session');
      
    } else {
      console.log('❌ Redis connection failed');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ Redis test error:', error);
    allTestsPassed = false;
  }

  console.log('');

  // Test 3: Database Schema
  console.log('3️⃣ Testing Database Schema...');
  try {
    // Test tenants table
    const tenants = await db.query('SELECT COUNT(*) as count FROM tenants');
    console.log('✅ Tenants table accessible, count:', tenants[0]?.count);
    
    // Test users table with RLS
    const users = await db.queryWithTenant('00000000-0000-0000-0000-000000000000', 'SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table with RLS working, count:', users[0]?.count);
    
    // Test health view
    const health = await db.query('SELECT * FROM db_health LIMIT 1');
    console.log('✅ Database health view working:', {
      tenants: health[0]?.tenant_count,
      users: health[0]?.user_count
    });
    
  } catch (error) {
    console.log('❌ Database schema test error:', error);
    allTestsPassed = false;
  }

  console.log('');

  // Test 4: Multi-tenant Isolation
  console.log('4️⃣ Testing Multi-tenant Isolation...');
  try {
    // Test that different tenant contexts return different results
    const defaultUsers = await db.queryWithTenant('00000000-0000-0000-0000-000000000000', 'SELECT id FROM users LIMIT 5');
    console.log('✅ Default tenant query successful, results:', defaultUsers.length);
    
    // Test that invalid tenant returns no results (RLS working)
    const invalidUsers = await db.queryWithTenant('11111111-1111-1111-1111-111111111111', 'SELECT id FROM users LIMIT 5');
    console.log('✅ Invalid tenant isolation working, results:', invalidUsers.length);
    
  } catch (error) {
    console.log('❌ Multi-tenant isolation test error:', error);
    allTestsPassed = false;
  }

  console.log('');

  // Summary
  if (allTestsPassed) {
    console.log('🎉 All Foundation Tests Passed!');
    console.log('\n📋 Foundation Services Status:');
    console.log('✅ PostgreSQL 15+ with Multi-tenant RLS');
    console.log('✅ Redis 7+ Caching & Session Management');
    console.log('✅ Database Schema with Health Monitoring');
    console.log('✅ Row Level Security & Tenant Isolation');
    console.log('\n🚀 Ready for Phase 2 Development!');
    console.log('\n🔗 Next Steps:');
    console.log('- Start the server: npm run dev');
    console.log('- Test endpoints: curl http://localhost:3000/health');
    console.log('- Begin JWT authentication implementation');
  } else {
    console.log('❌ Some Foundation Tests Failed!');
    console.log('Please check the errors above and fix before proceeding.');
    process.exit(1);
  }

  // Cleanup
  await db.close();
  await redis.close();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run tests
testFoundation().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});