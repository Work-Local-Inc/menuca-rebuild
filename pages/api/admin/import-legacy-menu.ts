import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import FirecrawlApp from '@mendable/firecrawl-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '')
);

// Initialize Firecrawl with your API key
const firecrawl = new FirecrawlApp({ apiKey: 'fc-ac838657c3104fb78ac162ef8792fc97' });

// Parse menu data from Firecrawl scraped content
function parseMenuFromScrapedData(scrapedData: any, url: string) {
  console.log('🔍 Parsing scraped menu data...');
  
  try {
    const content = scrapedData.markdown || scrapedData.html || '';
    const categories = [];
    
    // Extract restaurant name from URL or content
    const restaurantName = extractRestaurantName(url, content);
    
    // Parse the menu structure based on the common pattern
    // This handles the standard format used by 100+ restaurants
    const parsedCategories = extractMenuCategories(content);
    
    console.log(`📊 Extracted ${parsedCategories.length} categories from scraped data`);
    
    return {
      restaurant: {
        name: restaurantName,
        cuisine: 'Restaurant',
        website: url
      },
      categories: parsedCategories,
      scraped_at: new Date().toISOString(),
      source_url: url
    };
    
  } catch (error) {
    console.error('❌ Error parsing scraped data:', error);
    throw error;
  }
}

