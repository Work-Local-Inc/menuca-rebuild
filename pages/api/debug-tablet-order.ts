/**
 * 🔍 DEBUG TABLET ORDER - Shows exact data sent to tablet.menu.ca
 * 
 * This endpoint shows exactly what v3 schema data we would send
 * WITHOUT actually sending it to tablet.menu.ca
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { formatOrderForTablet } from '../../lib/tablet-client';

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

    // Generate order ID
    const orderId = parseInt(order.id) || Date.now() % 100000;
    
    // Format order for tablet.menu.ca v3 schema
    const tabletOrder = formatOrderForTablet(order, orderId);
    
    return res.status(200).json({
      debug_info: {
        message: 'This is what would be sent to tablet.menu.ca',
        endpoint: 'https://tablet.menu.ca/action.php',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'MenuCA-Platform/1.0'
        }
      },
      original_order: order,
      formatted_tablet_order: tabletOrder,
      analysis: {
        restaurant_id: tabletOrder.restaurant_id,
        id: tabletOrder.id,
        ver: tabletOrder.ver,
        delivery_type: tabletOrder.delivery_type,
        item_count: tabletOrder.order.length,
        total_price_cents: tabletOrder.order.reduce((sum, item) => sum + (item.price * item.qty), 0)
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}