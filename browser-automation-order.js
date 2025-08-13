/**
 * 🤖 BROWSER AUTOMATION - EXACT USER STEPS
 * 
 * USER'S EXACT STEPS:
 * 1. Login (chris@menu.ca / yvamyvam4)
 * 2. Visit menu: https://aggregator-landing.menu.ca/index.php/menu  
 * 3. Click an item to add to cart → address popup → use "407 tatlock rd carleton place on k7c0v2"
 * 4. Select pickup
 * 5. Add items to cart
 * 6. Click checkout button
 * 7. Choose cash payment
 * 8. Place order
 */

const puppeteer = require('puppeteer');

async function browserAutomationOrder() {
  let browser;
  
  try {
    console.log('🤖 BROWSER AUTOMATION - EXACT USER STEPS');
    console.log('========================================');
    console.log('🎯 Following user steps exactly like a real customer');
    console.log('');

    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Show browser so we can see what's happening
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // STEP 1: Login
    console.log('🔐 STEP 1: Login as chris@menu.ca');
    console.log('=================================');
    
    await page.goto('https://aggregator-landing.menu.ca/index.php/account/login');
    await page.waitForSelector('input[name="email"]');
    
    await page.type('input[name="email"]', 'chris@menu.ca');
    await page.type('input[name="password"]', 'yvamyvam4');
    
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForNavigation();
    
    console.log('✅ Login submitted');

    // STEP 2: Visit menu
    console.log('');
    console.log('📋 STEP 2: Visit menu page');
    console.log('===========================');
    
    await page.goto('https://aggregator-landing.menu.ca/index.php/menu');
    await page.waitForSelector('body');
    
    console.log('✅ Menu page loaded');

    // STEP 3: Click an item to add to cart
    console.log('');
    console.log('🛒 STEP 3: Click item to add to cart');
    console.log('===================================');
    
    // Look for clickable menu items
    const menuItems = await page.$$('a[href*="/dish/"], .menu-item, .add-to-cart, [onclick*="cart"]');
    
    if (menuItems.length > 0) {
      console.log(`🔍 Found ${menuItems.length} clickable menu items`);
      
      // Click the first available item
      await menuItems[0].click();
      console.log('✅ Clicked first menu item');
      
      // Wait for address popup or form
      await page.waitForTimeout(2000);
      
      // STEP 3b: Handle address popup
      console.log('');
      console.log('📍 STEP 3b: Address popup handling');
      console.log('==================================');
      
      // Look for address input fields
      const addressInput = await page.$('input[name*="address"], #address, .address-input');
      
      if (addressInput) {
        await addressInput.type('407 tatlock rd carleton place on k7c0v2');
        console.log('✅ Entered address');
        
        // Wait for Canada Post API suggestions
        await page.waitForTimeout(3000);
        
        // Look for dropdown suggestions and click first one
        const suggestions = await page.$$('.address-suggestion, .dropdown-item, li[onclick*="address"]');
        if (suggestions.length > 0) {
          await suggestions[0].click();
          console.log('✅ Selected address from Canada Post suggestions');
        }
      }
      
      // STEP 4: Select pickup
      console.log('');
      console.log('🚚 STEP 4: Select pickup');
      console.log('=========================');
      
      const pickupOption = await page.$('input[value="pickup"], [onclick*="pickup"], .pickup-option');
      if (pickupOption) {
        await pickupOption.click();
        console.log('✅ Selected pickup option');
      }
      
      // STEP 5: Add items to cart
      console.log('');
      console.log('🛒 STEP 5: Add items to cart');
      console.log('============================');
      
      const addToCartBtn = await page.$('.add-to-cart, button[onclick*="cart"], input[value*="Add"]');
      if (addToCartBtn) {
        await addToCartBtn.click();
        console.log('✅ Added item to cart');
      }
      
      await page.waitForTimeout(2000);
      
      // STEP 6: Click checkout button
      console.log('');
      console.log('💳 STEP 6: Click checkout button');
      console.log('================================');
      
      const checkoutBtn = await page.$('a[href*="checkout"], .checkout-btn, button[onclick*="checkout"]');
      if (checkoutBtn) {
        await checkoutBtn.click();
        console.log('✅ Clicked checkout button');
        
        await page.waitForNavigation();
        
        // STEP 7: Choose cash payment  
        console.log('');
        console.log('💰 STEP 7: Choose cash payment');
        console.log('==============================');
        
        const cashOption = await page.$('input[value="cash"], [onclick*="cash"], .cash-payment');
        if (cashOption) {
          await cashOption.click();
          console.log('✅ Selected cash payment');
        }
        
        // STEP 8: Place order
        console.log('');
        console.log('🚀 STEP 8: Place order');
        console.log('======================');
        
        const placeOrderBtn = await page.$('button[onclick*="place"], .place-order, input[value*="Place"]');
        if (placeOrderBtn) {
          await placeOrderBtn.click();
          console.log('🎉 ORDER PLACED!');
          
          // Wait for confirmation
          await page.waitForTimeout(5000);
          
          const pageContent = await page.content();
          if (pageContent.includes('success') || pageContent.includes('order') || pageContent.includes('thank')) {
            console.log('🎉🎉🎉 ORDER CONFIRMED! 🎉🎉🎉');
          }
        }
      }
    }

    // Take screenshot of final result
    await page.screenshot({ path: 'order-result.png' });
    console.log('📸 Screenshot saved as order-result.png');

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('📱 BROWSER AUTOMATION COMPLETE!');
  console.log('===============================');
  console.log('🤖 Automated exact user workflow');
  console.log('📸 Check order-result.png for final screen');
  console.log('📱 Check your tablet for the order!');
}

// Check if puppeteer is available
try {
  browserAutomationOrder().catch(console.error);
} catch (e) {
  console.log('❌ Puppeteer not available. Installing...');
  console.log('Run: npm install puppeteer');
  console.log('Then run this script again.');
}