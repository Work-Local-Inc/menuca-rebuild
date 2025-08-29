// Test if our scraper works with Milano's site

const FirecrawlApp = require('@mendable/firecrawl-js').default;
const { scrapeXtremePizzaMenu } = require('./lib/simple-scraper.ts');

async function testMilanoScraper() {
  console.log('🔍 Testing scraper on Milano\'s Gatineau site...\n');
  
  const firecrawl = new FirecrawlApp({ apiKey: 'fc-ac838657c3104fb78ac162ef8792fc97' });
  const url = 'https://gatineau.milanopizzeria.ca/?p=menu';
  
  console.log('1️⃣ Scraping Milano\'s menu...');
  try {
    const result = await firecrawl.scrape(url, {
      formats: ['html'],
      waitFor: 10000,
      onlyMainContent: false
    });
    
    if (result.html) {
      console.log(`   ✅ Got HTML (${result.html.length} characters)`);
      
      // Test our parser
      console.log('\n2️⃣ Parsing with simple scraper...');
      const parsed = scrapeXtremePizzaMenu(result.html);
      
      console.log(`   Categories: ${parsed.categories.length}`);
      console.log(`   Total items: ${parsed.totalItems}`);
      
      console.log('\n📊 Category breakdown:');
      parsed.categories.forEach(cat => {
        console.log(`   ${cat.name}: ${cat.items.length} items`);
      });
      
      // Check for specific Milano items
      const testItems = ['Margherita', 'All Dressed', 'Caesar', 'Lasagna'];
      console.log('\n3️⃣ Checking for Milano-specific items:');
      testItems.forEach(item => {
        const found = result.html.includes(item);
        console.log(`   ${item}: ${found ? '✅' : '❌'}`);
      });
      
      // Count menu blocks
      const itemBlocks = result.html.match(/class="alternate_[12]"/g) || [];
      console.log(`\n📊 Raw HTML contains ${itemBlocks.length} menu item blocks`);
      
    } else {
      console.log('   ❌ No HTML returned!');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

testMilanoScraper();
