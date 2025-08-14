/**
 * 🎯 ADD ORDER TO TABLET QUEUE
 * 
 * This endpoint receives orders from our web app and adds them to the queue
 * A19 tablet will poll getOrder() to fetch these orders
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { addOrderToQueue } from './getOrder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST' });
  }

  try {
    const { order } = req.body;
    
    if (!order) {
      return res.status(400).json({
        error: 'Missing order data in request body'
      });
    }

    console.log('📥 Adding new web order to tablet queue:', order.id);
    
    // Generate order ID if not provided
    const orderId = order.id || Date.now().toString();
    const orderWithId = { ...order, id: orderId };
    
    // Add to queue for A19 tablet to pick up
    addOrderToQueue(orderWithId);
    
    return res.status(200).json({
      success: true,
      message: 'Order added to tablet queue successfully',
      order_id: orderId,
      instructions: [
        '📱 Order added to queue - A19 tablet will poll getOrder() to fetch it',
        '🔄 Tablet will call accept() or reject() when restaurant responds',
        '✅ This is the CORRECT approach per developer instructions!'
      ]
    });
    
  } catch (error) {
    console.error('❌ Add order to queue error:', error);
    
    return res.status(500).json({
      error: 'Failed to add order to queue',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}