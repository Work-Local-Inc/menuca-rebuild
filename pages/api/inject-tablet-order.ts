/**
 * 🎯 TABLET.MENU.CA V3 INTEGRATION API
 * 
 * This endpoint receives MenuCA web orders and sends them to tablet.menu.ca
 * using the CORRECT v3 schema format (NO RT_KEYS!)
 * 
 * Flow: MenuCA Web → This API → tablet.menu.ca (v3 API) → A19 Tablet → NETUM Printers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sendOrderToTablet } from '../../lib/tablet-client';

// NO RT_KEYS! Using v3 schema now!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order } = req.body;
    
    if (!order) {
      return res.status(400).json({
        error: 'Missing order data in request body'
      });
    }

    console.log('🎯 USING V3 SCHEMA - Sending order to tablet.menu.ca:', order.id);
    
    // Generate order ID
    const orderId = parseInt(order.id) || Date.now() % 100000;
    
    // Use our NEW v3 tablet client (NO RT_KEYS!)
    const result = await sendOrderToTablet(order, orderId);
    
    if (result.success) {
      console.log(`✅ V3 SCHEMA SUCCESS! Order ${orderId} sent to tablet.menu.ca`);
      
      return res.status(200).json({
        success: true,
        message: 'Order sent using v3 schema',
        order_id: orderId,
        v3_result: result,
        instructions: [
          '🎯 Order sent using CORRECT v3 schema format',
          '📡 No rt_keys used - proper v3 API calls',
          '📱 A19 tablet should receive order via tablet.menu.ca',
          '🎵 Check tablet for air horn notification!'
        ]
      });
      
    } else {
      console.log(`❌ V3 SCHEMA FAILED: ${result.message}`);
      
      return res.status(500).json({
        success: false,
        message: 'V3 schema order failed',
        error: result.message,
        order_id: orderId
      });
    }
    
  } catch (error) {
    console.error('❌ V3 tablet integration error:', error);
    
    return res.status(500).json({
      error: 'V3 tablet integration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}