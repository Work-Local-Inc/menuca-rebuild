/**
 * Test scraper to inspect the actual page structure
 */

const puppeteer = require('puppeteer');

async function testScraper() {
  console.log('🔍 Starting test scraper...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  try {
    const page = await browser.newPage();
    console.log('📍 Navigating to Xtreme Pizza...');
    
    await page.goto('https://ottawa.xtremepizzaottawa.com/?p=menu', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('✅ Page loaded successfully');
    
    // Wait a bit for any JavaScript to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get basic page info
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check for divs with IDs starting with 'f_'
    const fDivs = await page.evaluate(() => {
      const divs = document.querySelectorAll('div[id^="f_"]');
      return Array.from(divs).map(div => ({
        id: div.id,
        textLength: div.textContent.length,
        firstLine: div.textContent.split('\n')[0].trim(),
        hasPrice: div.textContent.includes('$')
      }));
    });
    
    console.log('🏷️  Found f_ divs:', fDivs.length);
    fDivs.forEach((div, i) => {
      console.log(`  ${i + 1}. ${div.id}: "${div.firstLine}" (${div.textLength} chars, has $: ${div.hasPrice})`);
    });
    
    // Check for price elements
    const priceCount = await page.evaluate(() => {
      return document.querySelectorAll('*:not(script):not(style)').length;
    });
    
    console.log('📊 Total elements:', priceCount);
    
    // Get sample of actual menu content
    const sampleMenuContent = await page.evaluate(() => {
      // Look for common patterns
      const patterns = [
        'pizza',
        'wing',
        'sub',
        'pasta',
        'salad',
        'chicken',
        'beef'
      ];
      
      const results = [];
      
      for (const pattern of patterns) {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && 
          el.textContent.toLowerCase().includes(pattern) &&
          el.textContent.includes('$')
        );
        
        if (elements.length > 0) {
          results.push({
            pattern,
            count: elements.length,
            sample: elements[0].textContent.trim().substring(0, 200)
          });
        }
      }
      
      return results;
    });
    
    console.log('🍕 Menu content samples:');
    sampleMenuContent.forEach(sample => {
      console.log(`  ${sample.pattern}: ${sample.count} matches`);
      console.log(`    Sample: "${sample.sample}"`);
      console.log('');
    });
    
    // Close automatically after showing results
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScraper();