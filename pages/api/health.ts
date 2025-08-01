import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Simple health check response
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'menuca-dashboard',
      version: '1.0.0'
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 