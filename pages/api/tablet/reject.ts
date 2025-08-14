/**
 * 🎯 TABLET REJECT ENDPOINT - reject(order_id, reason)
 * 
 * A19 tablet calls this when restaurant rejects an order
 * Returns ok/not ok response as required by developer instructions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { markOrderProcessed } from './getOrder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST' });
  }

  try {
    const { order_id, reason } = req.body;
    
    if (!order_id) {
      return res.status(400).json({
        ok: false,
        error: 'Missing order_id in request body'
      });
    }
    
    console.log(`❌ A19 tablet REJECTED order ${order_id}`, reason ? `Reason: ${reason}` : '');
    
    // Mark order as processed so it won't be returned by getOrder() again
    markOrderProcessed(order_id.toString());
    
    // TODO: Update order status in database
    // TODO: Send rejection notification to customer
    // TODO: Process refund if payment was captured
    // TODO: Update inventory if items were reserved
    
    return res.status(200).json({
      ok: true,
      message: `Order ${order_id} rejected successfully`,
      order_id: order_id,
      status: 'rejected',
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ reject() endpoint error:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Failed to reject order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}