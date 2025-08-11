import { NextApiRequest, NextApiResponse } from 'next';
import { addPrintJob, getPendingJobs, getQueueStats } from './shared-queue';

// Test endpoint to manually add a print job and verify the system works
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Add a test print job
    const testJob = {
      id: `test_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      restaurantId: 'xtreme-pizza',
      orderData: {
        orderNumber: 'TEST' + Date.now().toString().slice(-6),
        paymentIntentId: 'test_payment_intent',
        total: 25.99,
        items: [
          { name: 'Test Pizza Large', quantity: 1, price: 22.99 },
          { name: 'Test Wings', quantity: 1, price: 3.00 }
        ]
      },
      receiptData: `
      MenuCA Test Restaurant
      1-800-MENUCA
      --------------------------------
      ORDER #TEST123
      ${new Date().toLocaleString()}
      --------------------------------
      ITEMS                     PRICE
      1x Test Pizza Large      $22.99
      1x Test Wings            $3.00
      --------------------------------
      Subtotal:                $25.99
      Tax:                     $3.38
      Delivery:                $2.99
      --------------------------------
      TOTAL:                   $32.36
      --------------------------------
      Thank you for your order!
      Visit us again soon!
      `,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    try {
      await addPrintJob(testJob);
      const stats = await getQueueStats();
      
      return res.status(200).json({
        success: true,
        message: 'Test print job added successfully',
        jobId: testJob.id,
        stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
    }
    
  } else if (req.method === 'GET') {
    // Get all pending jobs and stats
    try {
      const pendingJobs = await getPendingJobs('xtreme-pizza');
      const stats = await getQueueStats();
      
      return res.status(200).json({
        success: true,
        pendingJobs,
        stats,
        message: `Found ${pendingJobs.length} pending jobs`
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}