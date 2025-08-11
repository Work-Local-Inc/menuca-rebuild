// Shared print queue for all printer APIs
// Simple in-memory queue - will reset on deployment but works for testing
// In production, this would use Redis or a database

export let printQueue: any[] = [];

export function addPrintJob(job: any) {
  printQueue.push(job);
  console.log(`Added print job ${job.id} to queue. Queue size: ${printQueue.length}`);
  return job;
}

export function getPendingJobs(restaurantId: string) {
  return printQueue.filter(job => 
    job.restaurantId === restaurantId && job.status === 'pending'
  );
}

export function markJobCompleted(jobId: string) {
  const job = printQueue.find(j => j.id === jobId);
  if (job) {
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    console.log(`Marked job ${jobId} as completed`);
    return true;
  }
  return false;
}

export function getQueueStats() {
  return {
    total: printQueue.length,
    pending: printQueue.filter(j => j.status === 'pending').length,
    completed: printQueue.filter(j => j.status === 'completed').length
  };
}