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

  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
}