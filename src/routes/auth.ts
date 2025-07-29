/**
 * Authentication routes for login, registration, and token management
 */
import { Router, Request, Response } from 'express';
import { authService } from '@/services/AuthService';
import { authenticateToken } from '@/middleware/auth';
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from '@/types/auth';
import winston from 'winston';

const router = Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

/**
 * POST /auth/login
 * Authenticate user with email and password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const loginData: LoginRequest = {
      email: req.body.email,
      password: req.body.password,
      tenantId: req.body.tenantId || req.tenantContext?.tenantId
    };

    // Validate input
    if (!loginData.email || !loginData.password) {
      res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    // Authenticate user
    const authResponse = await authService.login(loginData);

    logger.info('User logged in successfully', {
      userId: authResponse.user.id,
      email: authResponse.user.email,
      tenantId: authResponse.user.tenant_id
    });

    res.json({
      success: true,
      data: authResponse
    });

  } catch (error) {
    logger.error('Login failed', {
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(401).json({
      error: 'Invalid credentials',
      code: 'LOGIN_FAILED'
    });
  }
});

/**
 * POST /auth/register
 * Register new user account
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const registerData: RegisterRequest = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      tenantId: req.body.tenantId || req.tenantContext?.tenantId
    };

    // Validate input
    if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
      res.status(400).json({
        error: 'Email, password, firstName, and lastName are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // Validate password strength
    if (registerData.password.length < 8) {
      res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
      return;
    }

    // Register user
    const authResponse = await authService.register(registerData);

    logger.info('User registered successfully', {
      userId: authResponse.user.id,
      email: authResponse.user.email,
      tenantId: authResponse.user.tenant_id
    });

    res.status(201).json({
      success: true,
      data: authResponse
    });

  } catch (error) {
    logger.error('Registration failed', {
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      ip: req.ip
    });

    // Check for duplicate email error
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
      return;
    }

    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
      return;
    }

    // Refresh tokens
    const newTokens = await authService.refreshToken(refreshToken);

    logger.info('Tokens refreshed successfully');

    res.json({
      success: true,
      data: {
        tokens: newTokens
      }
    });

  } catch (error) {
    logger.error('Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(401).json({
      error: 'Invalid or expired refresh token',
      code: 'REFRESH_FAILED'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and revoke refresh token
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the refresh token
      await authService.revokeRefreshToken(refreshToken);
    }

    logger.info('User logged out successfully', {
      userId: req.user?.id,
      email: req.user?.email
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });

    // Even if logout fails, we should return success for security
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

/**
 * GET /auth/me
 * Get current authenticated user info
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: req.user
      }
    });

  } catch (error) {
    logger.error('Get user info failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to get user info',
      code: 'GET_USER_FAILED'
    });
  }
});

/**
 * POST /auth/verify-token
 * Verify if an access token is valid
 */
router.post('/verify-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        error: 'Token is required',
        code: 'MISSING_TOKEN'
      });
      return;
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Get user to ensure they still exist and are active
    const user = await authService.getUserById(decoded.userId, decoded.tenantId);
    
    if (!user) {
      res.status(401).json({
        error: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        user: user,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    res.status(401).json({
      success: true,
      data: {
        valid: false,
        reason: error instanceof Error ? error.message : 'Token verification failed'
      }
    });
  }
});

export default router;