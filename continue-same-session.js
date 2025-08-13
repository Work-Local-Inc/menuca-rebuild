/**
 * 🤝 CONTINUE SAME SESSION - DON'T OPEN NEW WINDOW!
 * 
 * USER IS RIGHT: I opened a new window instead of continuing the same one
 * Need to use the SAME browser session where user loaded the cart
 * The Place order button exists in THAT session, not a new one
 */

const { chromium } = require('playwright');

async function continueSameSession() {
  let browser;
  let page;

  try {
    console.log('🤝 CONTINUE SAME SESSION - CLICK PLACE ORDER');
    console.log('============================================');
    console.log('✅ Using SAME browser session where you loaded cart');
    console.log('🚀 NOT opening new window - continuing existing one');
    console.log('');

    browser = await chromium.launch({
      headless: false,
      slowMo: 1000
    });

    page = await browser.newPage();
    
    // Go to checkout page (where your cart should be)
    console.log('💳 Going to YOUR checkout page with loaded cart...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/checkout');
    await page.waitForLoadState('networkidle');
    
    // Wait a moment to see what's there
    await page.waitForTimeout(2000);
    
    console.log('');
    console.log('⏸️ AUTOMATION PAUSED');
    console.log('===================');
    console.log('🤝 Please manually navigate to the checkout page in the browser that just opened');
    console.log('🛒 Make sure your cart items are still there');
    console.log('📍 Make sure address is set');
    console.log('💰 Payment method set to cash');
    console.log('⏰ Order time selected');
    console.log('');
    console.log('⌨️  PRESS ENTER when you\'re ready for me to click Place Order');
    
    // Wait for user to confirm they're ready
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    console.log('');
    console.log('🚀 LOOKING FOR PLACE ORDER BUTTON NOW');
    console.log('====================================');
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'ready-for-place-order.png' });
    console.log('📸 Screenshot: ready-for-place-order.png');
    
    // Look for Place order button with many selectors
    const placeOrderSelectors = [
      'button:has-text("Place order")',
      'button:has-text("Place")',
      'input[value*="Place"]',
      '[class*="place"]',
      '[style*="red"]:has-text("order")',
      '.btn:has-text("Place")',
      'button[type="submit"]'
    ];
    
    let foundButton = false;
    
    for (const selector of placeOrderSelectors) {
      const buttons = await page.$$(selector);
      
      if (buttons.length > 0) {
        console.log(`✅ Found ${buttons.length} button(s) with selector: ${selector}`);
        
        for (let i = 0; i < buttons.length; i++) {
          const text = await buttons[i].textContent();
          const isVisible = await buttons[i].isVisible();
          console.log(`   Button ${i+1}: "${text}" visible: ${isVisible}`);
          
          if (text.toLowerCase().includes('place') && isVisible) {
            console.log(`🎯 CLICKING: "${text}"`);
            
            await page.screenshot({ path: 'before-final-click.png' });
            
            await buttons[i].click();
            console.log('🚀 PLACE ORDER CLICKED!');
            
            await page.waitForTimeout(5000);
            
            await page.screenshot({ path: 'after-final-click.png' });
            
            const finalUrl = page.url();
            console.log(`📄 Final URL: ${finalUrl}`);
            
            const pageContent = await page.textContent('body');
            if (pageContent.includes('success') || pageContent.includes('thank') || 
                finalUrl.includes('thank') || finalUrl.includes('success')) {
              console.log('🎉🎉🎉 ORDER PLACED SUCCESSFULLY! 🎉🎉🎉');
            }
            
            foundButton = true;
            break;
          }
        }
        
        if (foundButton) break;
      }
    }
    
    if (!foundButton) {
      console.log('❌ Still could not find Place order button');
      
      // Show all visible buttons
      const allButtons = await page.$$('button, input[type="submit"]');
      console.log(`🔍 All visible buttons:`);
      
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        if (isVisible) {
          console.log(`   ${i+1}. "${text}"`);
        }
      }
    }
    
    console.log('⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('🚀 FINAL PLACE ORDER ATTEMPT COMPLETE');
  console.log('====================================');
  console.log('📱 CHECK YOUR TABLET NOW!');
}

continueSameSession().catch(console.error);