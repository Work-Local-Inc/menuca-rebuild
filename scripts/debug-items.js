/**
 * Debug individual menu items to understand their exact structure
 */

const puppeteer = require('puppeteer');

async function debugItems() {
  console.log('🔍 Starting item-level debug...');
  
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
    
    // Focus on the Pizza category (f_6715) and examine individual forms
    const pizzaForms = await page.evaluate(() => {
      const pizzaDiv = document.getElementById('f_6715');
      if (!pizzaDiv) return [];
      
      const forms = pizzaDiv.querySelectorAll('form[id^="form_"]');
      const formData = [];
      
      // Look at first 5 forms in detail
      for (let i = 0; i < Math.min(5, forms.length); i++) {
        const form = forms[i];
        const formId = form.id;
        
        // Get all text content and HTML structure
        const html = form.innerHTML.substring(0, 1000);
        const textContent = form.textContent;
        const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
        
        // Look for item names in the form's parent or siblings
        const parent = form.parentElement;
        const siblings = parent ? Array.from(parent.children) : [];
        
        const itemNameCandidates = [];
        const prices = [];
        
        // Check form itself for item names
        const formElements = form.querySelectorAll('div, span, strong, b, p, label');
        formElements.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 2 && !text.includes('$') && !text.match(/^(Small|Medium|Large|X-Large)$/i)) {
            itemNameCandidates.push({
              text: text,
              element: el.tagName,
              source: 'form'
            });
          }
        });
        
        // Check parent and siblings for item names
        siblings.forEach(sibling => {
          if (sibling !== form && sibling.tagName !== 'SCRIPT') {
            const siblingElements = sibling.querySelectorAll('div, span, strong, b, p, h1, h2, h3, h4');
            siblingElements.forEach(el => {
              const text = el.textContent.trim();
              if (text && text.length > 2 && !text.includes('$') && !text.match(/^(Small|Medium|Large|X-Large)$/i)) {
                itemNameCandidates.push({
                  text: text,
                  element: el.tagName,
                  source: 'sibling'
                });
              }
            });
          }
        });
        
        // Extract prices
        lines.forEach(line => {
          const priceMatch = line.match(/\$\s*(\d+\.\d{2})/);
          if (priceMatch) {
            prices.push(priceMatch[1]);
          }
        });
        
        formData.push({
          formId,
          itemNameCandidates: itemNameCandidates.slice(0, 10), // Top 10 candidates
          prices,
          firstFewLines: lines.slice(0, 10),
          htmlSnippet: html.substring(0, 300)
        });
      }
      
      return formData;
    });
    
    console.log('🍕 Pizza form analysis:');
    pizzaForms.forEach((formData, index) => {
      console.log(`\n=== FORM ${index + 1}: ${formData.formId} ===`);
      console.log('💰 Prices:', formData.prices);
      console.log('📝 Item name candidates:');
      formData.itemNameCandidates.forEach((candidate, i) => {
        console.log(`  ${i + 1}. [${candidate.source}/${candidate.element}] "${candidate.text}"`);
      });
      console.log('📄 First few lines:');
      formData.firstFewLines.forEach((line, i) => {
        console.log(`  ${i + 1}. "${line}"`);
      });
      console.log('🔍 HTML snippet:');
      console.log(`  ${formData.htmlSnippet}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugItems();