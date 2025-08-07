import { NextApiRequest, NextApiResponse } from 'next';

interface CanadaPostSuggestion {
  id: string;
  text: string;
  highlight: string;
  cursor: number;
  description: string;
  next: string;
}

interface CanadaPostResponse {
  items: CanadaPostSuggestion[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q: query } = req.query;
  
  if (!query || typeof query !== 'string' || query.length < 3) {
    return res.status(400).json({ error: 'Query must be at least 3 characters' });
  }

  const apiKey = process.env.CANADA_POST_API_KEY;
  
  // Canada Post API integration
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Canada Post API key not configured',
      message: 'Address validation service unavailable' 
    });
  }

  try {
    // Canada Post Address Complete API - Interactive Find endpoint
    const apiUrl = 'https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws';
    
    const params = new URLSearchParams({
      Key: apiKey,
      SearchTerm: query,
      Country: 'CAN',
      MaxSuggestions: '5',
      Origin: process.env.NEXT_PUBLIC_SITE_URL || 'localhost'
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MenuCA/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canada Post API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform Canada Post response to our format
    const suggestions = data.Items?.map((item, index) => ({
      id: item.Id || `cp-${index}`,
      text: item.Text,
      highlight: item.Highlight,
      description: item.Description || 'Canada'
    })) || [];

    res.status(200).json({ suggestions });
    
  } catch (error) {
    console.error('Canada Post API error:', error);
    
    // Return error - NO FALLBACK TO MOCK DATA
    res.status(503).json({
      error: 'Address service temporarily unavailable',
      message: 'Unable to validate addresses at this time',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}