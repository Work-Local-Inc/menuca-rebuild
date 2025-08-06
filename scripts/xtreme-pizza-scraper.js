/**
 * Xtreme Pizza Menu Scraper
 * Extracts menu data from https://ottawa.xtremepizzaottawa.com/?p=menu
 * Converts to MenuCA-compatible format for API ingestion
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class XtremePizzaScraper {
  constructor() {
    this.baseUrl = 'https://ottawa.xtremepizzaottawa.com/?p=menu';
    this.restaurant = {
      name: 'Xtreme Pizza Ottawa',
      location: 'Ottawa, ON',
      cuisine: 'Pizza',
      phone: '',
      address: '',
      website: 'https://ottawa.xtremepizzaottawa.com'
    };
  }

  async scrapeMenu() {
    console.log('🍕 Starting Xtreme Pizza menu scraping...');
    
    const browser = await puppeteer.launch({ 
      headless: false, // Keep as false to see what's happening
      defaultViewport: null,
      devtools: true // Open devtools to debug
    });
    
    try {
      const page = await browser.newPage();
      await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      console.log('📄 Page loaded, extracting menu data...');

      // First, let's inspect the page structure
      const pageStructure = await page.evaluate(() => {
        // Look for common menu structures
        const structures = {
          divWithIdF: document.querySelectorAll('div[id^="f_"]').length,
          allDivs: document.querySelectorAll('div').length,
          menuItems: document.querySelectorAll('li').length,
          sections: document.querySelectorAll('section').length,
          articles: document.querySelectorAll('article').length,
          h1: document.querySelectorAll('h1').length,
          h2: document.querySelectorAll('h2').length,
          h3: document.querySelectorAll('h3').length,
          h4: document.querySelectorAll('h4').length,
          menuTitles: document.querySelectorAll('.menu-title, .category-title, .section-title').length,
          priceElements: document.querySelectorAll('*').length > 0 ? 
            Array.from(document.querySelectorAll('*')).filter(el => 
              el.textContent && el.textContent.includes('$')).length : 0
        };
        
        // Sample some text content to understand structure
        const sampleContent = Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent && el.textContent.includes('$'))
          .slice(0, 5)
          .map(el => ({
            tagName: el.tagName,
            text: el.textContent.trim().substring(0, 100),
            id: el.id,
            className: el.className
          }));
          
        return { structures, sampleContent };
      });
      
      console.log('🔍 Page structure analysis:', pageStructure);

      // Extract menu data based on discovered structure
      const menuData = await page.evaluate(() => {
        const categories = [];
        
        // Find all category sections (they have IDs starting with 'f_')
        const categoryElements = document.querySelectorAll('div[id^="f_"]');
        
        categoryElements.forEach((categoryDiv) => {
          const categoryId = categoryDiv.id;
          
          // Find category name using the cname pattern we discovered
          const cnameId = categoryId.replace('f_', 'cname_');
          const cnameDiv = document.getElementById(cnameId);
          
          let categoryName = 'Unknown Category';
          if (cnameDiv) {
            const nameElement = cnameDiv.querySelector('p[style*="font-weight: bold"], p[style*="font-weight:bold"]');
            if (nameElement) {
              categoryName = nameElement.textContent.trim();
            }
          }
          
          // If no name found, try first meaningful text
          if (categoryName === 'Unknown Category') {
            const textLines = categoryDiv.textContent.split('\n').map(l => l.trim()).filter(Boolean);
            for (const line of textLines) {
              if (line.length > 2 && !line.includes('$') && !/^»/.test(line)) {
                categoryName = line;
                break;
              }
            }
          }
          
          // Extract menu items from forms within this category
          const items = [];
          const forms = categoryDiv.querySelectorAll('form[id^="form_"]');
          
          forms.forEach(form => {
            let itemName = '';
            let description = '';
            
            // Find the item name in bold p tag within the form
            const boldNameElement = form.querySelector('p[style*="font-weight: bold"], p[style*="font-weight:bold"]');
            if (boldNameElement) {
              itemName = boldNameElement.textContent.trim();
            }
            
            // Find the description in the next p tag after the name
            if (boldNameElement && boldNameElement.nextElementSibling && 
                boldNameElement.nextElementSibling.tagName === 'P') {
              const descElement = boldNameElement.nextElementSibling;
              const descText = descElement.textContent.trim();
              // Only use as description if it doesn't contain size markers or prices
              if (descText && !descText.includes('»') && !descText.includes('$') && 
                  descText.length > 5 && !descText.match(/^(Small|Medium|Large|X-Large)/i)) {
                description = descText;
              }
            }
            
            // Extract prices and sizes from the form text
            const prices = [];
            const sizes = [];
            
            const formText = form.textContent;
            const lines = formText.split('\n').map(l => l.trim()).filter(Boolean);
            
            let currentSize = null;
            for (const line of lines) {
              // Check for size indicators (» Small, » Medium, etc.)
              const sizeMatch = line.match(/^»\s*(Small|Medium|Large|X-Large)/i);
              if (sizeMatch) {
                currentSize = sizeMatch[1];
              }
              
              // Check for prices
              const priceMatch = line.match(/\$\s*(\d+\.\d{2})/);
              if (priceMatch && currentSize) {
                prices.push(parseFloat(priceMatch[1]));
                sizes.push(currentSize);
                currentSize = null; // Reset for next iteration
              }
            }
            
            // Only create item if we have a proper name and prices
            if (itemName && itemName.length > 1 && prices.length > 0) {
              items.push({
                name: itemName,
                description: description,
                prices: prices,
                sizes: sizes.length === prices.length ? sizes : prices.map((_, i) => `Size ${i + 1}`)
              });
            }
          });
          
          // Add category if it has items
          if (items.length > 0) {
            categories.push({
              id: categoryId,
              name: categoryName,
              items: items
            });
          }
        });
        
        return categories;
      });

      console.log(`✅ Extracted ${menuData.length} categories`);
      
      // Format for MenuCA backend
      const formattedData = this.formatForMenuCA(menuData);
      
      // Save raw data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `xtreme-pizza-${timestamp}.json`;
      const filepath = path.join(__dirname, '..', 'data', filename);
      
      // Ensure data directory exists
      const dataDir = path.dirname(filepath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, JSON.stringify(formattedData, null, 2));
      
      console.log(`💾 Menu data saved to: ${filepath}`);
      console.log(`📊 Total items scraped: ${this.countTotalItems(formattedData.categories)}`);
      
      return formattedData;
      
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }


  formatForMenuCA(rawData) {
    return {
      restaurant: this.restaurant,
      scrapedAt: new Date().toISOString(),
      categories: rawData.map(category => ({
        id: this.generateId(category.name),
        name: category.name,
        description: '',
        sortOrder: 0,
        items: category.items.map(item => this.formatMenuItem(item))
      }))
    };
  }

  formatMenuItem(item) {
    // Create variants for different sizes/prices
    const variants = item.sizes.map((size, index) => ({
      id: this.generateId(`${item.name}-${size}`),
      size: size,
      price: Math.round(item.prices[index] * 100), // Convert to cents
      available: true
    }));
    
    return {
      id: this.generateId(item.name),
      name: item.name,
      description: item.description || '',
      category: '',
      variants: variants,
      tags: this.extractTags(item),
      dietary: this.extractDietary(item),
      preparationTime: this.estimatePreparationTime(item.name),
      available: true,
      featured: false,
      popular: false
    };
  }

  extractTags(item) {
    const tags = [];
    const name = item.name.toLowerCase();
    const desc = item.description.toLowerCase();
    
    if (name.includes('pizza')) tags.push('pizza');
    if (name.includes('wing')) tags.push('wings');
    if (name.includes('poutine')) tags.push('poutine');
    if (name.includes('donair')) tags.push('donair');
    if (desc.includes('spicy') || name.includes('hot')) tags.push('spicy');
    
    return tags;
  }

  extractDietary(item) {
    const dietary = [];
    const text = `${item.name} ${item.description}`.toLowerCase();
    
    if (text.includes('vegetarian') || text.includes('veggie')) dietary.push('vegetarian');
    if (text.includes('vegan')) dietary.push('vegan');
    if (text.includes('gluten free')) dietary.push('gluten-free');
    
    return dietary;
  }

  estimatePreparationTime(itemName) {
    const name = itemName.toLowerCase();
    
    if (name.includes('pizza')) return 20;
    if (name.includes('wing')) return 15;
    if (name.includes('pasta')) return 12;
    if (name.includes('salad')) return 5;
    if (name.includes('drink')) return 1;
    
    return 10; // Default
  }

  generateId(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  countTotalItems(categories) {
    return categories.reduce((total, category) => total + category.items.length, 0);
  }
}

// Run scraper if called directly
if (require.main === module) {
  const scraper = new XtremePizzaScraper();
  
  scraper.scrapeMenu()
    .then(data => {
      console.log('🎉 Scraping completed successfully!');
      console.log(`📋 Categories: ${data.categories.length}`);
      console.log(`🍕 Total items: ${scraper.countTotalItems(data.categories)}`);
    })
    .catch(error => {
      console.error('💥 Scraping failed:', error.message);
      process.exit(1);
    });
}

module.exports = XtremePizzaScraper;