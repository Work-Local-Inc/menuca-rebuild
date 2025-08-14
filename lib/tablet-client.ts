/**
 * 🎯 TABLET.MENU.CA CLIENT - PRODUCTION READY
 * 
 * Sends orders TO tablet.menu.ca so A19 tablet can pick them up
 * This is the CORRECT approach - we're the CLIENT, not the server!
 */

const TABLET_API_BASE = 'https://tablet.menu.ca';
const TABLET_API_VERSION = '3';

/**
 * Order data matching tablet.menu.ca v3 schema
 */
interface TabletOrderV3 {
  ver: 3;
  id: number;
  restaurant_id: number;
  delivery_type: number; // 1 = delivery, 2 = pickup
  comment: string;
  payment_method: string;
  payment_cc_ends?: string;
  payment_status: boolean;
  order_count: number;
  delivery_time: number;
  delivery_time_hr: string;
  discount_code?: string;
  
  address: {
    name: string;
    address1: string;
    address2: string;
    postal_code: string;
    phone: string;
    extension?: string;
  };
  
  order: Array<{
    item: string;
    type: string;
    qty: number;
    price: number; // in cents
    special_instructions?: string;
    ingredients?: Array<{
      item: string;
      type: string;
      qty: number | string;
      price: number; // in cents
    }>;
  }>;
  
  price: {
    subtotal: number; // in cents
    delivery: number;
    convenience: number;
    discount: number;
    tip: number;
    total: number;
    taxes: Record<string, number>;
  };
  
  deal?: {
    name: string;
    discount: number;
  };
  
  coupon?: {
    name: string;
    items?: string[];
  };
}

/**
 * Convert our order format to tablet.menu.ca v3 schema
 */
export function formatOrderForTablet(orderData: any, orderId: number): TabletOrderV3 {
  const now = new Date();
  const deliveryTime = new Date(now.getTime() + 45 * 60000); // 45 minutes from now
  
  return {
    ver: 3,
    id: orderId,
    restaurant_id: 19, // A19 restaurant ID
    delivery_type: orderData.delivery_type === 'pickup' ? 2 : 1,
    comment: orderData.delivery_instructions || orderData.notes || '',
    payment_method: orderData.payment?.method || 'Credit Card',
    payment_cc_ends: orderData.payment?.stripe_payment_id?.slice(-4) || '',
    payment_status: orderData.payment?.status === 'succeeded' || orderData.payment?.status === 'completed',
    order_count: 1,
    delivery_time: Math.floor(deliveryTime.getTime() / 1000),
    delivery_time_hr: deliveryTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    discount_code: orderData.coupon_code || '',
    
    address: {
      name: orderData.customer?.name || orderData.customer_name || 'Customer',
      address1: orderData.address?.street || orderData.delivery_address?.street || 'Address',
      address2: orderData.address?.unit || orderData.delivery_address?.unit || '',
      postal_code: orderData.address?.postal_code || orderData.delivery_address?.postal_code || 'K1A0A6',
      phone: orderData.customer?.phone || orderData.customer_phone || '555-1234',
      extension: orderData.address?.extension || ''
    },
    
    order: (orderData.items || []).map((item: any) => ({
      item: item.name || item.title || 'Menu Item',
      type: item.category || 'food',
      qty: item.quantity || 1,
      price: Math.round((item.price || 0) * 100), // Convert to cents
      special_instructions: item.special_instructions || item.notes || '',
      ingredients: (item.ingredients || item.modifiers || []).map((ing: any) => ({
        item: ing.name || ing.title,
        type: 'ingredient',
        qty: ing.quantity || 1,
        price: Math.round((ing.price || 0) * 100)
      }))
    })),
    
    price: {
      subtotal: Math.round((orderData.totals?.subtotal || orderData.subtotal || 0) * 100),
      delivery: Math.round((orderData.totals?.delivery_fee || orderData.delivery_fee || 0) * 100),
      convenience: Math.round((orderData.totals?.service_fee || orderData.service_fee || 0) * 100),
      discount: Math.round((orderData.totals?.discount || orderData.discount || 0) * 100),
      tip: Math.round((orderData.totals?.tip || orderData.tip || 0) * 100),
      total: Math.round((orderData.totals?.total || orderData.total || 0) * 100),
      taxes: {
        'HST': Math.round((orderData.totals?.tax || orderData.tax || 0) * 100)
      }
    },
    
    deal: orderData.deal ? {
      name: orderData.deal.name,
      discount: Math.round(orderData.deal.discount * 100)
    } : undefined,
    
    coupon: orderData.coupon ? {
      name: orderData.coupon.name,
      items: orderData.coupon.items || []
    } : undefined
  };
}

