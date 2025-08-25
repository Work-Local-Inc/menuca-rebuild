/**
 * Legacy Platform Menu Scraper
 * 
 * This scraper is designed to work with the legacy PHP4 ordering platform
 * that serves 100+ restaurant clients. All clients follow the same structure.
 * 
 * URL Pattern: {domain}/?p=menu
 * Example: https://order.tonys-pizza.ca/?p=menu
 */

const axios = require('axios');
const cheerio = require('cheerio');

class LegacyPlatformScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Main scraper function - extracts complete menu from legacy platform
   */
  async scrapeMenu(url) {
    try {
      console.log(`🔍 Scraping menu from: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      // Extract restaurant info
      const restaurant = this.extractRestaurantInfo($, url);
      
      // Extract menu categories and items
      const categories = this.extractMenuCategories($);
      
      console.log(`✅ Scraped ${categories.length} categories with ${this.countTotalItems(categories)} total items`);
      
      return {
        restaurant,
        categories,
        scraped_at: new Date().toISOString(),
        source_url: url
      };
      
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw new Error(`Failed to scrape menu from ${url}: ${error.message}`);
    }
  }

  /**
   * Extract restaurant information from the page
   */
  extractRestaurantInfo($, url) {
    // Extract restaurant name (usually in title or header)
    let name = $('h1').first().text().trim() || 
               $('title').text().split('-')[0].trim() || 
               'Restaurant';
    
    // Extract phone number
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = $.text().match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';
    
    // Extract address
    const addressRegex = /\d+\s+[A-Za-z0-9\s,.']+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[A-Za-z0-9\s,.']*(?:[A-Z]{2}\s+[A-Z]\d[A-Z]\s+\d[A-Z]\d)?/i;
    const addressMatch = $.text().match(addressRegex);
    const address = addressMatch ? addressMatch[0].trim() : '';
    
    return {
      name,
      phone,
      address,
      cuisine: 'Pizza', // Default for legacy platform
      website: url
    };
  }

  /**
   * Extract all menu categories and their items
   */
  extractMenuCategories($) {
    const categories = [];
    
    // Look for category headers - multiple possible selectors
    const categorySelectors = [
      'h2', 'h3', '.category-title', '.menu-category', 
      'tr:has(td[colspan="3"]), tr:has(td[colspan="2"])', // Table-based categories
      '.category-header'
    ];
    
    let currentCategory = null;
    let categoryOrder = 0;
    
    // Process all elements to find categories and items
    $('body').find('*').each((index, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      // Skip empty elements
      if (!text) return;
      
      // Check if this is a category header
      if (this.isCategoryHeader($el, text)) {
        // Save previous category if it exists
        if (currentCategory && currentCategory.items.length > 0) {
          categories.push(currentCategory);
        }
        
        // Start new category
        currentCategory = {
          name: this.cleanCategoryName(text),
          items: [],
          order: categoryOrder++
        };
        console.log(`📂 Found category: ${currentCategory.name}`);
      }
      
      // Check if this is a menu item
      else if (currentCategory && this.isMenuItem($el)) {
        const item = this.extractMenuItem($el);
        if (item) {
          currentCategory.items.push(item);
          console.log(`  ✅ Added item: ${item.name} - $${item.price}`);
        }
      }
    });
    
    // Add the last category
    if (currentCategory && currentCategory.items.length > 0) {
      categories.push(currentCategory);
    }
    
    return categories.filter(cat => cat.items.length > 0);
  }

  /**
   * Determine if an element is a category header
   */
  isCategoryHeader($el, text) {
    const tagName = $el.prop('tagName');
    
    // Header tags
    if (['H1', 'H2', 'H3', 'H4'].includes(tagName)) {
      return true;
    }
    
    // Table cells that span multiple columns (category headers)
    if (tagName === 'TD' && ($el.attr('colspan') === '3' || $el.attr('colspan') === '2')) {
      return true;
    }
    
    // Elements with category classes
    if ($el.hasClass('category') || $el.hasClass('menu-category') || $el.hasClass('category-title')) {
      return true;
    }
    
    // Bold text that looks like a category (common patterns)
    if (tagName === 'B' || tagName === 'STRONG') {
      const categoryKeywords = ['pizza', 'appetizers', 'wings', 'salads', 'drinks', 'special', 'combo', 'platters', 'subs', 'wraps', 'desserts', 'pasta', 'nachos'];
      return categoryKeywords.some(keyword => text.toLowerCase().includes(keyword));
    }
    
    return false;
  }

  /**
   * Determine if an element contains a menu item
   */
  isMenuItem($el) {
    const text = $el.text().trim();
    
    // Look for price patterns ($X.XX)
    const pricePattern = /\$\d+\.\d{2}/;
    if (!pricePattern.test(text)) return false;
    
    // Must have some descriptive text (not just price)
    const textWithoutPrice = text.replace(/\$\d+\.\d{2}/g, '').trim();
    if (textWithoutPrice.length < 3) return false;
    
    // Common table row structure
    if ($el.prop('tagName') === 'TR') return true;
    
    // Elements that commonly contain menu items
    if ($el.prop('tagName') === 'TD' || $el.prop('tagName') === 'DIV') {
      return true;
    }
    
    return false;
  }

  /**
   * Extract menu item details from an element
   */
  extractMenuItem($el) {
    const text = $el.text().trim();
    
    // Extract all prices
    const priceMatches = text.match(/\$(\d+\.\d{2})/g);
    if (!priceMatches) return null;
    
    const prices = priceMatches.map(p => parseFloat(p.replace('$', '')));
    
    // Extract item name (text before first price)
    const firstPriceIndex = text.indexOf(priceMatches[0]);
    let name = text.substring(0, firstPriceIndex).trim();
    
    // Clean up name (remove common prefixes/suffixes)
    name = name.replace(/^[»\-\*\•\s]+/, '').replace(/\s+$/, '');
    
    if (!name || name.length < 2) return null;
    
    // Extract description (text after name but before prices)
    let description = '';
    const nameEndIndex = firstPriceIndex;
    const descriptionText = text.substring(name.length, nameEndIndex).trim();
    if (descriptionText && !descriptionText.includes('$')) {
      description = descriptionText.replace(/^[»\-\*\•\s]+/, '').trim();
    }
    
    // Extract sizes (if multiple prices, likely different sizes)
    let sizes = [];
    if (prices.length > 1) {
      // Look for size indicators in the text
      const sizePatterns = [
        /small/i, /medium/i, /large/i, /x-large/i, /xl/i,
        /can/i, /bottle/i, /\d+ml/i, /\d+L/i, /\d+\s*oz/i,
        /\d+\s*pcs?/i, /\d+\s*pieces?/i
      ];
      
      // Try to extract sizes from nearby elements or text
      const fullText = $el.closest('tr').text() || text;
      sizePatterns.forEach(pattern => {
        const matches = fullText.match(pattern);
        if (matches) {
          sizes.push(matches[0]);
        }
      });
      
      // Default size names if we can't extract them
      if (sizes.length === 0) {
        if (prices.length === 2) sizes = ['Small', 'Large'];
        else if (prices.length === 3) sizes = ['Small', 'Medium', 'Large'];
        else if (prices.length === 4) sizes = ['Small', 'Medium', 'Large', 'X-Large'];
      }
    }
    
    return {
      name,
      description,
      prices,
      sizes: sizes.slice(0, prices.length), // Match sizes to prices
      price: prices[0] // Base price for database
    };
  }

  /**
   * Clean category name
   */
  cleanCategoryName(name) {
    return name
      .replace(/^(top|jump to course)/i, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Count total items across all categories
   */
  countTotalItems(categories) {
    return categories.reduce((total, category) => total + category.items.length, 0);
  }
}

// Export for use in API
module.exports = LegacyPlatformScraper;

// CLI usage
if (require.main === module) {
  const scraper = new LegacyPlatformScraper();
  const url = process.argv[2] || 'https://order.tonys-pizza.ca/?p=menu';
  
  scraper.scrapeMenu(url)
    .then(result => {
      console.log('\n📊 SCRAPING RESULTS:');
      console.log(`Restaurant: ${result.restaurant.name}`);
      console.log(`Categories: ${result.categories.length}`);
      console.log(`Total Items: ${scraper.countTotalItems(result.categories)}`);
      console.log('\n📋 Categories:');
      result.categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.items.length} items)`);
      });
      
      // Output full data as JSON
      console.log('\n📄 Full JSON data:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}
