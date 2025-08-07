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
    // Return mock data for development - ALWAYS for now
    const mockSuggestions = [
      {
        id: 'mock-1',
        text: '123 Main Street, Ottawa, ON K1A 0A6',
        description: 'Ottawa, Ontario, Canada'
      },
      {
        id: 'mock-2', 
        text: '456 Bank Street, Ottawa, ON K1S 3T4',
        description: 'Ottawa, Ontario, Canada'
      },
      {
        id: 'mock-3',
        text: '789 Somerset Street West, Ottawa, ON K1R 6P6',
        description: 'Ottawa, Ontario, Canada'
      }
    ].filter(addr => 
      addr.text.toLowerCase().includes(query.toLowerCase()) ||
      addr.description.toLowerCase().includes(query.toLowerCase())
    );
    
    return res.status(200).json({ 
      suggestions: mockSuggestions,
      debug: { query, apiKey: !!apiKey, mockLength: mockSuggestions.length }
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
    
    // Fallback to mock data
    const mockSuggestions = getMockCanadianAddresses(query);
    res.status(200).json({ 
      suggestions: mockSuggestions,
      fallback: true,
      error: 'Address service temporarily unavailable',
      debug: { originalError: error.message, query, mockCount: mockSuggestions.length }
    });
  }
}

// Mock Canadian addresses for development/fallback
function getMockCanadianAddresses(query: string) {
  const addresses = [
    // Ottawa addresses
    {
      id: 'mock-1',
      text: '123 Main Street, Ottawa, ON K1A 0A6',
      description: 'Ottawa, Ontario, Canada'
    },
    {
      id: 'mock-2', 
      text: '456 Bank Street, Ottawa, ON K1S 3T4',
      description: 'Ottawa, Ontario, Canada'
    },
    {
      id: 'mock-3',
      text: '789 Somerset Street West, Ottawa, ON K1R 6P6',
      description: 'Ottawa, Ontario, Canada'
    },
    {
      id: 'mock-4',
      text: '321 Rideau Street, Ottawa, ON K1N 5Y4', 
      description: 'Ottawa, Ontario, Canada'
    },
    {
      id: 'mock-5',
      text: '654 Preston Street, Ottawa, ON K1R 7W1',
      description: 'Ottawa, Ontario, Canada'
    },
    // Toronto addresses
    {
      id: 'mock-6',
      text: '100 Queen Street West, Toronto, ON M5H 2N2',
      description: 'Toronto, Ontario, Canada'
    },
    {
      id: 'mock-7',
      text: '200 Bay Street, Toronto, ON M5J 2J4',
      description: 'Toronto, Ontario, Canada'
    },
    // Vancouver addresses
    {
      id: 'mock-8',
      text: '300 Robson Street, Vancouver, BC V6B 3J1',
      description: 'Vancouver, British Columbia, Canada'
    },
    {
      id: 'mock-9',
      text: '400 Granville Street, Vancouver, BC V6C 1T2',
      description: 'Vancouver, British Columbia, Canada'
    },
    // Montreal addresses
    {
      id: 'mock-10',
      text: '500 Rue Sainte-Catherine, Montreal, QC H3B 1A7',
      description: 'Montreal, Quebec, Canada'
    }
  ];

  const lowerQuery = query.toLowerCase();
  console.log('Mock function called with query:', query, 'lowerQuery:', lowerQuery);
  console.log('Total addresses available:', addresses.length);
  
  const filtered = addresses.filter(addr => 
    addr.text.toLowerCase().includes(lowerQuery) ||
    addr.description.toLowerCase().includes(lowerQuery)
  );
  
  console.log('Filtered addresses:', filtered.length);
  
  return filtered.slice(0, 5);
}