import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Test the connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Try a simple query
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(1);
      
    res.status(200).json({
      success: true,
      url: supabaseUrl,
      hasServiceKey: !!serviceKey,
      keyPrefix: serviceKey?.substring(0, 20) + '...',
      testQuery: {
        success: !error,
        data: data,
        error: error
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      url: supabaseUrl,
      hasServiceKey: !!serviceKey,
      error: err.message
    });
  }
}
