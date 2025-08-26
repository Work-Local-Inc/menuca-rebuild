const FirecrawlApp = require('@mendable/firecrawl-js').default;

async function testFirecrawl() {
  const firecrawl = new FirecrawlApp({ apiKey: 'fc-ac838657c3104fb78ac162ef8792fc97' });
  
  try {
    console.log('🕷️ Scraping Milano Pizza menu...');
    const result = await firecrawl.scrape('https://gatineau.milanopizzeria.ca/?p=menu', {
      formats: ['markdown'],
      waitFor: 3000
    });
    
    console.log('✅ Got result with', result.markdown.length, 'characters');
    
    // Save to file to inspect
    require('fs').writeFileSync('scraped-menu.md', result.markdown);
    console.log('💾 Saved scraped content to scraped-menu.md');
    
    // Look for headings and pizza items
    const lines = result.markdown.split('\n');
    console.log('\n🔍 Looking for menu headings and items...');
    
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      const line = lines[i].trim();
      if (line.startsWith('#') || 
          line.toLowerCase().includes('pizza') ||
          line.toLowerCase().includes('salade') ||
          line.includes('$')) {
        console.log(`${i}: ${line}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFirecrawl();
