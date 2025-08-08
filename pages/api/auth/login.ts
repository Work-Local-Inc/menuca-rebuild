import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    // Generate consistent user ID based on email
    const emailHash = email.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userId = `user-${emailHash}-${Buffer.from(email.toLowerCase()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;

    // For demo purposes, accept these hardcoded credentials
    if (email === 'admin@menuca.local' && password === 'password123') {
      
      // Create/update user in Supabase auth
      let authUser;
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin'
          }
        });
        
        if (error && !error.message.includes('already registered')) {
          console.error('Auth user creation error:', error);
        } else {
          authUser = data?.user;
        }
      } catch (authError) {
        console.log('Auth user exists or creation failed:', authError);
      }

      // Return consistent user data matching AuthContext interface
      const userData = {
        id: userId,
        tenant_id: 'default-tenant',
        email,
        first_name: 'Admin',
        last_name: 'User', 
        role: 'admin',
        status: 'active',
        email_verified: true,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        accessToken: 'demo-token',
        isAdmin: true
      };

      return res.json({
        success: true,
        data: {
          user: userData
        },
        message: 'Login successful'
      });
    }

    // For other users, you would check against Supabase users table
    // const { data: user, error } = await supabase
    //   .from('users')
    //   .select('*')
    //   .eq('email', email)
    //   .single();

    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}