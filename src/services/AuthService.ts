/**
 * Authentication service for JWT token management and user authentication
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, JWTPayload, AuthTokens, LoginRequest, RegisterRequest, AuthResponse, UserRole, UserStatus } from '@/types/auth';
import db from '@/database/connection';
import redis from '@/cache/redis';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'menuca-dev-secret-change-in-production';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'menuca-refresh-secret-change-in-production';
    
    if (process.env.NODE_ENV === 'production') {
      if (this.JWT_SECRET === 'menuca-dev-secret-change-in-production' || 
          this.JWT_REFRESH_SECRET === 'menuca-refresh-secret-change-in-production') {
        throw new Error('JWT secrets must be set in production environment');
      }
    }
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(user: Omit<User, 'password_hash'>): Promise<AuthTokens> {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    // Generate refresh token
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { ...payload, tokenId: refreshTokenId },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    // Store refresh token in Redis with 7-day expiry
    await redis.set(
      `${this.REFRESH_TOKEN_PREFIX}${refreshTokenId}`,
      JSON.stringify({ userId: user.id, tenantId: user.tenant_id }),
      7 * 24 * 60 * 60 // 7 days in seconds
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload & { tokenId: string };
      
      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`${this.REFRESH_TOKEN_PREFIX}${decoded.tokenId}`);
      if (!storedToken) {
        throw new Error('Refresh token not found or expired');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token' + error);
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload & { tokenId: string };
      await redis.del(`${this.REFRESH_TOKEN_PREFIX}${decoded.tokenId}`);
    } catch (error) {
      // Token might already be invalid, but we don't need to throw
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Authenticate user with email and password
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password, tenantId } = loginData;

    // Get user from database with tenant isolation
    const actualTenantId = tenantId || '00000000-0000-0000-0000-000000000000';
    const users = await db.queryWithTenant<User>(
      actualTenantId,
      'SELECT * FROM users WHERE email = $1 AND status = $2',
      [email, UserStatus.ACTIVE]
    );

    if (!users || users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login timestamp
    await db.queryWithTenant(
      user.tenant_id,
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const userWithoutPassword = this.excludePassword(user);
    const tokens = await this.generateTokens(userWithoutPassword);

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Register new user
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const { email, password, firstName, lastName, tenantId } = registerData;

    // Check if user already exists
    const actualTenantId = tenantId || '00000000-0000-0000-0000-000000000000';
    const existingUsers = await db.queryWithTenant<User>(
      actualTenantId,
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUsers && existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user  
    const userId = uuidv4();
    const newUsers = await db.queryWithTenant<User>(
      actualTenantId, 
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        actualTenantId,
        email,
        passwordHash,
        firstName,
        lastName,
        UserRole.CUSTOMER, // Default role  
        UserStatus.ACTIVE, // Use active instead of pending_verification for now
        false
      ]
    );

    if (!newUsers || newUsers.length === 0) {
      throw new Error('Failed to create user');
    }

    const newUser = newUsers[0];
    const userWithoutPassword = this.excludePassword(newUser);
    const tokens = await this.generateTokens(userWithoutPassword);

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const decoded = await this.verifyRefreshToken(refreshToken);

    // Get fresh user data
    const users = await db.queryWithTenant<User>(
      decoded.tenantId,
      'SELECT * FROM users WHERE id = $1 AND status = $2',
      [decoded.userId, UserStatus.ACTIVE]
    );

    if (!users || users.length === 0) {
      throw new Error('User not found or inactive');
    }

    const user = this.excludePassword(users[0]);
    
    // Generate new tokens
    return this.generateTokens(user);
  }

  /**
   * Get user by ID with tenant isolation
   */
  async getUserById(userId: string, tenantId: string): Promise<Omit<User, 'password_hash'> | null> {
    const users = await db.queryWithTenant<User>(
      tenantId,
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!users || users.length === 0) {
      return null;
    }

    return this.excludePassword(users[0]);
  }

  /**
   * Remove password hash from user object
   */
  private excludePassword(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();