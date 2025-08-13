/**
 * 🎯 ONE SESSION COMPLETE ORDER
 * 
 * FIXED APPROACH: One browser session, no closing
 * 1. I open browser
 * 2. You load cart (I wait)
 * 3. I click Place Order (same session)
 * 4. Never close browser between steps!
 */

const { chromium } = require('playwright');

async function oneSessionCompleteOrder() {
  let browser;
  let page;

  try {
    console.log('🎯 ONE SESSION COMPLETE ORDER');
    console.log('=============================');
    console.log('✅ Single browser session - no closing between steps');
    console.log('');

    browser = await chromium.launch({
      headless: false,
      slowMo: 1000
    });

    page = await browser.newPage();
    
    console.log('🌐 Opening login page...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/account/login');
    await page.waitForLoadState('networkidle');
    
    console.log('');
    console.log('👋 BROWSER READY - LOAD YOUR CART');
    console.log('=================================');
    console.log('🔐 1. Log in as chris@menu.ca');
    console.log('📋 2. Go to menu');
    console.log('📍 3. Handle address popup');
    console.log('🛒 4. Add items to cart');
    console.log('💳 5. Go to checkout');
    console.log('⏰ 6. Set order time');
    console.log('💰 7. Set payment to cash');
    console.log('');
    console.log('⌨️  PRESS ENTER when everything is ready for Place Order');
    
    // Wait for user to set everything up
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    console.log('');
    console.log('🚀 TAKING OVER - PLACING ORDER');
    console.log('==============================');
    
    // Take screenshot to see final state
    await page.screenshot({ path: 'final-ready-state.png' });
    console.log('📸 Screenshot: final-ready-state.png');
    
    // Look for the Place order button
    console.log('🔍 Searching for Place order button...');
    
    // Try multiple approaches to find the button
    const buttonApproaches = [
      // Text-based
      { method: 'Text "Place order"', selector: 'button:has-text("Place order")' },
      { method: 'Text "Place"', selector: 'button:has-text("Place")' },
      { method: 'Input value Place', selector: 'input[value*="Place"]' },
      
      // Style-based (red button)
      { method: 'Red background', selector: '[style*="background"][style*="red"]' },
      { method: 'Red class', selector: '[class*="red"], .btn-danger' },
      
      // Generic
      { method: 'Submit button', selector: 'button[type="submit"]' },
      { method: 'Any order button', selector: 'button:has-text("order")' }
    ];
    
    let success = false;
    
    for (const approach of buttonApproaches) {
      console.log(`🧪 Trying: ${approach.method}`);
      
      const elements = await page.$$(approach.selector);
      console.log(`   Found ${elements.length} elements`);
      
      for (let i = 0; i < elements.length; i++) {
        try {
          const text = await elements[i].textContent();
          const isVisible = await elements[i].isVisible();
          console.log(`   Element ${i+1}: "${text.trim()}" visible: ${isVisible}`);
          
          if (isVisible && (text.toLowerCase().includes('place') || text.toLowerCase().includes('order'))) {
            console.log(`🎯 CLICKING: "${text.trim()}"`);
            
            await elements[i].click();
            console.log('🚀 CLICKED!');
            
            // Wait for response
            await page.waitForTimeout(5000);
            
            await page.screenshot({ path: 'after-click-result.png' });
            console.log('📸 After click: after-click-result.png');
            
            const finalUrl = page.url();
            const pageText = await page.textContent('body');
            
            console.log(`📄 Final URL: ${finalUrl}`);
            
            if (pageText.includes('success') || pageText.includes('thank') || 
                finalUrl.includes('thank') || finalUrl.includes('success')) {
              console.log('🎉🎉🎉 ORDER SUCCESS! 🎉🎉🎉');
              success = true;
            } else {
              console.log('⚠️ Click completed - check result');
            }
            
            break;
          }
        } catch (e) {
          console.log(`   Element ${i+1}: Error - ${e.message}`);
        }
      }
      
      if (success) break;
      
      await page.waitForTimeout(1000);
    }
    
    if (!success) {
      console.log('❌ Could not find/click Place order button');
      console.log('🔍 Manual inspection needed');
    }
    
    console.log('');
    console.log('📱 CHECK YOUR TABLET!');
    console.log('====================');
    console.log('🖨️ Did anything print?');
    
    // Keep browser open for final inspection
    console.log('⏸️ Keeping browser open for 60 seconds...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('🎯 ONE SESSION ORDER COMPLETE');
  console.log('=============================');
  console.log('✅ Same browser session throughout');
  console.log('📱 Results should be on your tablet!');
}

oneSessionCompleteOrder().catch(console.error);