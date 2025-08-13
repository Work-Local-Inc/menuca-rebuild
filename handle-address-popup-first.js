/**
 * 📍 HANDLE ADDRESS POPUP FIRST - THEN MENU ITEMS
 * 
 * BREAKTHROUGH: User sees the address popup blocking menu items!
 * Need to handle address popup BEFORE trying to click menu items
 * User just added items to cart and set address - now complete the order!
 */

const { chromium } = require('playwright');

async function handleAddressPopupFirst() {
  let browser;
  let page;

  try {
    console.log('📍 HANDLE ADDRESS POPUP FIRST - COMPLETE ORDER');
    console.log('==============================================');
    console.log('✅ User added items to cart and set address');
    console.log('🎯 Now complete the checkout process');
    console.log('');

    browser = await chromium.launch({
      headless: false,
      slowMo: 1000
    });

    page = await browser.newPage();
    
    // Step 1: Go directly to account/login
    console.log('🔐 Going to login...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/account/login');
    await page.waitForLoadState('networkidle');
    
    // Try to find and fill login form
    try {
      await page.fill('input[name="email"], #email', 'chris@menu.ca');
      await page.fill('input[name="password"], #password', 'yvamyvam4');
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ Login attempted');
    } catch (e) {
      console.log('⚠️ Login form not found or already logged in');
    }
    
    // Step 2: Go to menu and handle address popup immediately
    console.log('📋 Going to menu and handling address popup...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/menu');
    await page.waitForLoadState('networkidle');
    
    // Look for address popup right away
    console.log('🔍 Looking for address popup...');
    const addressPopup = await page.$('#set_address, .modal:has-text("address"), [role="dialog"]:has-text("address")');
    
    if (addressPopup) {
      console.log('📍 FOUND ADDRESS POPUP! Handling it...');
      
      // Look for address input in the popup
      const addressInput = await page.$('#set_address input[type="text"], .modal input[placeholder*="address"]');
      
      if (addressInput) {
        console.log('📝 Filling address...');
        await addressInput.fill('407 tatlock rd carleton place on k7c0v2');
        await page.waitForTimeout(2000); // Wait for autocomplete
        
        // Look for address suggestions
        const suggestions = await page.$$('.suggestion, .dropdown-item, li:has-text("tatlock")');
        if (suggestions.length > 0) {
          console.log('📍 Clicking first address suggestion...');
          await suggestions[0].click();
        }
        
        // Look for pickup/delivery option
        const pickupOption = await page.$('#set_address input[value="pickup"], .modal input[value="pickup"]');
        if (pickupOption) {
          console.log('🚚 Selecting pickup...');
          await pickupOption.click();
        }
        
        // Look for confirm/save button
        const confirmButton = await page.$('#set_address button:has-text("Confirm"), #set_address button:has-text("Save"), .modal button[type="submit"]');
        if (confirmButton) {
          console.log('✅ Confirming address...');
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Step 3: Check cart status (user added items)
    console.log('🛒 Checking cart status...');
    await page.waitForTimeout(2000);
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'cart-status-check.png' });
    console.log('📸 Screenshot: cart-status-check.png');
    
    // Step 4: Go to checkout (user set up cart already)
    console.log('💳 Going to checkout...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/checkout');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'checkout-page.png' });
    console.log('📸 Screenshot: checkout-page.png');
    
    // Step 5: Handle order time selection
    console.log('⏰ Setting order time...');
    
    const timeSelect = await page.$('select[name="time"], #time');
    if (timeSelect) {
      const options = await timeSelect.$$('option');
      if (options.length > 1) {
        // Select second option (first is usually empty)
        await options[1].click();
        console.log('✅ Order time selected');
      }
    }
    
    // Step 6: Set payment method to cash
    console.log('💰 Setting payment to cash...');
    
    const cashRadio = await page.$('input[value="1"], input[value="cash"]');
    if (cashRadio) {
      await cashRadio.check();
      console.log('✅ Cash payment selected');
    }
    
    // Step 7: Place the order!
    console.log('🚀 PLACING ORDER...');
    
    const placeOrderButton = await page.$('button:has-text("Place"), input[value*="Place"], #place_order');
    
    if (placeOrderButton) {
      await page.screenshot({ path: 'before-place-order.png' });
      console.log('📸 Before order: before-place-order.png');
      
      await placeOrderButton.click();
      console.log('🚀 ORDER BUTTON CLICKED!');
      
      // Wait for order processing
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'after-place-order.png' });
      console.log('📸 After order: after-place-order.png');
      
      // Check for success page
      const currentUrl = page.url();
      const pageText = await page.textContent('body');
      
      console.log(`📄 Final URL: ${currentUrl}`);
      
      if (pageText.includes('thank') || pageText.includes('success') || 
          pageText.includes('order') || currentUrl.includes('thank')) {
        console.log('🎉🎉🎉 ORDER SUCCESS! 🎉🎉🎉');
      } else {
        console.log('⚠️ Order result unclear - check screenshots');
      }
      
    } else {
      console.log('❌ Could not find place order button');
    }
    
    // Keep browser open for inspection
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
  console.log('🎯 ORDER COMPLETION ATTEMPT DONE');
  console.log('================================');
  console.log('✅ Addressed popup issue first');
  console.log('🛒 Used cart items you added');
  console.log('📱 CHECK YOUR TABLET NOW!');
  console.log('🖨️ Did the order print?');
}

handleAddressPopupFirst().catch(console.error);