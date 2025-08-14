/**
 * 🎯 TABLET POLLING ENDPOINT - getOrder()
 * 
 * A19 tablet will poll this endpoint to get new orders
 * Returns next pending order in v3 schema format
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { formatOrderForTablet } from '../../../lib/tablet-client';

// In-memory order queue (replace with database in production)
let pendingOrders: any[] = [];
let processedOrderIds = new Set<string>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed - use GET' });
  }

  try {
    console.log('📱 A19 tablet polling for orders via getOrder()...');
    
    // Get next pending order
    const nextOrder = pendingOrders.find(order => !processedOrderIds.has(order.id.toString()));
    
    if (!nextOrder) {
      console.log('📭 No pending orders for A19 tablet');
      return res.status(200).json({
        message: 'No pending orders',
        orders: [],
        timestamp: new Date().toISOString()
      });
    }
    
    // Format order in v3 schema
    const formattedOrder = formatOrderForTablet(nextOrder, parseInt(nextOrder.id));
    
    console.log(`📤 Returning order ${nextOrder.id} to A19 tablet:`, formattedOrder);
    
    return res.status(200).json({
      message: 'Order available',
      order: formattedOrder,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ getOrder() endpoint error:', error);
    
    return res.status(500).json({
      error: 'Failed to get order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 🔧 HELPER FUNCTION: Add order to queue
 * Call this when new web orders come in
 */
export function addOrderToQueue(order: any) {
  console.log(`➕ Adding order ${order.id} to tablet queue`);
  pendingOrders.push(order);
}

/**
 * 🔧 HELPER FUNCTION: Mark order as processed
 */
export function markOrderProcessed(orderId: string) {
  console.log(`✅ Marking order ${orderId} as processed`);
  processedOrderIds.add(orderId);
}