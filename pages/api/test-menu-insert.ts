import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Try the EXACT same insert that's failing
    const { data, error } = await supabase
      .from('restaurant_menus')
      .insert({
        restaurant_id: '8223dbed-6f1c-49b7-88c5-b5129cd481f1',
        name: 'Test Menu Direct',
        description: 'Testing direct insert',
        is_active: true,
        display_order: 1,
        tenant_id: 'default-tenant'
      })
      .select()
      .single();
      
    res.status(200).json({
      success: !error,
      data: data,
      error: error,
      errorDetails: {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      caught: true,
      error: err.message,
      stack: err.stack
    });
  }
}
