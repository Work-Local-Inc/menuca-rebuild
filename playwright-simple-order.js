/**
 * 🍕 SIMPLE PLAYWRIGHT ORDER - JUST LIKE DRUNK PIZZA ORDERING
 * 
 * Keep it simple: Login → Menu → Click Item → Add to Cart → Checkout → Order
 * If drunk people can do it, we can automate it
 */

const { chromium } = require('playwright');

async function simplePlaywrightOrder() {
  let browser;
  let page;

  try {
    console.log('🍕 SIMPLE PLAYWRIGHT ORDER - DRUNK PEOPLE CAN DO THIS');
    console.log('====================================================');
    console.log('🎯 Keep it simple and visual');
    console.log('');

    browser = await chromium.launch({
      headless: false,    
      slowMo: 1500       
    });

    page = await browser.newPage();
    
    // Step 1: Go to the account page (not login page)
    console.log('🌐 Going to account page...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/account');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot to see what we got
    await page.screenshot({ path: 'step1-account-page.png' });
    console.log('📸 Screenshot: step1-account-page.png');
    
    // Look for any login elements on the page
    const emailInputs = await page.$$('input[type="email"], input[name*="email"], input[placeholder*="email"]');
    const passwordInputs = await page.$$('input[type="password"], input[name*="password"]');
    
    console.log(`🔍 Found ${emailInputs.length} email inputs and ${passwordInputs.length} password inputs`);
    
    if (emailInputs.length > 0 && passwordInputs.length > 0) {
      console.log('🔐 Logging in...');
      await emailInputs[0].fill('chris@menu.ca');
      await passwordInputs[0].fill('yvamyvam4');
      
      // Look for submit button
      const submitButtons = await page.$$('button[type="submit"], input[type="submit"], button:has-text("login"), button:has-text("Login")');
      if (submitButtons.length > 0) {
        console.log('▶️ Clicking login button...');
        await submitButtons[0].click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('⚠️ No login form found, checking if already logged in...');
    }
    
    // Step 2: Go to menu
    console.log('📋 Going to menu...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/menu');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'step2-menu-page.png' });
    console.log('📸 Screenshot: step2-menu-page.png');
    
    // Step 3: Find and click a menu item
    console.log('🔍 Looking for menu items...');
    
    // Try multiple selectors for menu items
    let menuItems = await page.$$('a[href*="/dish/create/"]');
    if (menuItems.length === 0) {
      menuItems = await page.$$('.menu-item, [data-dish], [onclick*="dish"]');
    }
    if (menuItems.length === 0) {
      menuItems = await page.$$('img[src*="dish"], .dish, .food-item');
    }
    
    console.log(`🔍 Found ${menuItems.length} potential menu items`);
    
    if (menuItems.length > 0) {
      // Try clicking different menu items until one works
      for (let i = 5; i < Math.min(menuItems.length, 12); i++) { // Skip first 5 (broken)
        console.log(`🖱️ Trying menu item ${i+1}...`);
        
        try {
          await menuItems[i].click();
          await page.waitForTimeout(3000);
          
          // Check if anything appeared (modal, popup, etc.)
          const modals = await page.$$(
            '.modal:visible, [role="dialog"]:visible, .popup:visible, ' +
            '.overlay:visible, [style*="display: block"], [style*="display:block"]'
          );
          
          if (modals.length > 0) {
            console.log('🎯 SUCCESS! Popup/modal appeared!');
            
            await page.screenshot({ path: `step3-popup-item-${i}.png` });
            console.log(`📸 Screenshot: step3-popup-item-${i}.png`);
            
            // Look for add to cart button in the popup
            const addButtons = await page.$$(
              'button:has-text("Add"), button:has-text("Cart"), ' +
              'input[value*="Add"], .add-to-cart, #add-to-cart'
            );
            
            console.log(`🛒 Found ${addButtons.length} add to cart buttons`);
            
            if (addButtons.length > 0) {
              console.log('🛒 Clicking add to cart...');
              await addButtons[0].click();
              await page.waitForTimeout(3000);
              
              await page.screenshot({ path: 'step4-after-add-to-cart.png' });
              console.log('📸 Screenshot: step4-after-add-to-cart.png');
              
              // Check if cart updated by looking for cart indicators
              const cartCount = await page.textContent('.cart-count, #cart-count, [class*="cart-total"]').catch(() => '');
              console.log(`📊 Cart count/total: "${cartCount}"`);
              
              break; // Success! Move on to checkout
            }
          } else {
            console.log(`❌ Item ${i+1} didn't show popup - trying next...`);
          }
          
        } catch (error) {
          console.log(`❌ Item ${i+1} failed: ${error.message}`);
        }
      }
    }
    
    // Step 4: Go to checkout
    console.log('💳 Going to checkout...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/checkout');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'step5-checkout.png' });
    console.log('📸 Screenshot: step5-checkout.png');
    
    // Step 5: Complete the order
    console.log('⏰ Looking for order time selection...');
    
    const timeSelects = await page.$$('select[name="time"], #time, select:has(option[value*=":"])');
    if (timeSelects.length > 0) {
      console.log('⏰ Setting order time...');
      const options = await timeSelects[0].$$('option');
      if (options.length > 1) {
        await options[1].click(); // Select first non-empty option
      }
    }
    
    // Look for cash payment option
    console.log('💰 Setting payment to cash...');
    const cashOptions = await page.$$('input[value="cash"], input[value="1"]');
    if (cashOptions.length > 0) {
      await cashOptions[0].check();
    }
    
    // Look for place order button
    console.log('🚀 Looking for place order button...');
    const placeOrderButtons = await page.$$(
      'button:has-text("Place"), button:has-text("Order"), ' +
      'input[value*="Place"], .place-order, #place-order'
    );
    
    if (placeOrderButtons.length > 0) {
      console.log('🚀 PLACING ORDER...');
      
      await page.screenshot({ path: 'step6-before-place-order.png' });
      
      await placeOrderButtons[0].click();
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'step7-after-place-order.png' });
      console.log('📸 Final screenshot: step7-after-place-order.png');
      
      console.log('🎉 ORDER PLACEMENT ATTEMPTED!');
      console.log('📱 Check your tablet for any prints!');
    }
    
    // Keep browser open for inspection
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
  console.log('🍕 SIMPLE ORDER COMPLETE');
  console.log('========================');
  console.log('📸 Check all the screenshots to see what happened');
  console.log('📱 Check your tablet - did anything print?');
}

simplePlaywrightOrder().catch(console.error);