import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      return res.status(401).json({
        error: 'No refresh token found',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Call backend refresh endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refresh_token
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Clear invalid refresh token
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        expires: new Date(0),
      };

      const clearRefreshToken = serialize('refresh_token', '', cookieOptions);
      res.setHeader('Set-Cookie', [clearRefreshToken]);

      return res.status(response.status).json({
        error: errorData.error || 'Token refresh failed',
        code: errorData.code || 'REFRESH_FAILED'
      });
    }

    const refreshData = await response.json();

    if (!refreshData.success || !refreshData.data.tokens) {
      return res.status(401).json({
        error: 'Invalid refresh response',
        code: 'INVALID_REFRESH_RESPONSE'
      });
    }

    const { tokens } = refreshData.data;

    // Set new HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // New access token cookie
    const accessTokenCookie = serialize('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn, // 15 minutes
    });

    // New refresh token cookie (if provided)
    const cookies = [accessTokenCookie];
    if (tokens.refreshToken) {
      const refreshTokenCookie = serialize('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      cookies.push(refreshTokenCookie);
    }

    res.setHeader('Set-Cookie', cookies);

    res.status(200).json({
      success: true,
      data: {
        message: 'Tokens refreshed successfully'
      }
    });

  } catch (error) {
    console.error('Token refresh API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
}