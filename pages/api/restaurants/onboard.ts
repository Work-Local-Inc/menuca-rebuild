import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '')
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { profile, legacy_url } = req.body;
    
    console.log('🏪 Creating new restaurant:', profile.name);
    
    const restaurantId = uuidv4();
    const tenantId = 'default-tenant';
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
        website: profile.website || legacy_url,
        status: 'active',
        featured: false
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

    // Trigger Menu Import if legacy URL provided
    let menuImportResult = null;
    if (legacy_url) {
      try {
        console.log('🔍 Starting menu import from:', legacy_url);
        
        const baseUrl = req.headers.host?.includes('localhost') 
          ? `http://${req.headers.host}` 
          : `https://${req.headers.host}`;
          
        const importResponse = await fetch(`${baseUrl}/api/admin/import-legacy-menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: legacy_url,
            restaurant_id: restaurantId,
            restaurant_name: profile.name
          })
        });
        
        if (importResponse.ok) {
          menuImportResult = await importResponse.json();
          console.log('✅ Menu import successful:', menuImportResult);
        } else {
          console.warn('Menu import failed, but restaurant created');
        }
      } catch (importError) {
        console.warn('Menu import failed, but restaurant created:', importError);
      }
    }

    return res.status(200).json({
      success: true,
      restaurant: {
        id: restaurantId,
        name: profile.name,
        status: 'active',
        menu_url: `/menu/${restaurantId}`,
        management_url: `/restaurant/${restaurantId}/dashboard`
      },
      menu_import: menuImportResult,
      next_steps: [
        '✅ Restaurant created successfully',
        '✅ Menu import ' + (menuImportResult ? 'completed' : 'can be done manually'),
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