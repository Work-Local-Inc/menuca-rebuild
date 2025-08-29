import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '')
);

export const config = {
  maxDuration: 60, // 60 seconds timeout for onboarding with large menus
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { profile, legacy_url } = req.body;
    
    console.log('🏪 Creating new restaurant:', profile.name);
    
    const restaurantId = uuidv4();
    // Generate a unique tenant ID based on restaurant name
    const tenantId = `${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const userId = 'onboarding-user';
    
    // Create Restaurant in Supabase (using existing schema)
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        id: restaurantId,
        tenant_id: tenantId,
        owner_id: userId,
        name: profile.name,
        description: profile.description || `Delicious ${profile.cuisine_type} restaurant`,
        cuisine_type: profile.cuisine_type,
        phone: profile.phone,
        email: profile.email,
        address: `${profile.address}, ${profile.city}, ${profile.state}`,
        website: profile.website || legacy_url,
        logo_url: profile.logo_url?.startsWith('blob:') ? null : profile.logo_url || null,
        banner_url: profile.header_image_url?.startsWith('blob:') ? null : profile.header_image_url || null,
        status: 'active',
        featured: false,
        is_open: true,
        is_featured: false
      })
      .select()
      .single();

    if (restaurantError) {
      console.error('Restaurant creation error:', restaurantError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create restaurant',
        details: restaurantError 
      });
    }

    console.log('✅ Restaurant created successfully:', restaurantId);

    return res.status(200).json({
      success: true,
      restaurant: {
        id: restaurantId,
        name: profile.name,
        status: 'active',
        menu_url: `/menu/${restaurantId}`,
        management_url: `/restaurant/${restaurantId}/dashboard`
      },
      menu_import: null,
      next_steps: [
        '✅ Restaurant created successfully',
        '✅ Menu import will start automatically',
        '✅ Your restaurant is now LIVE and ready for orders!'
      ]
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}