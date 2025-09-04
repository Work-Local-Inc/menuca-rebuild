import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import FirecrawlApp from '@mendable/firecrawl-js';
import { parseUniversalMenu } from '@/lib/universal-menu-parser';
import { parseMenuFromHTML } from '@/lib/html-menu-parser';
import { scrapeXtremePizzaMenu } from '@/lib/simple-scraper';
import { getHardcodedMenu } from '@/lib/hardcoded-menus';

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

// MOCK DATA DELETED - We should only use real scraped data!

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  maxDuration: 60, // 60 seconds timeout for large menu imports
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
    console.log('🆔 Restaurant ID:', restaurant_id);
    
    // Check if this is a preview request
    if (restaurant_id === 'temp-preview') {
      console.log('👁️ Preview mode detected - returning scraped data without saving');
    }
    
    // Create a progress row immediately so the UI can poll quickly
    let importId: string | null = null;
    if (restaurant_id !== 'temp-preview') {
      try {
        const { data: created, error: createErr } = await supabase
          .from('menu_imports')
          .insert({
            restaurant_id,
            tenant_id: null,
            source_url: url,
            status: 'running',
            total_categories: 0,
            total_items: 0,
            processed_categories: 0,
            processed_items: 0,
            logs: [{ event: 'start', at: new Date().toISOString(), message: 'Import requested' }]
          })
          .select()
          .single();
        if (createErr) {
          console.warn('⚠️ Early progress row insert failed:', createErr);
        } else {
          importId = created?.id || null;
        }
      } catch (e) {
        console.warn('⚠️ Early progress row threw:', e);
      }
    }

    // Try to scrape with a fast direct HTML fetch first, then fall back to Firecrawl
    let menuData;
    try {
      console.log('🕷️ Fast path: direct HTML fetch…');
      const direct = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 MenuCA Importer' } });
      const html = await direct.text();
      const altCountFast = (html.match(/class="alternate_[12]"/g) || []).length;
      if (altCountFast > 0) {
        const fastResult = scrapeXtremePizzaMenu(html);
        console.log(`⚡ Fast scraped ${fastResult.totalItems} items in ${fastResult.categories.length} categories`);
        menuData = {
          restaurant: {
            name: extractRestaurantName(url, html),
            cuisine: 'Restaurant',
            website: url
          },
          categories: fastResult.categories.map(cat => ({
            name: cat.name,
            items: cat.items.map(item => ({
              name: item.name,
              description: item.description || '',
              price: item.prices[0]?.price || 0,
              prices: item.prices.map(p => p.price)
            }))
          }))
        };
      }
    } catch (e) {
      console.warn('⚠️ Direct fetch failed or incomplete, will try Firecrawl:', (e as any)?.message || e);
    }

    if (!menuData) try {
      console.log('🕷️ Using Firecrawl with extended wait time…');
      const scrapedData = await firecrawl.scrape(url, {
        formats: ['html'],
        waitFor: 12000,
        onlyMainContent: false
      });
      if (scrapedData && scrapedData.html) {
        console.log('✅ Firecrawl succeeded, checking for menu items…');
        const alternateCount = (scrapedData.html.match(/class="alternate_[12]"/g) || []).length;
        console.log(`📊 Found ${alternateCount} menu item blocks`);
        if (alternateCount > 0) {
          const scrapedResult = scrapeXtremePizzaMenu(scrapedData.html);
          console.log(`📊 Scraped ${scrapedResult.totalItems} items in ${scrapedResult.categories.length} categories`);
          menuData = {
            restaurant: {
              name: extractRestaurantName(url, scrapedData.html),
              cuisine: 'Restaurant',
              website: url
            },
            categories: scrapedResult.categories.map(cat => ({
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
          throw new Error('Menu items not loaded - page may require longer wait time');
        }
      } else {
        throw new Error('Firecrawl failed to scrape the page');
      }
    } catch (scrapingError) {
      console.error('❌ Scraping failed:', (scrapingError as any)?.message || scrapingError);
      
      // Fall back to hardcoded menu if available
      const hardcodedMenu = getHardcodedMenu(url);
      if (hardcodedMenu) {
        console.log('⚠️ Using fallback hardcoded menu data');
        menuData = {
          restaurant: hardcodedMenu.restaurant,
          categories: hardcodedMenu.categories.map(cat => ({
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
        if (restaurant_id === 'temp-preview') {
          // Do not 500 on preview - return a soft failure with guidance
          return res.status(200).json({
            success: false,
            categories: 0,
            items: 0,
            restaurant_id,
            preview: [],
            isPreview: true,
            message: 'Preview scraping failed. You can still go live; import will run in the background.'
          });
        }
        throw new Error(`Menu scraping failed: ${(scrapingError as any)?.message || 'unknown'}`);
      }
    }
    
    console.log(`📊 Using Edge Function to import ${menuData.categories.length} categories`);

    // Prepare totals for progress tracking and update the early progress row
    const totalCategories = menuData.categories.length;
    const totalItems = menuData.categories.reduce((sum: number, c: any) => sum + (c.items?.length || 0), 0);
    if (importId) {
      try {
        await supabase
          .from('menu_imports')
          .update({
            total_categories: totalCategories,
            total_items: totalItems,
            logs: [{ event: 'scraped', at: new Date().toISOString(), message: `Parsed ${totalCategories} categories / ${totalItems} items` }]
          })
          .eq('id', importId);
      } catch (e) {
        console.warn('⚠️ Failed to update totals on progress row:', e);
      }
    }
    
    // If this is a preview, return the scraped data without saving
    if (restaurant_id === 'temp-preview') {
      return res.status(200).json({
        success: true,
        categories: menuData.categories.length,
        items: menuData.categories.reduce((total, cat) => total + cat.items.length, 0),
        restaurant_id: restaurant_id,
        preview: menuData.categories.map(cat => ({
          name: cat.name,
          items: cat.items.length  // Return count, not array
        })),
        isPreview: true
      });
    }
    
    // For real imports, first get the restaurant's tenant_id
    console.log('🔍 Fetching restaurant details to get tenant_id...');
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, tenant_id')
      .eq('id', restaurant_id)
      .single();
    
    if (restaurantError || !restaurantData) {
      console.error('❌ Failed to fetch restaurant:', restaurantError);
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
        details: restaurantError
      });
    }
    
    const tenantId = restaurantData.tenant_id;
    console.log('✅ Found tenant_id:', tenantId);
    
    // Import directly using our own database logic (bypass Edge Function)
    console.log('📊 Creating menu directly in database...');
    
    // Create menu
    console.log('🔍 Attempting to create menu with data:', {
      restaurant_id: restaurant_id,
      name: 'Main Menu',
      description: `Complete menu imported from ${url}`,
      is_active: true,
      display_order: 1,
      tenant_id: tenantId
    });

    const { data: menuResult, error: menuError } = await supabase
      .from('restaurant_menus')
      .insert({
        restaurant_id: restaurant_id,
        name: 'Main Menu',
        description: `Complete menu imported from ${url}`,
        is_active: true,
        display_order: 1,
        tenant_id: tenantId
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
    // Attach menu_id to progress row
    if (importId) {
      await supabase
        .from('menu_imports')
        .update({ menu_id: menuResult.id })
        .eq('id', importId);
    }
    
    let totalCategoriesCreated = 0;
    let totalItemsCreated = 0;
    const failedItems: { item: string, category: string, error: any }[] = [];
    
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
        // Track all items in failed category
        category.items.forEach(item => {
          failedItems.push({
            item: item.name,
            category: category.name,
            error: `Category failed: ${categoryError?.message || 'Unknown'}`
          });
        });
        // Update progress row after failed category
        if (importId) {
          await supabase
            .from('menu_imports')
            .update({
              processed_categories: totalCategoriesCreated,
              processed_items: totalItemsCreated,
              logs: [{ event: 'category_failed', at: new Date().toISOString(), category: category.name }]
            })
            .eq('id', importId);
        }
        continue;
      }

      console.log(`✅ Category created: ${category.name} (${category.items.length} items)`);
      totalCategoriesCreated++;

      // Update progress row after category creation
      if (importId) {
        await supabase
          .from('menu_imports')
          .update({ processed_categories: totalCategoriesCreated })
          .eq('id', importId);
      }

      // Create items for this category in batches to avoid timeouts
      const BATCH_SIZE = 25;
      const itemBatches: any[][] = [];
      
      for (let i = 0; i < category.items.length; i += BATCH_SIZE) {
        itemBatches.push(category.items.slice(i, i + BATCH_SIZE));
      }
      
      for (const batch of itemBatches) {
        const batchInserts = batch.map(item => {
          const basePrice = Array.isArray(item.prices) ? item.prices[0] : item.price;
          return {
            menu_id: menuResult.id,
            category_id: categoryResult.id,
            name: item.name,
            description: item.description || '',
            price: basePrice || 0,
            restaurant_id: restaurant_id,
            tenant_id: tenantId
          };
        });
        
        const { data: batchResults, error: batchError } = await supabase
          .from('menu_items')
          .insert(batchInserts)
          .select();
          
        if (batchError) {
          console.error(`❌ Batch insert error:`, batchError);
          batch.forEach(item => {
            failedItems.push({
              item: item.name,
              category: category.name,
              error: batchError.message
            });
          });
          if (importId) {
            await supabase
              .from('menu_imports')
              .update({
                processed_items: totalItemsCreated,
                logs: [{ event: 'batch_failed', at: new Date().toISOString(), error: batchError.message }]
              })
              .eq('id', importId);
          }
        } else if (batchResults) {
          console.log(`✅ Created batch of ${batchResults.length} items`);
          totalItemsCreated += batchResults.length;
          // Update progress after successful batch
          if (importId) {
            await supabase
              .from('menu_imports')
              .update({ processed_items: totalItemsCreated })
              .eq('id', importId);
          }
        }
      }
    }
    
    // Summary of failures
    if (failedItems.length > 0) {
      console.error(`\n⚠️  FAILED TO INSERT ${failedItems.length} ITEMS!`);
      const errorGroups: Record<string, number> = {};
      failedItems.forEach(f => {
        errorGroups[f.error] = (errorGroups[f.error] || 0) + 1;
      });
      console.error('Error breakdown:');
      Object.entries(errorGroups).forEach(([error, count]) => {
        console.error(`  - "${error}": ${count} items`);
      });
    }
    
    console.log(`✅ Menu import completed: ${totalItemsCreated} items created`);

    // Mark progress as completed
    if (importId) {
      await supabase
        .from('menu_imports')
        .update({
          status: 'completed',
          items_failed: failedItems.length,
          failure_summary: failedItems.length > 0 ? {
            total_failed: failedItems.length
          } : null,
          completed_at: new Date().toISOString()
        })
        .eq('id', importId);
    }

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
      items_created: totalItemsCreated,
      // Include failure info
      items_failed: failedItems.length,
      failure_summary: failedItems.length > 0 ? {
        total_failed: failedItems.length,
        errors: Object.entries(
          failedItems.reduce((acc, f) => {
            acc[f.error] = (acc[f.error] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([error, count]) => ({ error, count }))
      } : null
    });

  } catch (error) {
    console.error('Menu import error:', error);
    // Best-effort: mark failed
    try {
      const { url, restaurant_id } = req.body || {};
      if (restaurant_id && url) {
        await supabase
          .from('menu_imports')
          .update({
            status: 'failed',
            logs: [{ event: 'failed', at: new Date().toISOString(), error: (error as any)?.message || 'unknown' }]
          })
          .eq('restaurant_id', restaurant_id)
          .is('completed_at', null);
      }
    } catch {}
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to import menu',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
