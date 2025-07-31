/**
 * Test user registration
 */
import dotenv from 'dotenv';
dotenv.config();

import db from '../src/database/connection';
import cache from '../src/cache/memory';
import { authService } from '../src/services/AuthService';

async function testRegistration() {
  try {
    console.log('🔧 Testing user registration...');
    
    // Initialize connections
    const connected = await db.testConnection();
    if (!connected) throw new Error('Database connection failed');
    
    await cache.connect();
    const redisConnected = await cache.testConnection();
    if (!redisConnected) throw new Error('Redis connection failed');
    
    console.log('✅ Connections established');

    // Test registration with unique email
    const testEmail = `test-${Date.now()}@example.com`;
    
    console.log(`🔧 Registering user: ${testEmail}`);
    
    const registerResult = await authService.register({
      email: testEmail,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('✅ Registration successful:', {
      id: registerResult.user.id,
      email: registerResult.user.email,
      role: registerResult.user.role,
      status: registerResult.user.status,
      tokenLength: registerResult.tokens.accessToken.length
    });
    
    // Test login with registered user
    console.log('🔧 Testing login with registered user...');
    const loginResult = await authService.login({
      email: testEmail,
      password: 'password123'
    });
    
    console.log('✅ Login successful:', {
      userId: loginResult.user.id,
      email: loginResult.user.email
    });
    
    console.log('🎉 Registration test passed!');
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
  } finally {
    await cache.close();
    await db.close();
    process.exit(0);
  }
}

testRegistration();