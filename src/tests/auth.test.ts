import { describe, test, expect, beforeEach } from '@jest/globals';
import { authService } from '@/services/AuthService';
import { testData } from './setup';
import jwt from 'jsonwebtoken';

describe('Authentication Service', () => {
  describe('Password Management', () => {
    test('should hash passwords securely', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    test('should verify passwords correctly', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.verifyPassword(password, hash);
      const isInvalid = await authService.verifyPassword('wrongPassword', hash);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Token Management', () => {
    test('should generate valid JWT tokens', async () => {
      const user = {
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
      };

      const tokens = await authService.generateTokens(user);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(15 * 60); // 15 minutes
      
      // Verify access token structure
      const decoded = jwt.decode(tokens.accessToken) as any;
      expect(decoded.userId).toBe(user.id);
      expect(decoded.tenantId).toBe(user.tenant_id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    test('should verify access tokens correctly', () => {
      // Create a test token
      const payload = {
        userId: testData.userId,
        tenantId: testData.tenantId,
        email: testData.testUser.email,
        role: testData.testUser.role
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'menuca-dev-secret-change-in-production', {
        expiresIn: '15m'
      });

      const decoded = authService.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(testData.userId);
      expect(decoded.tenantId).toBe(testData.tenantId);
      expect(decoded.email).toBe(testData.testUser.email);
      expect(decoded.role).toBe(testData.testUser.role);
    });

    test('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.string';
      
      expect(() => {
        authService.verifyAccessToken(invalidToken);
      }).toThrow('Invalid or expired access token');
    });

    test('should reject expired tokens', () => {
      const payload = {
        userId: testData.userId,
        tenantId: testData.tenantId,
        email: testData.testUser.email,
        role: testData.testUser.role
      };
      
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET || 'menuca-dev-secret-change-in-production', {
        expiresIn: '-1s' // Already expired
      });

      expect(() => {
        authService.verifyAccessToken(expiredToken);
      }).toThrow('Invalid or expired access token');
    });
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const registerData = {
        email: 'newuser@test.com',
        password: 'newUserPassword123',
        firstName: 'New',
        lastName: 'User',
        tenantId: testData.tenantId
      };

      const result = await authService.register(registerData);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.first_name).toBe(registerData.firstName);
      expect(result.user.last_name).toBe(registerData.lastName);
      expect(result.user.role).toBe('customer');
      expect(result.user.status).toBe('active');
      expect(result.user.tenant_id).toBe(testData.tenantId);
      expect(result.user).not.toHaveProperty('password_hash');
      
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    test('should reject duplicate email registration', async () => {
      const registerData = {
        email: testData.testUser.email, // Existing email
        password: 'anotherPassword123',
        firstName: 'Another',
        lastName: 'User',
        tenantId: testData.tenantId
      };

      await expect(authService.register(registerData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      // First register a user
      const registerData = {
        email: 'logintest@test.com',
        password: 'loginTestPassword123',
        firstName: 'Login',
        lastName: 'Test',
        tenantId: testData.tenantId
      };

      await authService.register(registerData);

      // Then try to login
      const loginData = {
        email: registerData.email,
        password: registerData.password,
        tenantId: testData.tenantId
      };

      const result = await authService.login(loginData);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.user).not.toHaveProperty('password_hash');
      
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    test('should reject invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'somePassword123',
        tenantId: testData.tenantId
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    test('should reject invalid password', async () => {
      const loginData = {
        email: testData.testUser.email,
        password: 'wrongPassword123',
        tenantId: testData.tenantId
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Token Refresh', () => {
    test('should refresh tokens successfully', async () => {
      // First register a user to get initial tokens
      const registerData = {
        email: 'refreshtest@test.com',
        password: 'refreshTestPassword123',
        firstName: 'Refresh',
        lastName: 'Test',
        tenantId: testData.tenantId
      };

      const registerResult = await authService.register(registerData);
      const { refreshToken } = registerResult.tokens;

      // Wait a moment to ensure new token is different
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh the token
      const newTokens = await authService.refreshToken(refreshToken);
      
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.accessToken).not.toBe(registerResult.tokens.accessToken);
    });

    test('should reject invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid.refresh.token';

      await expect(authService.refreshToken(invalidRefreshToken)).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('User Retrieval', () => {
    test('should get user by ID', async () => {
      const user = await authService.getUserById(testData.userId, testData.tenantId);
      
      expect(user).toBeDefined();
      expect(user!.id).toBe(testData.userId);
      expect(user!.email).toBe(testData.testUser.email);
      expect(user!.tenant_id).toBe(testData.tenantId);
      expect(user).not.toHaveProperty('password_hash');
    });

    test('should return null for non-existent user', async () => {
      const nonExistentUserId = '99999999-9999-9999-9999-999999999999';
      
      const user = await authService.getUserById(nonExistentUserId, testData.tenantId);
      
      expect(user).toBeNull();
    });
  });
});