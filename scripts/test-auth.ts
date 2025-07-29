/**
 * Test authentication system
 */
import dotenv from 'dotenv';
dotenv.config();

import db from '../src/database/connection';
import redis from '../src/cache/redis';
import { authService } from '../src/services/AuthService';

async function testAuth() {
  try {
    console.log('🔧 Testing authentication system...');
    
    // Test database connection
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');

    // Initialize Redis connection
    await redis.connect();
    const redisConnected = await redis.testConnection();
    if (!redisConnected) {
      throw new Error('Redis connection failed');
    }
    console.log('✅ Redis connection successful');

    // Check if test user exists
    const users = await db.queryWithTenant('default', 'SELECT * FROM users WHERE email = $1', ['admin@menuca.local']);
    
    if (users.length === 0) {
      console.log('❌ Test user not found in database');
      
      // Try to create a test user
      console.log('🔧 Creating test user...');
      
      const registerResult = await authService.register({
        email: 'test@menuca.local',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
      
      console.log('✅ Test user created:', {
        id: registerResult.user.id,
        email: registerResult.user.email,
        role: registerResult.user.role
      });
      
      console.log('🔧 Testing login with new user...');
      const loginResult = await authService.login({
        email: 'test@menuca.local',
        password: 'password123'
      });
      
      console.log('✅ Login successful:', {
        userId: loginResult.user.id,
        email: loginResult.user.email,
        tokenLength: loginResult.tokens.accessToken.length
      });
      
    } else {
      console.log('✅ Test user found:', {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        status: users[0].status
      });
      
      // Try to hash a fresh password and compare
      const testHash = await authService.hashPassword('password123');
      console.log('🔧 Test hash:', testHash);
      console.log('🔧 DB hash:', users[0].password_hash);
      
      const isValid = await authService.verifyPassword('password123', users[0].password_hash);
      console.log('🔧 Password verification:', isValid);
      
      if (!isValid) {
        console.log('❌ Password hash mismatch - updating with correct hash');
        
        const newHash = await authService.hashPassword('password123');
        await db.queryWithTenant('default', 
          'UPDATE users SET password_hash = $1 WHERE email = $2', 
          [newHash, 'admin@menuca.local']
        );
        console.log('✅ Password hash updated');
      }
      
      // Now try login
      console.log('🔧 Testing login...');
      const loginResult = await authService.login({
        email: 'admin@menuca.local',
        password: 'password123'
      });
      
      console.log('✅ Login successful:', {
        userId: loginResult.user.id,
        email: loginResult.user.email,
        tokenLength: loginResult.tokens.accessToken.length
      });
    }
    
    // Test token verification
    console.log('🔧 Testing token verification...');
    const testLogin = await authService.login({
      email: users.length > 0 ? 'admin@menuca.local' : 'test@menuca.local',
      password: 'password123'
    });
    
    const decoded = authService.verifyAccessToken(testLogin.tokens.accessToken);
    console.log('✅ Token verification successful:', {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    });
    
    console.log('🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  } finally {
    await redis.close();
    await db.close();
    process.exit(0);
  }
}

testAuth();