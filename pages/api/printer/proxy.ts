import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tabletIP, printData } = req.body;
    
    if (!tabletIP || !printData) {
      return res.status(400).json({ error: 'Missing tabletIP or printData' });
    }

    console.log(`Proxying print request to tablet ${tabletIP}...`);

    // Make HTTP request from Vercel server to tablet (server-to-server, no mixed content issues)
    const response = await fetch(`http://${tabletIP}:8080/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printData),
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const result = await response.text();
      console.log(`✅ Successfully sent to tablet ${tabletIP}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Receipt sent to printer successfully',
        tabletResponse: result 
      });
    } else {
      console.log(`❌ Tablet ${tabletIP} responded with ${response.status}`);
      return res.status(response.status).json({ 
        success: false, 
        error: `Tablet responded with ${response.status}` 
      });
    }

  } catch (error) {
    console.error('Printer proxy error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}