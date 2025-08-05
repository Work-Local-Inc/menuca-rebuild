import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
    const { email, password, firstName, lastName, tenantId }: RegisterRequest = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Email, password, firstName, and lastName are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Call backend auth service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        tenantId: tenantId || process.env.DEFAULT_TENANT_ID || 'default'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error || 'Registration failed',
        code: errorData.code || 'REGISTRATION_FAILED'
      });
    }

    const authData: { success: boolean; data: AuthResponse } = await response.json();

    if (!authData.success || !authData.data) {
      return res.status(400).json({
        error: 'Invalid registration response',
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
    res.status(201).json({
      success: true,
      data: {
        user: authData.data.user
      }
    });

  } catch (error) {
    console.error('Registration API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
}