import { NextApiRequest, NextApiResponse } from 'next';
import FirecrawlApp from '@mendable/firecrawl-js';
import { parseUniversalMenu } from '@/lib/universal-menu-parser';

const firecrawl = new FirecrawlApp({ apiKey: 'fc-ac838657c3104fb78ac162ef8792fc97' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  
  try {
    console.log('🕷️ Scraping:', url);
    
    const scrapedData = await firecrawl.scrape(url, {
      formats: ['markdown', 'html'],
      includeTags: ['h1', 'h2', 'h3', 'h4', 'table', 'div', 'span', 'p'],
      excludeTags: ['script', 'style'],
      waitFor: 3000
    });
    
    const markdown = scrapedData.markdown || '';
    const first100Lines = markdown.split('\n').slice(0, 100);
    
    // Try to parse
    const parsedMenu = parseUniversalMenu(markdown, url);
    
    return res.status(200).json({
      success: true,
      scraped: {
        markdownLength: markdown.length,
        htmlLength: (scrapedData.html || '').length,
        first100Lines: first100Lines,
        hasTableData: markdown.includes('|'),
        hasPriceData: markdown.includes('$'),
        hasSizeData: markdown.includes('»')
      },
      parsed: {
        restaurant: parsedMenu.restaurant,
        categoriesCount: parsedMenu.categories.length,
        categories: parsedMenu.categories.map(c => ({
          name: c.name,
          itemCount: c.items.length,
          items: c.items.slice(0, 3).map(i => ({
            name: i.name,
            description: i.description,
            prices: i.prices
          }))
        }))
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
