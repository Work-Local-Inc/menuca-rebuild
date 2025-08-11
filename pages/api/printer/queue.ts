import { NextApiRequest, NextApiResponse } from 'next';
import { addPrintJob, getPendingJobs, markJobCompleted, getQueueStats } from './shared-queue';

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
    
    await addPrintJob(printJob);
    const stats = await getQueueStats();
    
    return res.status(200).json({
      success: true,
      message: 'Print job added to persistent queue',
      jobId: printJob.id,
      queueSize: stats.total
    });
    
  } else if (method === 'GET') {
    // Get pending print jobs for tablet
    const { restaurantId } = req.query;
    
    const pendingJobs = await getPendingJobs(restaurantId as string);
    const stats = await getQueueStats();
    
    console.log(`📱 Tablet ${restaurantId} checking queue. Found ${pendingJobs.length} pending jobs.`);
    
    return res.status(200).json({
      success: true,
      jobs: pendingJobs,
      totalQueue: stats.total,
      pending: stats.pending,
      completed: stats.completed
    });
    
  } else if (method === 'PUT') {
    // Mark job as completed
    const { jobId } = req.body;
    
    const success = await markJobCompleted(jobId);
    
    return res.status(200).json({
      success,
      message: success ? 'Job marked as completed in database' : 'Job not found'
    });
    
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}