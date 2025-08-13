/**
 * 👀 PLAYWRIGHT VISUAL DEBUG - SEE WHAT'S HAPPENING
 * 
 * USER IS RIGHT: Use frontend tool to SEE the issues
 * Stop blind API calls - actually watch what happens on screen
 * Drunk/stoned people order pizza successfully - this isn't rocket science
 */

const { chromium } = require('playwright');

async function playwrightVisualDebug() {
  let browser;
  let page;

  try {
    console.log('👀 PLAYWRIGHT VISUAL DEBUG MODE');
    console.log('===============================');
    console.log('🎯 Actually watch what happens on screen');
    console.log('🍕 If drunk people can order pizza, we can figure this out');
    console.log('');

    // Launch browser with slowMo so we can see what's happening
    browser = await chromium.launch({
      headless: false,    // Show the browser
      slowMo: 2000       // 2 second delay between actions
    });

    page = await browser.newPage();
    
    console.log('🌐 Step 1: Going to login page...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/account/login');
    
    console.log('🔐 Step 2: Filling in login credentials...');
    await page.fill('input[name="email"]', 'chris@menu.ca');
    await page.fill('input[name="password"]', 'yvamyvam4');
    
    console.log('▶️ Step 3: Clicking login...');
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('📋 Step 4: Going to menu page...');
    await page.goto('https://aggregator-landing.menu.ca/index.php/menu');
    await page.waitForLoadState('networkidle');
    
    console.log('👀 CURRENT PAGE ANALYSIS:');
    console.log('=========================');
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Current URL: ${url}`);
    
    // Look for menu items visually
    const menuItems = await page.$$('[href*="/dish/"], .menu-item, [onclick*="dish"]');
    console.log(`🔍 Found ${menuItems.length} clickable menu items`);
    
    if (menuItems.length > 0) {
      console.log('🖱️ Step 5: Clicking first menu item to see what happens...');
      
      try {
        // Click the first menu item and see what happens
        await menuItems[0].click();
        console.log('✅ Clicked menu item');
        
        // Wait a bit and see what appeared
        await page.waitForTimeout(3000);
        
        // Check if a modal/popup appeared
        const modals = await page.$$('.modal, [role="dialog"], .popup');
        const overlays = await page.$$('.overlay, .backdrop');
        
        console.log(`👀 After click analysis:`);
        console.log(`   - Found ${modals.length} modals/popups`);
        console.log(`   - Found ${overlays.length} overlays`);
        
        if (modals.length > 0) {
          console.log('🎯 POPUP DETECTED! Let\'s see what\'s in it...');
          
          // Look for form elements in the popup
          const formInputs = await page.$$('.modal input, [role="dialog"] input');
          const formButtons = await page.$$('.modal button, [role="dialog"] button');
          const quantitySelects = await page.$$('.modal select, [role="dialog"] select');
          
          console.log(`   📋 Popup contains:`);
          console.log(`      - ${formInputs.length} input fields`);
          console.log(`      - ${formButtons.length} buttons`);
          console.log(`      - ${quantitySelects.length} dropdowns`);
          
          // If there's a quantity selector, use it
          if (quantitySelects.length > 0) {
            console.log('📊 Setting quantity to 1...');
            await quantitySelects[0].selectOption('1');
          }
          
          // Look for "Add to Cart" type button
          const addButtons = await page.$$('button:has-text("Add"), button:has-text("cart"), input[value*="Add"]');
          
          if (addButtons.length > 0) {
            console.log('🛒 Found Add to Cart button - clicking it...');
            await addButtons[0].click();
            await page.waitForTimeout(2000);
            
            // Check if cart updated
            console.log('📊 Checking if cart updated...');
            const cartElements = await page.$$('.cart-count, [class*="cart"]');
            
            if (cartElements.length > 0) {
              for (let element of cartElements) {
                const text = await element.textContent();
                console.log(`   Cart element text: "${text}"`);
              }
            }
          } else {
            console.log('❌ No Add to Cart button found in popup');
          }
        } else {
          console.log('❌ No popup appeared - item might be broken');
        }
        
      } catch (error) {
        console.log(`❌ Error clicking menu item: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('⏸️ PAUSING FOR 30 SECONDS TO INSPECT...');
    console.log('Press Ctrl+C to stop, or wait for auto-continue');
    
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('👀 VISUAL DEBUG COMPLETE');
  console.log('========================');
  console.log('🎯 Now we can see exactly what\'s happening!');
  console.log('🍕 Time to make this as easy as ordering pizza while drunk');
}

playwrightVisualDebug().catch(console.error);