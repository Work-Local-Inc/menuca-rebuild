import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // For demo purposes, return admin user if token exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // In a real app, you would validate the JWT token here
    const token = authHeader.substring(7);
    
    if (token === 'demo-token') {
      const userData = {
        id: 'user-adminmenucalocal-YWRtaW5A',
        email: 'admin@menuca.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        tenant_id: 'default-tenant',
        accessToken: token,
        isAdmin: true
      };

      return res.json({
        success: true,
        user: userData
      });
    }

    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}