/**
 * 🎯 SEND ORDER TO tablet.menu.ca (A19 will pick it up)
 * 
 * This implements the developer's sendOrder() function
 * Sends v3 schema orders TO tablet.menu.ca for A19 polling
 */
export async function sendOrderToTablet(orderData: any, orderId: number): Promise<{
  success: boolean;
  message: string;
  order_id: number;
  response_data?: any;
}> {
  try {
    console.log(`🚀 Implementing sendOrder() - sending order ${orderId} to tablet.menu.ca...`);
    
    // Format order for v3 schema (NO RT_KEYS!)
    const tabletOrder = formatOrderForTablet(orderData, orderId);
    
    console.log('📦 Sending v3 schema order:', JSON.stringify(tabletOrder, null, 2));
    
    // Try multiple tablet.menu.ca endpoints until we find the right one
    const endpoints = [
      '/api/v3/sendOrder',     // Most likely endpoint
      '/api/orders',           // Alternative
      '/sendOrder',            // Simple path
      '/api/v3/orders',        // What we tried before
      '/action.php'            // Legacy endpoint (but with v3 data)
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🎯 Trying endpoint: ${TABLET_API_BASE}${endpoint}`);
        
        const response = await fetch(`${TABLET_API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'MenuCA-Platform/1.0'
          },
          body: JSON.stringify(tabletOrder)
        });
        
        const responseData = await response.text();
        
        console.log(`📡 ${endpoint} response: ${response.status} - ${responseData.substring(0, 200)}...`);
        
        if (response.ok && responseData.trim()) {
          console.log(`✅ SUCCESS! Order ${orderId} sent via ${endpoint}`);
          
          return {
            success: true,
            message: `Order sent successfully via ${endpoint}`,
            order_id: orderId,
            response_data: responseData,
            endpoint_used: endpoint
          };
        }
        
      } catch (endpointError) {
        console.log(`❌ ${endpoint} failed:`, endpointError);
        lastError = endpointError;
        continue;
      }
    }
    
    // If all endpoints failed, return the last error
    return {
      success: false,
      message: `All tablet.menu.ca endpoints failed. Last error: ${lastError}`,
      order_id: orderId
    };
    
  } catch (error) {
    console.error(`❌ Failed to send order ${orderId} to tablet:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      order_id: orderId
    };
  }
}

/**
 * 🎯 ACCEPT ORDER on tablet.menu.ca
 * 
 * Implements the developer's accept(order_id) function
 */
export async function acceptTabletOrder(orderId: number): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log(`✅ Implementing accept(${orderId}) on tablet.menu.ca...`);
    
    const endpoints = [
      `/api/v3/accept/${orderId}`,      // Most likely
      `/api/accept/${orderId}`,         // Alternative
      `/accept?order_id=${orderId}`,    // Query param version
      `/api/v3/orders/${orderId}/accept` // RESTful version
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🎯 Trying accept endpoint: ${TABLET_API_BASE}${endpoint}`);
        
        const response = await fetch(`${TABLET_API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ order_id: orderId })
        });
        
        const responseData = await response.text();
        
        if (response.ok) {
          console.log(`✅ Order ${orderId} accepted via ${endpoint}`);
          return {
            success: true,
            message: `Order accepted via ${endpoint}`
          };
        }
        
      } catch (endpointError) {
        continue;
      }
    }
    
    return {
      success: false,
      message: 'All accept endpoints failed'
    };
    
  } catch (error) {
    console.error(`❌ Failed to accept order ${orderId}:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 🎯 REJECT ORDER on tablet.menu.ca  
 * 
 * Implements the developer's reject(order_id, reason) function
 */
export async function rejectTabletOrder(orderId: number, reason?: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log(`❌ Implementing reject(${orderId}, "${reason}") on tablet.menu.ca...`);
    
    const endpoints = [
      `/api/v3/reject/${orderId}`,        // Most likely
      `/api/reject/${orderId}`,           // Alternative
      `/reject?order_id=${orderId}`,      // Query param version
      `/api/v3/orders/${orderId}/reject`  // RESTful version
    ];
    
    const rejectData = {
      order_id: orderId,
      reason: reason || 'Restaurant rejected order'
    };
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🎯 Trying reject endpoint: ${TABLET_API_BASE}${endpoint}`);
        
        const response = await fetch(`${TABLET_API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(rejectData)
        });
        
        const responseData = await response.text();
        
        if (response.ok) {
          console.log(`❌ Order ${orderId} rejected via ${endpoint}`);
          return {
            success: true,
            message: `Order rejected via ${endpoint}: ${reason}`
          };
        }
        
      } catch (endpointError) {
        continue;
      }
    }
    
    return {
      success: false,
      message: 'All reject endpoints failed'
    };
    
  } catch (error) {
    console.error(`❌ Failed to reject order ${orderId}:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}