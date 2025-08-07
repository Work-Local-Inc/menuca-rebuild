import { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory queue - will reset on deployment but works for testing
let printQueue: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'POST') {
    // Add print job to queue
    const { restaurantId, orderData, receiptData } = req.body;
    
    const printJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      restaurantId,
      orderData,
      receiptData,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    printQueue.push(printJob);
    console.log(`Added print job ${printJob.id} to queue. Queue size: ${printQueue.length}`);
    
    return res.status(200).json({
      success: true,
      message: 'Print job added to queue',
      jobId: printJob.id,
      queueSize: printQueue.length
    });
    
  } else if (method === 'GET') {
    // Get pending print jobs for tablet
    const { restaurantId } = req.query;
    
    const pendingJobs = printQueue.filter(job => 
      job.restaurantId === restaurantId && job.status === 'pending'
    );
    
    console.log(`Tablet ${restaurantId} checking queue. Found ${pendingJobs.length} pending jobs.`);
    
    return res.status(200).json({
      success: true,
      jobs: pendingJobs,
      totalQueue: printQueue.length
    });
    
  } else if (method === 'PUT') {
    // Mark job as completed
    const { jobId } = req.body;
    
    const job = printQueue.find(j => j.id === jobId);
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      console.log(`Marked job ${jobId} as completed`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Job marked as completed'
    });
    
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}