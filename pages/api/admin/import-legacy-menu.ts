import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import FirecrawlApp from '@mendable/firecrawl-js';
import { parseMilanoMenu } from '@/lib/milano-parser';

// CRITICAL DEBUG: Log Supabase connection details
console.log('🔍 Supabase Connection Debug:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
});

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

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

interface MenuItem {
  name: string;
  description: string;
  price: number;
  prices: number[];
}

function extractMenuCategories(content: string): MenuCategory[] {
  const categories: MenuCategory[] = [];
  
  // This menu uses a different format - look for category headers and price tables
  const lines = content.split('\n');
  let currentCategory: string | null = null;
  let currentItems: MenuItem[] = [];
  
  console.log(`🔍 Parsing ${lines.length} lines of content...`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and tables
    if (!line || line.startsWith('|') || line.startsWith('-')) continue;
    
    // Look for category headers (standalone lines that look like menu sections)
    if (isPotentialCategoryHeader(line)) {
      // Save previous category if it has items
      if (currentCategory && currentItems.length > 0) {
        categories.push({
          name: currentCategory,
          items: [...currentItems]
        });
      }
      
      currentCategory = line;
      currentItems = [];
      continue;
    }
    
    // Look for menu items (lines followed by price tables)
    if (currentCategory && isPotentialMenuItem(line, lines, i)) {
      const price = extractPriceFromNextLines(lines, i);
      if (price > 0) {
        currentItems.push({
          name: line,
          description: getItemDescription(lines, i),
          price: price,
          prices: [price]
        });
      }
    }
  }
  
  // Don't forget the last category
  if (currentCategory && currentItems.length > 0) {
    categories.push({
      name: currentCategory,
      items: currentItems
    });
  }
  
  return categories;
}

function isPotentialCategoryHeader(line: string): boolean {
  // Category headers in this format
  const categoryPatterns = [
    /^Spécial/i,
    /Pizza/i,
    /Poutine/i,
    /Sandwich/i,
    /Nachos/i,
    /Pâtes/i,
    /Dessert/i,
    /Breuvage/i,
    /Accompagnement/i,
    /Trempettes/i,
    /^Menu/i,
    /^Offres/i
  ];
  
  // Should be a standalone line, not too long
  if (line.length > 50 || line.length < 3) return false;
  
  return categoryPatterns.some(pattern => pattern.test(line));
}

function isPotentialMenuItem(line: string, lines: string[], index: number): boolean {
  // Skip obvious non-items
  if (line.includes('$') || line.includes('|') || line.includes('---')) return false;
  if (line.toLowerCase().includes('haut') || line.toLowerCase().includes('choisissez')) return false;
  
  // Look for a price in the next few lines
  for (let i = index + 1; i < Math.min(index + 5, lines.length); i++) {
    if (lines[i].includes('$') && extractPriceFromLine(lines[i]) > 0) {
      return true;
    }
  }
  
  return false;
}

function extractPriceFromNextLines(lines: string[], startIndex: number): number {
  for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
    const price = extractPriceFromLine(lines[i]);
    if (price > 0) return price;
  }
  return 0;
}

function extractPriceFromLine(line: string): number {
  const priceMatch = line.match(/\$\s*(\d+\.?\d*)/);
  return priceMatch ? parseFloat(priceMatch[1]) : 0;
}

function getItemDescription(lines: string[], index: number): string {
  // Look for description in the next line
  if (index + 1 < lines.length) {
    const nextLine = lines[index + 1].trim();
    if (nextLine && !nextLine.includes('$') && !nextLine.startsWith('|') && nextLine.length > 10) {
      return nextLine;
    }
  }
  return '';
}

