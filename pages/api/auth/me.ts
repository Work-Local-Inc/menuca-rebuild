import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check for token in Authorization header OR cookies for persistence
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookies for browser refresh persistence
      token = req.cookies['auth-token'];
    }
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    if (token === 'demo-token') {
      const userData = {
        id: 'user-adminmenucalocal-YWRtaW5A',
        tenant_id: 'default-tenant',
        email: 'admin@menuca.local',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'active',
        email_verified: true,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        accessToken: token,
        isAdmin: true
      };

      return res.json({
        success: true,
        data: {
          user: userData
        }
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