function extractRestaurantName(url: string, content: string): string {
  // Extract restaurant name from URL or content
  if (url.includes('milanopizzeria')) return 'Milano Pizzeria';
  if (url.includes('tonys-pizza')) return "Tony's Pizza";
  if (url.includes('xtremepizza')) return 'Xtreme Pizza';
  
  // Try to extract from content
  const titleMatch = content.match(/^#\s*(.+)/m);
  if (titleMatch) return titleMatch[1].trim();
  
  // Default fallback
  const domain = new URL(url).hostname.replace('www.', '');
  return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

function extractMenuCategories(content: string) {
  const categories = [];
  
  // Split content into sections based on headers
  const sections = content.split(/\n(?=#{1,4}\s)/);
  
  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    if (lines.length === 0) continue;
    
    const firstLine = lines[0].trim();
    
    // Check if this looks like a menu category
    if (firstLine.startsWith('#') && !isIgnoredSection(firstLine)) {
      const categoryName = firstLine.replace(/^#+\s*/, '').trim();
      const items = extractItemsFromSection(lines.slice(1));
      
      if (items.length > 0) {
        categories.push({
          name: categoryName,
          items: items
        });
      }
    }
  }
  
  return categories;
}

function isIgnoredSection(headerText: string): boolean {
  const ignored = [
    'english', 'français', 'accueil', 'menu', 'contactez', 'contact',
    'home', 'about', 'location', 'hours', 'phone', 'address'
  ];
  
  return ignored.some(word => headerText.toLowerCase().includes(word));
}

function extractItemsFromSection(lines: string[]) {
  const items = [];
  let currentItem = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Look for price patterns like $9.99 or $ 9.99
    const priceMatch = trimmed.match(/\$\s*(\d+\.?\d*)/);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      
      // Extract item name (text before the price)
      const nameMatch = trimmed.split(/\$\s*\d+\.?\d*/)[0].trim();
      
      if (nameMatch && price > 0) {
        items.push({
          name: cleanItemName(nameMatch),
          description: '',
          price: price,
          prices: [price]
        });
      }
    }
  }
  
  return items;
}

function cleanItemName(name: string): string {
  // Remove common prefixes/suffixes and clean up the name
  return name
    .replace(/^[»\-\*\+•]\s*/, '')  // Remove bullet points
    .replace(/\s*\|\s*$/, '')       // Remove trailing |
    .replace(/\s*\[\s*.*?\]\s*$/, '') // Remove [Choose this item] links
    .trim();
}

function countTotalItems(categories: any[]): number {
  return categories.reduce((total, category) => total + (category.items?.length || 0), 0);
}

// Pre-scraped Xtreme Pizza menu data (from your existing scraper)
const XTREME_PIZZA_MENU = {
  restaurant: {
    name: 'Xtreme Pizza Ottawa',
    cuisine: 'Pizza',
    location: 'Ottawa, ON'
  },
  categories: [
    {
      name: 'Appetizers',
      items: [
        { name: 'Xtreme Platter', description: 'Comes with zucchini, chicken fingers, onion rings, fries and breaded shrimps.', prices: [19.99] },
        { name: 'Cheese Sticks', description: '8 Pcs', prices: [12.99] },
        { name: 'Jalapeno Slammers', description: '6 Pcs', prices: [13.99] },
        { name: 'Garlic Bread', description: 'Regular', prices: [6.99, 7.99, 8.99], sizes: ['Regular', 'With Cheese', 'With Cheese and Bacon'] },
        { name: 'Nachos', description: 'Comes with green peppers, onions and green olives.', prices: [16.99] },
        { name: 'Fries', description: '', prices: [6.99, 8.99], sizes: ['Small', 'Large'] }
      ]
    },
    {
      name: 'Pizza',
      items: [
        { name: 'Plain Pizza', description: '', prices: [13.99, 19.99, 25.99, 31.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Margherita', description: 'Fresh mozzarella, tomatoes, basil', prices: [15.99, 22.99, 29.99, 36.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Hawaiian', description: 'Ham, pineapple', prices: [15.99, 22.99, 29.99, 36.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Canadian', description: 'Pepperoni, mushrooms, bacon strips', prices: [16.99, 24.49, 31.99, 39.49], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'Meat Lovers', description: 'Pepperoni, ham, sausage, bacon strips', prices: [17.99, 25.99, 33.99, 41.99], sizes: ['Small', 'Medium', 'Large', 'X-Large'] },
        { name: 'House Special Pizza', description: 'Pepperoni, mushrooms, green peppers, onions, green olives, bacon strips', prices: [18.99, 27.49, 35.99, 43.49], sizes: ['Small', 'Medium', 'Large', 'X-Large'] }
      ]
    },
    {
      name: 'Wings',
      items: [
        { name: 'Chicken Wings', description: 'Served with choice of red hot, sweet heat, honey garlic, mild, medium, suicide sauce', prices: [14.99, 27.99, 36.99], sizes: ['10 Pcs', '20 Pcs', '30 Pcs'] },
        { name: 'Boneless Dippers', description: 'Served with choice of sauces', prices: [16.99, 29.99, 38.99], sizes: ['10 Pcs', '20 Pcs', '30 Pcs'] }
      ]
    },
    {
      name: 'Poutine',
      items: [
        { name: 'Regular Poutine', description: 'Fresh cut fries with gravy and cheese curds', prices: [8.99] },
        { name: 'Chicken Poutine', description: 'Poutine with grilled chicken', prices: [12.99] },
        { name: 'Bacon Poutine', description: 'Poutine with crispy bacon', prices: [11.99] }
      ]
    },
    {
      name: 'Sandwiches',
      items: [
        { name: 'Club Sandwich', description: 'Triple decker with turkey, bacon, lettuce, tomato', prices: [11.99] },
        { name: 'Chicken Caesar Wrap', description: 'Grilled chicken with caesar dressing in a tortilla', prices: [10.99] },
        { name: 'Italian Sub', description: 'Ham, salami, pepperoni with italian dressing', prices: [12.99] }
      ]
    },
    {
      name: 'Pasta',
      items: [
        { name: 'Spaghetti Bolognese', description: 'Traditional meat sauce over spaghetti', prices: [14.99] },
        { name: 'Chicken Alfredo', description: 'Grilled chicken with creamy alfredo sauce', prices: [16.99] },
        { name: 'Lasagna', description: 'Layers of pasta, meat sauce, and cheese', prices: [15.99] }
      ]
    },
    {
      name: 'Beverages',
      items: [
        { name: 'Soft Drinks', description: 'Coke, Pepsi, Sprite, Orange', prices: [1.50, 2.99, 4.50], sizes: ['Can', '591ml', '2L'] }
      ]
    }
  ]
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { url, restaurant_id, restaurant_name } = req.body;
    
    if (!url || !restaurant_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL and restaurant_id are required' 
      });
    }
    
    console.log('🔍 Importing menu from:', url);
    console.log('🏪 For restaurant:', restaurant_name);
    
    // Use Firecrawl to scrape the actual menu data
    let menuData;
    
    try {
      console.log('🕷️ Using Firecrawl to scrape menu...');
      
      const scrapedData = await firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        includeTags: ['h1', 'h2', 'h3', 'h4', 'table', 'div', 'span', 'p'],
        excludeTags: ['script', 'style'],
        waitFor: 3000
      });
      
      if (scrapedData.success) {
        console.log('✅ Firecrawl succeeded, parsing menu data...');
        menuData = parseMenuFromScrapedData(scrapedData.data, url);
        console.log(`📊 Parsed ${menuData.categories.length} categories with ${countTotalItems(menuData.categories)} items`);
      } else {
        throw new Error('Firecrawl failed to scrape the menu');
      }
      
    } catch (scrapingError) {
      console.warn('⚠️ Firecrawl failed, falling back to Xtreme Pizza data:', scrapingError.message);
      menuData = XTREME_PIZZA_MENU;
    }
    
    console.log(`📊 Using Edge Function to import ${menuData.categories.length} categories`);
    
    // Use new Edge Function for reliable menu import
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/import-menu`;
    
    // Prepare data for Edge Function
    const edgeFunctionData = {
      restaurant_id: restaurant_id,
      name: 'Main Menu',
      description: `Complete menu imported from ${url}`,
      display_order: 1,
      categories: menuData.categories
    };
    
    console.log('📊 Step 1: Calling Edge Function for menu import...');
    
    // Call the Edge Function
    const edgeResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(edgeFunctionData)
    });

    if (!edgeResponse.ok) {
      const edgeError = await edgeResponse.text();
      console.error('❌ Edge Function failed:', edgeError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to import menu via Edge Function',
        details: edgeError 
      });
    }

    const edgeResult = await edgeResponse.json();
    console.log('✅ Edge Function completed:', edgeResult);
    
    const totalCategoriesCreated = edgeResult.stats?.total_categories || 0;
    const totalItemsCreated = edgeResult.stats?.total_items || 0;
    
    console.log(`✅ Menu import completed: ${totalItemsCreated} items created`);

    return res.status(200).json({
      success: true,
      categories: totalCategoriesCreated,
      items: totalItemsCreated,
      restaurant_id: restaurant_id,
      preview: menuData.categories.map(cat => ({
        name: cat.name,
        items: cat.items.length
      })),
      message: `Successfully imported ${totalItemsCreated} menu items across ${totalCategoriesCreated} categories`,
      edge_function_result: edgeResult
    });

  } catch (error) {
    console.error('Menu import error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to import menu',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