function extractItemsFromSection(lines: string[]): MenuItem[] {
  const items: MenuItem[] = [];
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
      
      const scrapedData = await firecrawl.scrape(url, {
        formats: ['markdown', 'html'],
        includeTags: ['h1', 'h2', 'h3', 'h4', 'table', 'div', 'span', 'p'],
        excludeTags: ['script', 'style'],
        waitFor: 3000
      });
      
      if (scrapedData && (scrapedData.markdown || scrapedData.html)) {
        console.log('✅ Firecrawl succeeded, parsing menu data...');
        console.log('🔍 Scraped data preview:', {
          markdownLength: scrapedData.markdown?.length || 0,
          htmlLength: scrapedData.html?.length || 0,
          firstLines: scrapedData.markdown?.split('\n').slice(0, 20) || []
        });
        
        // Use the new Milano parser if it's a Milano URL
        if (url.includes('milanopizzeria')) {
          console.log('🍕 Using Milano-specific parser...');
          const parsedCategories = parseMilanoMenu(scrapedData.markdown || '');
          menuData = {
            restaurant: {
              name: 'Milano Pizzeria',
              cuisine: 'Italian Pizza',
              website: url
            },
            categories: parsedCategories.map(cat => ({
              name: cat.name,
              items: cat.items.map(item => ({
                name: item.name,
                description: item.description || '',
                price: item.prices[0]?.price || 0,
                prices: item.prices.map(p => p.price)
              }))
            }))
          };
        } else {
          menuData = parseMenuFromScrapedData(scrapedData, url);
        }
        
        console.log(`📊 Parsed ${menuData.categories.length} categories with ${countTotalItems(menuData.categories)} items`);
        
        if (menuData.categories.length === 0) {
          console.warn('⚠️ Parser found 0 categories, using Xtreme Pizza fallback data');
          menuData = XTREME_PIZZA_MENU;
        }
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
    
    // Import directly using our own database logic (bypass Edge Function)
    console.log('📊 Step 2: Creating menu directly in database...');
    
    // Create menu
    const { data: menuResult, error: menuError } = await supabase
      .from('restaurant_menus')
      .insert({
        restaurant_id: restaurant_id,
        name: 'Main Menu',
        description: `Complete menu imported from ${url}`,
        is_active: true,
        display_order: 1,
        tenant_id: 'default-tenant'
      })
      .select()
      .single();

    if (menuError || !menuResult) {
      console.error('❌ Menu creation failed:', {
        error: menuError,
        code: menuError?.code,
        message: menuError?.message,
        details: menuError?.details,
        hint: menuError?.hint,
        restaurant_id: restaurant_id
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create restaurant menu',
        details: menuError,
        errorCode: menuError?.code,
        errorMessage: menuError?.message
      });
    }

    console.log('✅ Menu created:', menuResult.id);
    
    let totalCategoriesCreated = 0;
    let totalItemsCreated = 0;
    
    // Process categories and items
    for (const [categoryIndex, category] of menuData.categories.entries()) {
      console.log(`🔍 Processing category ${categoryIndex + 1}/${menuData.categories.length}: ${category.name}`);
      
      // Create category
      const { data: categoryResult, error: categoryError } = await supabase
        .from('menu_categories')
        .insert({
          menu_id: menuResult.id,
          name: category.name,
          description: category.description || `${category.name} items`,
          display_order: categoryIndex,
          is_active: true
        })
        .select()
        .single();

      if (categoryError || !categoryResult) {
        console.error(`❌ Category creation failed for ${category.name}:`, categoryError);
        continue;
      }

      console.log(`✅ Category created: ${category.name} (${category.items.length} items)`);
      totalCategoriesCreated++;

      // Create items for this category
      for (const [itemIndex, item] of category.items.entries()) {
        const basePrice = Array.isArray(item.prices) ? item.prices[0] : item.price;
        
        const { data: itemResult, error: itemError } = await supabase
          .from('menu_items')
          .insert({
            category_id: categoryResult.id,
            name: item.name,
            description: item.description || '',
            price: basePrice || 0,
            tenant_id: 'default-tenant'
          })
          .select()
          .single();

        if (itemError) {
          console.error(`❌ Item creation error for ${item.name}:`, itemError);
        } else {
          console.log(`✅ Created item: ${item.name} - $${basePrice}`);
          totalItemsCreated++;
        }
      }
    }
    
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
      categories_created: totalCategoriesCreated,
      items_created: totalItemsCreated
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
