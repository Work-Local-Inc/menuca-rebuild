import { NextApiRequest, NextApiResponse } from 'next';

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

  } catch (error) {
    console.error('Get user info API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
}