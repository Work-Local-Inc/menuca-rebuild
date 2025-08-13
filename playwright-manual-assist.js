/**
 * 🤝 PLAYWRIGHT MANUAL ASSIST
 * 
 * COLLABORATION APPROACH:
 * 1. Open browser for user to manually load cart
 * 2. User handles login, menu selection, address, cart loading
 * 3. Once cart is loaded, automation takes over for checkout
 */

const { chromium } = require('playwright');

async function playwrightManualAssist() {
  let browser;
  let context;
  let page;

  try {
    console.log('🤝 PLAYWRIGHT MANUAL ASSIST MODE');
    console.log('================================');
    console.log('🌐 Opening browser for you to manually load the cart');
    console.log('⏸️  Will pause for you to do the manual steps');
    console.log('🤖 Then automation will take over for checkout');
    console.log('');

    // Launch browser with visible UI
    browser = await chromium.launch({
      headless: false, // Show browser so user can interact
      slowMo: 500
    });

    context = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });

    page = await context.newPage();

    // Start at the account/login page
    console.log('🌐 Opening login page for you...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/account');
    await page.waitForLoadState('networkidle');
    
    console.log('');
    console.log('👋 BROWSER IS OPEN FOR YOU!');
    console.log('============================');
    console.log('📋 Please do these steps manually:');
    console.log('   1. Login as chris@menu.ca / yvamyvam4');
    console.log('   2. Go to menu: https://aggregator-landing.menu.ca/index.php/menu');
    console.log('   3. Click an item to add to cart');
    console.log('   4. Handle the address popup (407 tatlock rd carleton place on k7c0v2)');
    console.log('   5. Select pickup');
    console.log('   6. Add items to cart');
    console.log('   7. Get to the checkout page with items in cart');
    console.log('');
    console.log('⏸️  AUTOMATION PAUSED - PRESS ENTER WHEN CART IS LOADED AND READY FOR CHECKOUT');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    console.log('');
    console.log('🤖 RESUMING AUTOMATION FOR CHECKOUT');
    console.log('===================================');
    
    // Check current page state
    const currentURL = page.url();
    console.log(`📄 Current URL: ${currentURL}`);
    
    const pageTitle = await page.title();
    console.log(`📋 Page title: ${pageTitle}`);
    
    // Look for checkout elements
    const checkoutBtn = page.locator('button:has-text("checkout"), a:has-text("checkout"), .checkout-btn, [href*="checkout"]');
    const checkoutCount = await checkoutBtn.count();
    
    if (checkoutCount > 0) {
      console.log(`✅ Found ${checkoutCount} checkout button(s)`);
      
      // Click checkout if not already on checkout page
      if (!currentURL.includes('checkout')) {
        await checkoutBtn.first().click();
        console.log('🔄 Clicked checkout button');
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Handle payment selection
    console.log('');
    console.log('💰 STEP: Choose cash payment');
    console.log('=============================');
    
    await page.waitForTimeout(2000);
    
    const cashOptions = page.locator('input[value="cash"], [data-payment="cash"], label:has-text("cash"), .cash-payment');
    const cashCount = await cashOptions.count();
    
    if (cashCount > 0) {
      console.log(`✅ Found ${cashCount} cash payment option(s)`);
      await cashOptions.first().click();
      console.log('✅ Selected cash payment');
    } else {
      console.log('⚠️ No cash payment option found, looking for alternatives...');
      
      // Try to find any payment method radio buttons or selectors
      const paymentOptions = page.locator('input[type="radio"][name*="payment"], .payment-option, [data-payment]');
      const paymentCount = await paymentOptions.count();
      
      if (paymentCount > 0) {
        console.log(`🔍 Found ${paymentCount} payment options`);
        // Select the first one (likely cash or default)
        await paymentOptions.first().click();
        console.log('✅ Selected first payment option');
      }
    }
    
    // Place the order
    console.log('');
    console.log('🚀 FINAL STEP: Place order');
    console.log('===========================');
    
    await page.waitForTimeout(1000);
    
    const placeOrderBtns = page.locator(
      'button:has-text("place"), button:has-text("order"), .place-order, input[value*="Place"], ' +
      'button[onclick*="place"], button[onclick*="order"], #place_order, .order-submit'
    );
    const orderBtnCount = await placeOrderBtns.count();
    
    if (orderBtnCount > 0) {
      console.log(`✅ Found ${orderBtnCount} place order button(s)`);
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'before-order-placement.png' });
      console.log('📸 Screenshot saved before order placement');
      
      await placeOrderBtns.first().click();
      console.log('🎉 PLACE ORDER BUTTON CLICKED!');
      
      // Wait for order processing
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      const finalURL = page.url();
      const pageContent = await page.textContent('body');
      
      console.log(`📄 Final URL: ${finalURL}`);
      
      if (pageContent.includes('success') || pageContent.includes('thank') || pageContent.includes('order') || finalURL.includes('success') || finalURL.includes('thank')) {
        console.log('🎉🎉🎉 ORDER PLACED SUCCESSFULLY! 🎉🎉🎉');
        console.log('✅ This should print to your tablet!');
      } else {
        console.log('⚠️ Order status unclear from page content');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'after-order-placement.png' });
      console.log('📸 Final screenshot saved');
      
    } else {
      console.log('❌ Could not find place order button');
      console.log('🔍 Available buttons on page:');
      
      const allButtons = await page.locator('button, input[type="submit"], input[type="button"]').all();
      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        const buttonText = await allButtons[i].textContent();
        console.log(`   Button ${i+1}: "${buttonText}"`);
      }
    }
    
    // Keep browser open for inspection
    console.log('');
    console.log('⏸️ KEEPING BROWSER OPEN FOR 30 SECONDS TO INSPECT RESULT');
    console.log('Press Ctrl+C to close early, or wait for auto-close');
    
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('🤝 MANUAL ASSIST COMPLETE!');
  console.log('==========================');
  console.log('📱 Check your tablet for the order!');
  console.log('📸 Check before-order-placement.png and after-order-placement.png');
  console.log('🎯 This collaboration approach should work!');
}

playwrightManualAssist().catch(console.error);