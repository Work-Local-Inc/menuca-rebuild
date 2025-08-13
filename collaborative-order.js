/**
 * 🤝 COLLABORATIVE ORDER - YOU LOAD, I CHECKOUT
 * 
 * PERFECT PLAN:
 * 1. I open browser window
 * 2. 60 second break for you to load cart  
 * 3. I take over and complete checkout/order
 */

const { chromium } = require('playwright');

async function collaborativeOrder() {
  let browser;
  let page;

  try {
    console.log('🤝 COLLABORATIVE ORDER - YOU LOAD, I CHECKOUT');
    console.log('==============================================');
    console.log('✅ Opening browser for you to load cart');
    console.log('⏸️  60 second break for you to add items');
    console.log('🚀 Then I take over for checkout');
    console.log('');

    browser = await chromium.launch({
      headless: false,
      slowMo: 500
    });

    page = await browser.newPage();
    
    console.log('🌐 Opening login page for you...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/account/login');
    await page.waitForLoadState('networkidle');
    
    console.log('');
    console.log('👋 BROWSER IS READY FOR YOU!');
    console.log('============================');
    console.log('🔐 Please log in as chris@menu.ca');
    console.log('📋 Go to menu and add items to cart');
    console.log('📍 Handle any address popups');
    console.log('🛒 Get cart loaded with items');
    console.log('');
    console.log('⏰ YOU HAVE 60 SECONDS - GO!');
    console.log('');

    // 60 second countdown
    for (let i = 60; i > 0; i--) {
      process.stdout.write(`\r⏳ ${i} seconds remaining...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n');
    console.log('🚀 TIME UP! I\'M TAKING OVER NOW!');
    console.log('=================================');
    
    // Take screenshot to see what you set up
    await page.screenshot({ path: 'handover-state.png' });
    console.log('📸 Screenshot: handover-state.png');
    
    // Step 1: Go to checkout
    console.log('💳 Going to checkout...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/checkout');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'checkout-takeover.png' });
    console.log('📸 Screenshot: checkout-takeover.png');
    
    // Step 2: Handle order time
    console.log('⏰ Setting order time...');
    
    const timeSelect = await page.$('select[name="time"], #time');
    if (timeSelect) {
      const options = await timeSelect.$$('option');
      console.log(`⏰ Found ${options.length} time options`);
      
      if (options.length > 1) {
        await timeSelect.selectOption({ index: 1 }); // Select first real option
        console.log('✅ Order time set');
      }
    }
    
    // Step 3: Set payment to cash
    console.log('💰 Setting cash payment...');
    
    const paymentOptions = await page.$$('input[name="pm"], input[type="radio"]');
    console.log(`💰 Found ${paymentOptions.length} payment options`);
    
    // Try to find and select cash (usually value="1")
    const cashOption = await page.$('input[value="1"]');
    if (cashOption) {
      await cashOption.check();
      console.log('✅ Cash payment selected');
    }
    
    // Step 4: Place the order
    console.log('');
    console.log('🚀 PLACING ORDER NOW!');
    console.log('=====================');
    
    const placeOrderButtons = await page.$$(
      'button:has-text("Place"), button:has-text("Order"), ' +
      'input[value*="Place"], #place_order, .place-order'
    );
    
    console.log(`🚀 Found ${placeOrderButtons.length} place order buttons`);
    
    if (placeOrderButtons.length > 0) {
      await page.screenshot({ path: 'before-final-order.png' });
      console.log('📸 Before order: before-final-order.png');
      
      console.log('🚀 CLICKING PLACE ORDER!');
      await placeOrderButtons[0].click();
      
      // Wait for order processing
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'after-final-order.png' });
      console.log('📸 After order: after-final-order.png');
      
      // Check result
      const finalUrl = page.url();
      const pageContent = await page.textContent('body');
      
      console.log(`📄 Final URL: ${finalUrl}`);
      
      if (pageContent.includes('success') || pageContent.includes('thank') || 
          pageContent.includes('order') || finalUrl.includes('thank') || 
          finalUrl.includes('success')) {
        console.log('🎉🎉🎉 ORDER PLACED SUCCESSFULLY! 🎉🎉🎉');
      } else {
        console.log('⚠️ Order result unclear');
      }
      
    } else {
      console.log('❌ No place order button found');
    }
    
    console.log('');
    console.log('📱 CHECK YOUR TABLET NOW!');
    console.log('=========================');
    console.log('🖨️ Did the order print?');
    
    // Keep browser open for inspection
    console.log('⏸️ Keeping browser open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('🤝 COLLABORATIVE ORDER COMPLETE!');
  console.log('================================');
  console.log('✅ You loaded cart, I completed checkout');
  console.log('📱 This should have printed to your tablet!');
}

collaborativeOrder().catch(console.error);