/**
 * 🎯 SIMPLE TABLET BRIDGE - Step by Step
 * 
 * This maintains the browser session and lets you control each step
 */

const { chromium } = require('playwright');

let browser = null;
let page = null;

async function step1_openTablet() {
  console.log('🚀 STEP 1: Opening tablet session...');
  
  browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Linux; Android 4.4.4; Samsung SM-T510) AppleWebKit/537.36'
  });
  
  // Go to tablet
  await page.goto('https://tablet.menu.ca/app.php');
  await page.waitForTimeout(3000);
  
  // Set O11 authentication
  await page.context().addCookies([
    {
      name: 'rt_designator',
      value: 'O11', 
      domain: 'tablet.menu.ca',
      path: '/'
    },
    {
      name: 'rt_key',
      value: '689a5531a6f31',
      domain: 'tablet.menu.ca', 
      path: '/'
    }
  ]);
  
  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log('✅ STEP 1 COMPLETE: Tablet opened as O11');
  console.log('📱 You should see "Test James - Dovercourt Pizza" tablet interface');
  console.log('🛒 Now manually add items to cart, then run step2_checkout()');
}

async function step2_checkout() {
  if (!page) {
    console.log('❌ Run step1_openTablet() first!');
    return;
  }
  
  console.log('💳 STEP 2: Attempting checkout...');
  
  // Check cart has items
  const cartStatus = await page.evaluate(() => {
    const cart = localStorage.getItem('cart') || sessionStorage.getItem('cart') || '{}';
    return {
      localStorage: localStorage.getItem('cart'),
      sessionStorage: sessionStorage.getItem('cart'),
      cartFound: cart.length > 2
    };
  });
  
  console.log('🛒 Cart status:', cartStatus);
  
  // Try to find checkout button
  const checkoutSelectors = [
    'a[href*="checkout"]',
    'button:has-text("Checkout")',
    '#checkout',
    '.checkout-btn',
    '[data-checkout]'
  ];
  
  let checkoutFound = false;
  for (const selector of checkoutSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        console.log(`🔍 Found checkout button: ${selector}`);
        await element.click();
        checkoutFound = true;
        break;
      }
    } catch (e) {
      // Continue trying
    }
  }
  
  if (!checkoutFound) {
    console.log('❌ Could not find checkout button');
    console.log('🔍 Available buttons:');
    const buttons = await page.$$eval('button, a', elements => 
      elements.map(el => el.textContent?.trim()).filter(text => text)
    );
    console.log(buttons);
    return;
  }
  
  await page.waitForTimeout(3000);
  
  // Try to complete order
  await step3_placeOrder();
}

async function step3_placeOrder() {
  console.log('📤 STEP 3: Placing order...');
  
  // Listen for network requests
  page.on('response', response => {
    const url = response.url();
    if (url.includes('tablet.menu.ca') || url.includes('action.php') || url.includes('order')) {
      console.log(`📡 ${response.status()} ${url}`);
    }
  });
  
  // Look for place order button
  const orderSelectors = [
    'button:has-text("Place Order")',
    'button:has-text("Submit")', 
    'button:has-text("Complete")',
    '#place-order',
    '[data-place-order]',
    '.place-order'
  ];
  
  for (const selector of orderSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        console.log(`📤 Clicking place order: ${selector}`);
        await element.click();
        await page.waitForTimeout(5000);
        
        console.log('🎉 ORDER PLACED!');
        console.log('📱 Check your Samsung tablet for the new order!');
        return;
      }
    } catch (e) {
      // Continue trying
    }
  }
  
  console.log('❌ Could not find place order button');
  const allButtons = await page.$$eval('button, input[type="submit"]', elements => 
    elements.map(el => ({
      text: el.textContent?.trim(),
      type: el.type,
      id: el.id,
      className: el.className
    })).filter(btn => btn.text)
  );
  console.log('🔍 Available order buttons:', allButtons);
}

async function cleanup() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}

// Export functions
module.exports = {
  step1_openTablet,
  step2_checkout, 
  step3_placeOrder,
  cleanup
};

// If run directly, start with step 1
if (require.main === module) {
  step1_openTablet().catch(console.error);
}