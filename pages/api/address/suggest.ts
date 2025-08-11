import { NextApiRequest, NextApiResponse } from 'next';

// Handle getting detailed address information when user clicks a suggestion
async function handleAddressDetails(req: NextApiRequest, res: NextApiResponse, addressId: string) {
  const apiKey = process.env.CANADA_POST_API_KEY;
  
  if (!apiKey) {
    return res.status(503).json({ 
      error: 'Address service temporarily unavailable',
      message: 'Canada Post API key not configured'
    });
  }

  try {
    console.log('🔍 Canada Post API address details for ID:', addressId);
    
    // Canada Post AddressComplete Retrieve API endpoint
    const apiUrl = new URL('https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Retrieve/v2.11/json3.ws');
    apiUrl.searchParams.set('Key', apiKey);
    apiUrl.searchParams.set('Id', addressId);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'MenuCA/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Canada Post API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Address service error',
        status: response.status
      });
    }

    const data = await response.json();
    console.log('✅ Canada Post API address details received:', data?.Items?.[0]?.Line1 || 'No details');

    // Format the full address from Canada Post response
    const addressItem = data.Items?.[0];
    if (addressItem) {
      const fullAddress = [
        addressItem.Line1,
        addressItem.Line2,
        addressItem.City,
        addressItem.ProvinceCode,
        addressItem.PostalCode
      ].filter(Boolean).join(', ');

      return res.status(200).json({
        success: true,
        fullAddress,
        details: {
          street: addressItem.Line1 || '',
          city: addressItem.City || '',
          province: addressItem.ProvinceCode || '',
          postalCode: addressItem.PostalCode || '',
          country: 'Canada'
        }
      });
    }

    return res.status(404).json({ 
      error: 'Address not found',
      message: 'No detailed address information available'
    });

  } catch (error) {
    console.error('❌ Canada Post API address details failed:', error);
    return res.status(500).json({ 
      error: 'Address service error',
      message: 'Failed to fetch address details'
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q: query, id } = req.query;
  
  // Handle address detail request (when user clicks a suggestion)
  if (id && typeof id === 'string') {
    return handleAddressDetails(req, res, id);
  }
  
  if (!query || typeof query !== 'string' || query.length < 3) {
    return res.status(400).json({ error: 'Query parameter "q" must be at least 3 characters' });
  }

  const apiKey = process.env.CANADA_POST_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CANADA_POST_API_KEY not configured in environment variables');
    return res.status(503).json({ 
      error: 'Address service temporarily unavailable',
      message: 'Canada Post API key not configured'
    });
  }

  try {
    console.log('🔍 Canada Post API request for query:', query);
    
    // Canada Post AddressComplete API endpoint
    const apiUrl = new URL('https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws');
    apiUrl.searchParams.set('Key', apiKey);
    apiUrl.searchParams.set('SearchTerm', query);
    apiUrl.searchParams.set('Country', 'CAN');
    apiUrl.searchParams.set('LanguagePreference', 'en');
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'MenuCA/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Canada Post API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Address service error',
        status: response.status
      });
    }

    const data = await response.json();
    console.log('✅ Canada Post API response received:', data?.Items?.length || 0, 'suggestions');

    // Transform Canada Post response format to our expected format
    const suggestions = (data.Items || []).map((item: any, index: number) => ({
      id: item.Id || `suggestion-${index}`,
      text: item.Text || item.Description || '',
      highlight: item.Highlight || '',
      description: item.Description || ''
    }));

    return res.status(200).json({
      success: true,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('❌ Canada Post API request failed:', error);
    return res.status(500).json({ 
      error: 'Address service error',
      message: 'Failed to fetch address suggestions'
    });
  }
}