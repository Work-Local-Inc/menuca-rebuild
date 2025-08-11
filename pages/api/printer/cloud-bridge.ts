import { NextApiRequest, NextApiResponse } from 'next';
import { addPrintJob, getQueueStats } from './shared-queue';

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

    try {
      // Add directly to the persistent print queue
      const printJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        restaurantId,
        orderData,
        receiptData,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      await addPrintJob(printJob);
      const stats = await getQueueStats();
      
      return res.status(200).json({
        success: true,
        message: `Receipt queued for printing at ${tablet.name}`,
        restaurantId,
        tablet: tablet.name,
        jobId: printJob.id,
        queueSize: stats.total,
        pending: stats.pending,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.log(`❌ Failed to queue print job:`, error);
      
      return res.status(500).json({
        success: false,
        message: `Failed to queue print job`,
        restaurantId,
        tablet: tablet.name,
        error: error instanceof Error ? error.message : 'Unknown error',
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