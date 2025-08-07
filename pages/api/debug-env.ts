import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.CANADA_POST_API_KEY;
  
  res.status(200).json({
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    env: process.env.NODE_ENV
  });
}