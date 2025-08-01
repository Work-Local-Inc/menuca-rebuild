import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { auth_token, user_data } = req.cookies;

    if (!auth_token || !user_data) {
      return res.status(401).json({
        error: 'No access token found',
        code: 'NO_TOKEN'
      });
    }

    // DEMO MODE: Return user from cookie
    // TODO: Replace with real JWT verification when backend is deployed
    try {
      const user = JSON.parse(user_data);
      return res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (parseError) {
      return res.status(401).json({
        error: 'Invalid user data',
        code: 'INVALID_USER_DATA'
      });
    }

    /* ORIGINAL JWT VERIFICATION CODE - Commented out for demo mode
    // Verify the JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(auth_token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Call backend to get current user info
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error || 'Failed to get user info',
        code: errorData.code || 'GET_USER_FAILED'
      });
    }

    const userData = await response.json();

    if (!userData.success || !userData.data.user) {
      return res.status(401).json({
        error: 'Invalid user data response',
        code: 'INVALID_USER_DATA'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: userData.data.user
      }
    });

  } catch (error) {
    console.error('Get user info API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
}