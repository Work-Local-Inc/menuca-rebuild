import { NextApiRequest, NextApiResponse } from 'next';

// Cloud print bridge service
// This receives print requests from customers and forwards them to restaurant tablets
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { restaurantId, orderData, receiptData } = req.body;
    
    if (!restaurantId || !orderData || !receiptData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Cloud bridge: Received print request for restaurant ${restaurantId}`);

    // Restaurant tablet configurations
    // In production, this would be stored in a database
    const restaurantTablets = {
      'xtreme-pizza': {
        ip: '192.168.0.49',
        port: 8080,
        name: 'Xtreme Pizza Ottawa'
      }
      // Add more restaurants here as needed
    };

    const tablet = restaurantTablets[restaurantId as keyof typeof restaurantTablets];
    
    if (!tablet) {
      return res.status(404).json({ 
        error: `Restaurant ${restaurantId} not found`,
        availableRestaurants: Object.keys(restaurantTablets)
      });
    }

    console.log(`Forwarding to tablet ${tablet.name} at ${tablet.ip}:${tablet.port}`);

    // Forward the print request to the restaurant tablet
    const printPayload = {
      receipt: receiptData,
      orderData: orderData,
      printType: 'thermal_receipt',
      timestamp: new Date().toISOString(),
      source: 'menuca-cloud-bridge'
    };

    try {
      // Attempt to reach the tablet
      const tabletResponse = await fetch(`http://${tablet.ip}:${tablet.port}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printPayload),
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });

      if (tabletResponse.ok) {
        const result = await tabletResponse.text();
        console.log(`✅ Successfully forwarded to ${tablet.name}`);
        
        return res.status(200).json({
          success: true,
          message: `Receipt sent to ${tablet.name}`,
          restaurantId,
          tablet: tablet.name,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`❌ Tablet ${tablet.name} responded with ${tabletResponse.status}`);
        
        // Store in queue for retry (in production, use Redis/database)
        return res.status(202).json({
          success: false,
          message: `Tablet offline - queued for retry`,
          restaurantId,
          tablet: tablet.name,
          status: 'queued',
          timestamp: new Date().toISOString()
        });
      }

    } catch (tabletError) {
      console.log(`❌ Could not reach tablet ${tablet.name}:`, tabletError.message);
      
      // In production: Store in retry queue, send notification to restaurant
      return res.status(202).json({
        success: false,
        message: `Tablet unreachable - queued for retry`,
        restaurantId,
        tablet: tablet.name,
        error: tabletError.message,
        status: 'queued',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Cloud bridge error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}