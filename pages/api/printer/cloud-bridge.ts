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
      // Add to print queue instead of trying to reach tablet directly
      const queueResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/printer/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          orderData,
          receiptData
        })
      });

      const queueResult = await queueResponse.json();
      
      if (queueResult.success) {
        console.log(`✅ Print job queued for ${tablet.name}. Job ID: ${queueResult.jobId}`);
        
        return res.status(200).json({
          success: true,
          message: `Receipt queued for printing at ${tablet.name}`,
          restaurantId,
          tablet: tablet.name,
          jobId: queueResult.jobId,
          queueSize: queueResult.queueSize,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Failed to add to queue');
      }

    } catch (error) {
      console.log(`❌ Failed to queue print job:`, error.message);
      
      return res.status(500).json({
        success: false,
        message: `Failed to queue print job`,
        restaurantId,
        tablet: tablet.name,
        error: error.message,
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