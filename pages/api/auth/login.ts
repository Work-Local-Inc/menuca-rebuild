import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

interface AuthResponse {
  user: {
    id: string;
    tenant_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    email_verified: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, tenantId }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // DEMO MODE: Create mock user for frontend testing
    // TODO: Replace with real backend auth when server is deployed
    const mockUser = {
      id: `user-${Date.now()}`,
      tenant_id: tenantId || 'default-tenant',
      email: email,
      first_name: email.split('@')[0],
      last_name: 'Demo',
      role: 'restaurant_owner',
      status: 'active',
      email_verified: true,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockTokens = {
      accessToken: `demo-jwt-${Date.now()}`,
      refreshToken: `demo-refresh-${Date.now()}`,
      expiresIn: 900 // 15 minutes
    };

    const authResponse: AuthResponse = {
      user: mockUser,
      tokens: mockTokens
    };

    // Set HTTP-only cookies for demo
    const accessCookie = serialize('auth_token', mockTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: mockTokens.expiresIn,
      path: '/'
    });

    const refreshCookie = serialize('refresh_token', mockTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    const userCookie = serialize('user_data', JSON.stringify(mockUser), {
      httpOnly: false, // Allow client-side access for user info
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: mockTokens.expiresIn,
      path: '/'
    });

    res.setHeader('Set-Cookie', [accessCookie, refreshCookie, userCookie]);

    return res.status(200).json({
      success: true,
      message: 'Login successful (Demo Mode)',
      data: authResponse
    });

    /* ORIGINAL BACKEND CODE - Commented out for demo mode
    // Call backend auth service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        tenantId: tenantId || process.env.DEFAULT_TENANT_ID || 'default'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error || 'Authentication failed',
        code: errorData.code || 'LOGIN_FAILED'
      });
    }

    const authData: { success: boolean; data: AuthResponse } = await response.json();

    if (!authData.success || !authData.data) {
      return res.status(401).json({
        error: 'Invalid authentication response',
        code: 'INVALID_RESPONSE'
      });
    }

    // Set HTTP-only cookies for tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // Access token cookie (short-lived)
    const accessTokenCookie = serialize('access_token', authData.data.tokens.accessToken, {
      ...cookieOptions,
      maxAge: authData.data.tokens.expiresIn, // 15 minutes
    });

    // Refresh token cookie (long-lived)
    const refreshTokenCookie = serialize('refresh_token', authData.data.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set cookies in response
    res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);

    // Return user data (without tokens for security)
    res.status(200).json({
      success: true,
      data: {
        user: authData.data.user
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
}