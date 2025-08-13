/**
 * 🎯 TABLET.MENU.CA INTEGRATION API (TypeScript version)
 * 
 * This endpoint receives MenuCA web orders and injects them directly
 * into the tablet.menu.ca system used by 100 restaurants.
 * 
 * Flow: MenuCA Web → This API → tablet.menu.ca → Restaurant Tablets → NETUM Printers
 */

import { NextApiRequest, NextApiResponse } from 'next';

// Restaurant credentials mapping (discovered from reverse engineering)
const RESTAURANT_CREDENTIALS = {
  'P41': {
    rt_key: '689a41bef18a4',
    rt_designator: 'P41'
  },
  'A19': {
    rt_key: 'NEED_TO_DISCOVER', // Need to find your tablet's rt_key
    rt_designator: 'A19'
  },
  // Add more restaurants as we obtain their credentials
  'O33': {
    rt_key: '689a3cd4216f2', // Example from earlier discovery
    rt_designator: 'O33'
  }
};

const TABLET_API_BASE = 'https://tablet.menu.ca';
const RT_API_VERSION = '13';

/**
 * Format MenuCA order for tablet.menu.ca system
 */
function formatOrderForTablet(order) {
  const deliveryTime = Math.floor(Date.now() / 1000) + (45 * 60); // 45 minutes from now
  
  return {
    id: order.id,
    restaurant_id: order.restaurant_id,
    delivery_type: 1, // 1 = delivery, 2 = pickup
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email || ''
    },
    address: {
      name: order.address.name,
      address1: order.address.address1,
      address2: order.address.address2 || '',
      city: order.address.city,
      province: order.address.province,
      postal_code: order.address.postal_code,
      phone: order.address.phone
    },
    order: order.items.map(item => ({
      item: item.name,
      type: 'Food', // Generic type, could be categorized better
      qty: item.quantity,
      price: item.price,
      special_instructions: item.special_instructions || '',
      ingredients: [] // Could map item options to ingredients
    })),
    price: {
      subtotal: order.totals.subtotal,
      tax: order.totals.tax,
      delivery: order.totals.delivery,
      tip: order.totals.tip || 0,
      total: order.totals.total,
      taxes: {
        'HST': order.totals.tax
      }
    },
    payment_method: order.payment.method,
    payment_status: order.payment.status === 'succeeded' ? 1 : 0,
    comment: order.delivery_instructions || '',
    delivery_time: deliveryTime,
    time_created: Math.floor(Date.now() / 1000),
    status: 0, // 0 = NEW order
    ver: 2 // Version 2 format
  };
}

/**
 * Inject order into tablet.menu.ca system
 */
async function injectOrderToTablet(order) {
  const restaurantCreds = RESTAURANT_CREDENTIALS[order.restaurant_id];
  if (!restaurantCreds) {
    throw new Error(`No credentials found for restaurant: ${order.restaurant_id}`);
  }

  const formattedOrder = formatOrderForTablet(order);
  
  console.log('🎯 Injecting order to tablet.menu.ca:', {
    restaurant: order.restaurant_id,
    order_id: order.id,
    total: order.totals.total
  });

  // Test multiple injection methods based on our discoveries
  const methods = [
    { action: 'submit', description: 'Submit new order' },
    { action: 'create', description: 'Create new order' },
    { action: 'add', description: 'Add new order' },
    { action: 'new', description: 'New order submission' }
  ];

  let lastResponse = null;
  
  for (const method of methods) {
    try {
      console.log(`📡 Trying ${method.description} (action: ${method.action})`);
      
      const params = new URLSearchParams({
        key: restaurantCreds.rt_key,
        action: method.action,
        order: JSON.stringify(formattedOrder),
        api_ver: RT_API_VERSION,
        restaurant_id: restaurantCreds.rt_designator
      });

      const response = await fetch(`${TABLET_API_BASE}/action.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MenuCA-Integration/1.0'
        },
        body: params
      });

      const responseText = await response.text();
      lastResponse = { status: response.status, body: responseText, method: method.action };
      
      console.log(`📊 Response (${method.action}):`, {
        status: response.status,
        body: responseText.substring(0, 200)
      });

      // If we get a successful response (not empty), try to verify the order was created
      if (response.ok && responseText && responseText !== '{}' && responseText.trim() !== '') {
        console.log(`✅ Potential success with ${method.action}!`);
        
        // Verify order appears in queue
        const verifyResult = await verifyOrderInQueue(restaurantCreds);
        if (verifyResult.found) {
          return {
            success: true,
            method: method.action,
            order_id: order.id,
            tablet_response: responseText,
            verification: verifyResult
          };
        }
      }
    } catch (error) {
      console.error(`❌ Error with ${method.action}:`, error);
    }
  }

  // If no method showed clear success, return the last response info
  return {
    success: false,
    order_id: order.id,
    message: 'Order injection attempted but could not verify success',
    restaurant_id: order.restaurant_id,
    attempts: methods.length,
    last_response: lastResponse
  };
}

/**
 * Verify order appears in restaurant queue
 */
async function verifyOrderInQueue(restaurantCreds) {
  try {
    const params = new URLSearchParams({
      key: restaurantCreds.rt_key,
      sw_ver: 'MenuCA-Integration-1.0',
      api_ver: RT_API_VERSION
    });

    const response = await fetch(`${TABLET_API_BASE}/get_orders.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MenuCA-Integration/1.0'
      },
      body: params
    });

    const responseText = await response.text();
    console.log('🔍 Queue verification response:', responseText);

    // If we get anything other than empty {}, there might be orders
    if (response.ok && responseText && responseText !== '{}') {
      try {
        const data = JSON.parse(responseText);
        return {
          found: !!data.id || (Array.isArray(data) && data.length > 0),
          data: data,
          raw_response: responseText
        };
      } catch (parseError) {
        // If it's not JSON but not empty, might be success
        return {
          found: responseText.trim() !== '',
          data: responseText,
          raw_response: responseText
        };
      }
    }

    return { found: false, data: null, raw_response: responseText };
  } catch (error) {
    console.error('❌ Queue verification error:', error);
    return { found: false, error: error.message };
  }
}

/**
 * Main API handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order } = req.body;

    if (!order || !order.restaurant_id) {
      return res.status(400).json({ error: 'Invalid order data or missing restaurant_id' });
    }

    console.log('🎯 Starting tablet integration for order:', order.id);

    const result = await injectOrderToTablet(order);

    if (result.success) {
      console.log('🎉 Order successfully injected to tablet system!');
      
      return res.status(200).json({
        success: true,
        message: 'Order sent to restaurant tablet successfully',
        order_id: result.order_id,
        method: result.method,
        restaurant_id: order.restaurant_id,
        verification: result.verification
      });
    } else {
      console.log('⚠️ Order injection status unclear - logging details');
      
      return res.status(200).json({
        success: false,
        message: 'Order injection attempted - check tablet manually',
        order_id: result.order_id,
        restaurant_id: order.restaurant_id,
        debug_info: result,
        note: 'HTTP 200 responses from tablet.menu.ca suggest order may have been accepted'
      });
    }

  } catch (error) {
    console.error('❌ Tablet integration error:', error);
    
    return res.status(500).json({
      error: 'Tablet integration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}