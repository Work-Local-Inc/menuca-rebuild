import { NextApiRequest, NextApiResponse } from 'next';

/**
 * 🧪 TEST TABLET INTEGRATION
 * 
 * Simple test endpoint to verify we can call tablet.menu.ca
 * This will help us debug the integration before building full system
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order } = req.body;

    console.log('🧪 Test tablet integration called with order:', order?.id);

    // Simple test - just return the order data for now
    // Later we can add actual tablet.menu.ca calls
    
    const testResult = {
      success: true,
      message: 'Test endpoint reached successfully',
      order_id: order?.id,
      restaurant_id: order?.restaurant_id,
      test_mode: true,
      timestamp: new Date().toISOString(),
      received_data: {
        order_id: order?.id,
        customer_name: order?.customer?.name,
        total: order?.totals?.total,
        items_count: order?.items?.length
      }
    };

    console.log('✅ Test result:', testResult);

    return res.status(200).json(testResult);

  } catch (error) {
    console.error('❌ Test tablet integration error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Test integration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}