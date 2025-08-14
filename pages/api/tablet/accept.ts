/**
 * 🎯 TABLET ACCEPT ENDPOINT - accept(order_id)
 * 
 * A19 tablet calls this when restaurant accepts an order
 * Returns ok/not ok response as required by developer instructions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { markOrderProcessed } from './getOrder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST' });
  }

  try {
    const { order_id } = req.body;
    
    if (!order_id) {
      return res.status(400).json({
        ok: false,
        error: 'Missing order_id in request body'
      });
    }
    
    console.log(`✅ A19 tablet ACCEPTED order ${order_id}`);
    
    // Mark order as processed so it won't be returned by getOrder() again
    markOrderProcessed(order_id.toString());
    
    // TODO: Update order status in database
    // TODO: Send confirmation email to customer
    // TODO: Trigger kitchen display system
    
    return res.status(200).json({
      ok: true,
      message: `Order ${order_id} accepted successfully`,
      order_id: order_id,
      status: 'accepted',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ accept() endpoint error:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Failed to accept order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}