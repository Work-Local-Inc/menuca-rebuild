import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, refresh_token } = req.cookies;

    // If we have tokens, try to revoke the refresh token on the backend
    if (refresh_token) {
      try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        await fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': access_token ? `Bearer ${access_token}` : '',
          },
          body: JSON.stringify({
            refreshToken: refresh_token
          }),
        });
      } catch (error) {
        // Backend logout failed, but we'll still clear cookies
        console.error('Backend logout failed:', error);
      }
    }

    // Clear auth cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(0), // Expire immediately
    };

    const clearAccessToken = serialize('access_token', '', cookieOptions);
    const clearRefreshToken = serialize('refresh_token', '', cookieOptions);

    res.setHeader('Set-Cookie', [clearAccessToken, clearRefreshToken]);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout API error:', error);
    
    // Even if there's an error, we should still clear cookies for security
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(0),
    };

    const clearAccessToken = serialize('access_token', '', cookieOptions);
    const clearRefreshToken = serialize('refresh_token', '', cookieOptions);

    res.setHeader('Set-Cookie', [clearAccessToken, clearRefreshToken]);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}