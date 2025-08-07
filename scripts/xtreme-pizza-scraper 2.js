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
      headless: false, // Set to true for production
      defaultViewport: null 
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

      // Extract all menu data
      const menuData = await page.evaluate(() => {
        const categories = [];
        
        // Helper functions (must be defined inside evaluate)
        const extractCategoryName = (categoryDiv) => {
          // Try multiple selectors to find category name
          const selectors = ['h3', 'h2', '.category-title', 'strong'];
          
          for (const selector of selectors) {
            const element = categoryDiv.querySelector(selector);
            if (element && element.textContent.trim()) {
              return element.textContent.trim();
            }
          }
          
          // Fallback: use first text content
          const textContent = categoryDiv.textContent;
          const lines = textContent.split('\n').map(line => line.trim()).filter(Boolean);
          return lines.length > 0 ? lines[0] : null;
        };

        const extractItemData = (liElement) => {
          const text = liElement.textContent.trim();
          if (!text) return null;
          
          // Parse item structure
          const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
          if (lines.length === 0) return null;
          
          const item = {
            name: '',
            description: '',
            prices: [],
            sizes: []
          };
          
          // Extract name (first line)
          item.name = lines[0];
          
          // Look for description (lines with » or descriptive text)
          let descriptionLines = [];
          let priceLines = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('$') && /\d+\.\d{2}/.test(line)) {
              priceLines.push(line);
            } else if (line.includes('»') || (!line.includes('$') && line.length > 10)) {
              descriptionLines.push(line.replace('»', '').trim());
            }
          }
          
          item.description = descriptionLines.join(' ');
          
          // Parse prices and sizes
          priceLines.forEach(priceLine => {
            const priceMatch = priceLine.match(/\$(\d+\.\d{2})/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1]);
              
              // Try to extract size
              let size = 'Regular';
              if (priceLine.toLowerCase().includes('small')) size = 'Small';
              else if (priceLine.toLowerCase().includes('medium')) size = 'Medium';
              else if (priceLine.toLowerCase().includes('large')) size = 'Large';
              else if (priceLine.toLowerCase().includes('x-large')) size = 'X-Large';
              
              item.prices.push(price);
              item.sizes.push(size);
            }
          });
          
          // If no prices found, this might not be a menu item
          if (item.prices.length === 0) return null;
          
          return item;
        };
        
        // Find all category sections (they have IDs starting with 'f_')
        const categoryElements = document.querySelectorAll('div[id^="f_"]');
        
        categoryElements.forEach(categoryDiv => {
          const categoryId = categoryDiv.id;
          const categoryName = extractCategoryName(categoryDiv);
          
          if (!categoryName) return;
          
          const items = [];
          const itemElements = categoryDiv.querySelectorAll('li');
          
          itemElements.forEach(li => {
            const item = extractItemData(li);
            if (item) items.push(item);
          });
          
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