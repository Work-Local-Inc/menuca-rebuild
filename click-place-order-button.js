/**
 * 🚀 CLICK THE RED PLACE ORDER BUTTON
 * 
 * I can see it in the screenshot! Big red button that says "Place order"
 * Let me click it properly
 */

const { chromium } = require('playwright');

async function clickPlaceOrderButton() {
  let browser;
  let page;

  try {
    console.log('🚀 CLICKING THE RED PLACE ORDER BUTTON');
    console.log('=====================================');
    console.log('👀 I can see it in the screenshot!');
    console.log('');

    browser = await chromium.launch({
      headless: false,
      slowMo: 1000
    });

    page = await browser.newPage();
    
    // Go back to checkout page
    console.log('💳 Going to checkout page...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/checkout');
    await page.waitForLoadState('networkidle');
    
    // Look for the red "Place order" button with different selectors
    console.log('🔍 Looking for the red Place order button...');
    
    const placeOrderSelectors = [
      'button:has-text("Place order")',
      '[style*="background-color: red"]:has-text("Place order")',
      '.btn-danger:has-text("Place")',
      'button[style*="red"]:has-text("order")',
      'input[value="Place order"]',
      '.red-button, .place-order-btn',
      '[class*="red"]:has-text("Place")'
    ];
    
    let foundButton = false;
    
    for (const selector of placeOrderSelectors) {
      const button = await page.$(selector);
      if (button) {
        console.log(`✅ Found button with selector: ${selector}`);
        
        await page.screenshot({ path: 'before-click-place-order.png' });
        console.log('📸 Screenshot before click');
        
        console.log('🚀 CLICKING PLACE ORDER BUTTON!');
        await button.click();
        
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'after-click-place-order.png' });
        console.log('📸 Screenshot after click');
        
        const finalUrl = page.url();
        const pageContent = await page.textContent('body');
        
        console.log(`📄 Final URL: ${finalUrl}`);
        
        if (pageContent.includes('success') || pageContent.includes('thank') || 
            finalUrl.includes('thank') || finalUrl.includes('success')) {
          console.log('🎉🎉🎉 ORDER PLACED! 🎉🎉🎉');
        }
        
        foundButton = true;
        break;
      }
    }
    
    if (!foundButton) {
      console.log('❌ Could not find Place order button with any selector');
      
      // Take screenshot to see what's there
      await page.screenshot({ path: 'checkout-debug.png' });
      console.log('📸 Debug screenshot: checkout-debug.png');
      
      // Try to find ANY buttons
      const allButtons = await page.$$('button, input[type="submit"], [role="button"]');
      console.log(`🔍 Found ${allButtons.length} total buttons/inputs`);
      
      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        const text = await allButtons[i].textContent();
        const value = await allButtons[i].getAttribute('value');
        console.log(`   Button ${i+1}: text="${text}" value="${value}"`);
      }
    }
    
    console.log('⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('🚀 PLACE ORDER ATTEMPT COMPLETE');
  console.log('===============================');
  console.log('📱 CHECK YOUR TABLET FOR PRINTS!');
}

clickPlaceOrderButton().catch(console.error);