/**
 * Debug scraper to understand the exact structure of one menu section
 */

const puppeteer = require('puppeteer');

async function debugScraper() {
  console.log('🐛 Starting debug scraper...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://ottawa.xtremepizzaottawa.com/?p=menu', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Focus on the largest div (f_6715 with 43K chars)
    const largestDivContent = await page.evaluate(() => {
      const div = document.getElementById('f_6715');
      if (!div) return null;
      
      // Get the raw HTML structure
      const html = div.innerHTML.substring(0, 2000); // First 2000 chars
      
      // Get text content broken into meaningful chunks
      const textContent = div.textContent;
      const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Find lines with prices
      const priceLines = lines.filter(line => line.includes('$') && /\d+\.\d{2}/.test(line));
      
      // Find potential item names (lines before price lines)
      const itemLines = [];
      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i];
        const nextLine = lines[i + 1];
        
        if (nextLine && nextLine.includes('$') && !currentLine.includes('$') && currentLine.length > 2) {
          itemLines.push({
            name: currentLine,
            price: nextLine
          });
        }
      }
      
      return {
        html: html,
        totalLines: lines.length,
        priceLines: priceLines.slice(0, 10), // First 10 price lines
        potentialItems: itemLines.slice(0, 10) // First 10 potential items
      };
    });
    
    console.log('📋 Largest div (f_6715) analysis:');
    console.log('📊 Total text lines:', largestDivContent.totalLines);
    console.log('');
    
    console.log('💰 Sample price lines:');
    largestDivContent.priceLines.forEach((line, i) => {
      console.log(`  ${i + 1}. ${line}`);
    });
    console.log('');
    
    console.log('🍕 Potential menu items:');
    largestDivContent.potentialItems.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.name}`);
      console.log(`     Price: ${item.price}`);
      console.log('');
    });
    
    console.log('🔍 HTML structure sample:');
    console.log(largestDivContent.html.substring(0, 500));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugScraper();