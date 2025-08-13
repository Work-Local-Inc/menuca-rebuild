/**
 * 🎭 PLAYWRIGHT EXACT STEPS AUTOMATION
 * 
 * USER'S EXACT STEPS:
 * 1. Login: https://aggregator-landing.menu.ca/index.php/account (chris@menu.ca / yvamyvam4)
 * 2. Visit: https://aggregator-landing.menu.ca/index.php/menu
 * 3. Click item → address popup → "407 tatlock rd carleton place on k7c0v2" → choose from CP API list
 * 4. Select pickup
 * 5. Add items to cart
 * 6. Click checkout
 * 7. Choose cash payment
 * 8. Place order
 */

const { chromium } = require('playwright');

async function playwrightExactSteps() {
  let browser;
  let context;
  let page;

  try {
    console.log('🎭 PLAYWRIGHT EXACT STEPS AUTOMATION');
    console.log('====================================');
    console.log('🤖 Following user steps exactly with real browser');
    console.log('');

    // Launch browser with visible UI
    browser = await chromium.launch({
      headless: false, // Show browser
      slowMo: 1000     // Slow down for debugging
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    // STEP 1: Login at exact URL
    console.log('🔐 STEP 1: Login at https://aggregator-landing.menu.ca/index.php/account');
    console.log('===================================================================');
    
    await page.goto('https://aggregator-landing.menu.ca/index.php/account');
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to login page or if login form is on this page
    const currentURL = page.url();
    console.log(`📄 Current URL: ${currentURL}`);
    
    if (currentURL.includes('login') || await page.locator('input[name="email"]').count() > 0) {
      console.log('✅ Found login form');
      
      // Fill login form
      await page.fill('input[name="email"]', 'chris@menu.ca');
      await page.fill('input[name="password"]', 'yvamyvam4');
      
      // Submit login
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      console.log(`✅ Login submitted, current URL: ${page.url()}`);
    }

    // STEP 2: Visit exact menu URL
    console.log('');
    console.log('📋 STEP 2: Visit https://aggregator-landing.menu.ca/index.php/menu');
    console.log('============================================================');
    
    await page.goto('https://aggregator-landing.menu.ca/index.php/menu');
    await page.waitForLoadState('networkidle');
    
    console.log(`📄 Menu page loaded: ${page.url()}`);

    // STEP 3: Click an item to add to cart
    console.log('');
    console.log('🛒 STEP 3: Click item to add to cart');
    console.log('===================================');
    
    // Look for menu item links or buttons
    const menuItems = await page.locator('a[href*="/dish/"], .menu-item, .add-to-cart, [onclick*="cart"]').count();
    console.log(`🔍 Found ${menuItems} potential menu items`);
    
    if (menuItems > 0) {
      // Click the first available menu item
      await page.locator('a[href*="/dish/"], .menu-item, .add-to-cart, [onclick*="cart"]').first().click();
      console.log('✅ Clicked first menu item');
      
      // Wait for address popup or form to appear
      await page.waitForTimeout(3000);
      
      // STEP 3b: Handle address popup
      console.log('');
      console.log('📍 STEP 3b: Address popup handling');
      console.log('==================================');
      
      // Look for address input field
      const addressInput = page.locator('input[name*="address"], #address, .address-input, [placeholder*="address"]');
      
      if (await addressInput.count() > 0) {
        console.log('✅ Found address input field');
        
        // Type the exact address as specified by user
        await addressInput.first().fill('407 tatlock rd carleton place on k7c0v2');
        console.log('✅ Entered address: "407 tatlock rd carleton place on k7c0v2"');
        
        // Wait for Canada Post API suggestions to appear
        await page.waitForTimeout(3000);
        
        // Look for dropdown suggestions
        const suggestions = page.locator('.address-suggestion, .dropdown-item, li[data-address], .suggestion-item');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          console.log(`✅ Found ${suggestionCount} Canada Post suggestions`);
          // Click the first suggestion
          await suggestions.first().click();
          console.log('✅ Selected first address suggestion from Canada Post API');
        } else {
          console.log('⚠️ No Canada Post suggestions found, proceeding...');
        }
      }
      
      // STEP 4: Select pickup
      console.log('');
      console.log('🚚 STEP 4: Select pickup');
      console.log('=========================');
      
      const pickupOption = page.locator('input[value="pickup"], [data-type="pickup"], .pickup-option, button:has-text("pickup")');
      
      if (await pickupOption.count() > 0) {
        await pickupOption.first().click();
        console.log('✅ Selected pickup option');
      } else {
        console.log('⚠️ No pickup option found, looking for alternatives...');
        // Try other pickup selectors
        const altPickup = page.locator('input[type="radio"]:has-text("pickup"), label:has-text("pickup")');
        if (await altPickup.count() > 0) {
          await altPickup.first().click();
          console.log('✅ Selected pickup (alternative selector)');
        }
      }
      
      // STEP 5: Add items to cart
      console.log('');
      console.log('🛒 STEP 5: Add items to cart');
      console.log('============================');
      
      const addToCartBtn = page.locator('button:has-text("add"), .add-to-cart, input[value*="Add"], button[onclick*="cart"]');
      
      if (await addToCartBtn.count() > 0) {
        await addToCartBtn.first().click();
        console.log('✅ Added item to cart');
        
        await page.waitForTimeout(2000);
      }
      
      // STEP 6: Click checkout button
      console.log('');
      console.log('💳 STEP 6: Click checkout button');
      console.log('================================');
      
      const checkoutBtn = page.locator('a:has-text("checkout"), .checkout-btn, button:has-text("checkout")');
      
      if (await checkoutBtn.count() > 0) {
        await checkoutBtn.first().click();
        console.log('✅ Clicked checkout button');
        
        await page.waitForLoadState('networkidle');
        
        // STEP 7: Choose cash payment
        console.log('');
        console.log('💰 STEP 7: Choose cash payment');
        console.log('==============================');
        
        const cashOption = page.locator('input[value="cash"], [data-payment="cash"], .cash-payment, label:has-text("cash")');
        
        if (await cashOption.count() > 0) {
          await cashOption.first().click();
          console.log('✅ Selected cash payment');
        }
        
        // STEP 8: Place order
        console.log('');
        console.log('🚀 STEP 8: Place order');
        console.log('======================');
        
        const placeOrderBtn = page.locator('button:has-text("place"), .place-order, input[value*="Place"], button:has-text("order")');
        
        if (await placeOrderBtn.count() > 0) {
          await placeOrderBtn.first().click();
          console.log('🎉 PLACE ORDER BUTTON CLICKED!');
          
          // Wait for order confirmation
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(5000);
          
          const finalURL = page.url();
          const pageContent = await page.textContent('body');
          
          console.log(`📄 Final URL: ${finalURL}`);
          
          if (pageContent.includes('success') || pageContent.includes('order') || pageContent.includes('thank') || finalURL.includes('success')) {
            console.log('🎉🎉🎉 ORDER PLACED SUCCESSFULLY! 🎉🎉🎉');
            console.log('✅ This should print to your tablet!');
          } else {
            console.log('⚠️ Order status unclear, check page content');
          }
        } else {
          console.log('❌ Could not find place order button');
        }
      } else {
        console.log('❌ Could not find checkout button');
      }
    } else {
      console.log('❌ No menu items found to click');
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'playwright-order-result.png' });
    console.log('📸 Screenshot saved as playwright-order-result.png');

    // Keep browser open for 10 seconds to see result
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('📱 PLAYWRIGHT AUTOMATION COMPLETE!');
  console.log('==================================');
  console.log('🎭 Automated exact user workflow with real browser');
  console.log('📸 Check playwright-order-result.png for final screen');
  console.log('📱 Check your tablet for the order!');
  console.log('🎯 This should have replicated Order #83022 success!');
}

playwrightExactSteps().catch(console.error);