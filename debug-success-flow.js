/**
 * Debug the success page flow step by step
 */

const { chromium } = require('playwright');

async function debugSuccessFlow() {
  console.log('🔍 DEBUG: Comprehensive Success Flow Analysis...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🍕 Step 1: Go to Xtreme Pizza and add items to cart');
    await page.goto('https://menuca-rebuild.vercel.app/restaurant/xtreme-pizza-checkout');
    await page.waitForLoadState('networkidle');
    
    // Add items to cart
    console.log('   Waiting for menu to load...');
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 15000 });
    
    const addButtons = await page.locator('button:has-text("Add to Cart")');
    console.log('   Adding 2 items to cart...');
    await addButtons.first().click();
    await page.waitForTimeout(1000);
    await addButtons.nth(1).click();
    await page.waitForTimeout(1000);
    
    // Check cart state
    const cartText = await page.locator('text=Cart:').textContent().catch(() => 'Not found');
    console.log('   Cart status:', cartText);
    
    console.log('💳 Step 2: Check sessionStorage BEFORE checkout');
    const beforeStorage = await page.evaluate(() => {
      return {
        checkout_cart: sessionStorage.getItem('checkout_cart'),
        completed_order: sessionStorage.getItem('completed_order'),
        all_keys: Object.keys(sessionStorage)
      };
    });
    console.log('   SessionStorage before:', JSON.stringify(beforeStorage, null, 2));
    
    console.log('🛒 Step 3: Click Proceed to Checkout');
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(3000);
    
    console.log('💾 Step 4: Check sessionStorage AFTER checkout click');
    const afterCheckout = await page.evaluate(() => {
      return {
        checkout_cart: sessionStorage.getItem('checkout_cart'),
        completed_order: sessionStorage.getItem('completed_order'),
        all_keys: Object.keys(sessionStorage)
      };
    });
    console.log('   SessionStorage after checkout:', JSON.stringify(afterCheckout, null, 2));
    
    console.log('📄 Step 5: Check current URL and page content');
    console.log('   Current URL:', page.url());
    
    // Check what's actually on the page now
    const pageContent = await page.locator('h1, h2, h3').allTextContents();
    console.log('   Page headings:', pageContent);
    
    console.log('🧪 Step 6: Manually set up order data and test redirect');
    
    // Set up proper order data
    await page.evaluate(() => {
      const mockOrder = {
        items: [
          {
            menuItem: { name: 'Large Pepperoni Pizza', price: 1899 },
            quantity: 1,
            finalPrice: 1899
          },
          {
            menuItem: { name: 'Caesar Salad', price: 899 },
            quantity: 1,
            finalPrice: 899
          }
        ],
        total: 31.27,
        subtotal: 27.98,
        tax: 3.64,
        delivery: 2.99,
        tip: 0,
        timestamp: new Date().toISOString(),
      };
      
      sessionStorage.setItem('completed_order', JSON.stringify(mockOrder));
      console.log('Set mock order data in sessionStorage');
    });
    
    console.log('🎯 Step 7: Navigate to success page');
    const successUrl = 'https://menuca-rebuild.vercel.app/checkout?payment=success&payment_intent=pi_debug_test_123&redirect_status=succeeded';
    await page.goto(successUrl);
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Step 8: Analyze success page');
    
    // Check final sessionStorage
    const finalStorage = await page.evaluate(() => {
      return {
        checkout_cart: sessionStorage.getItem('checkout_cart'),
        completed_order: sessionStorage.getItem('completed_order'),
        all_keys: Object.keys(sessionStorage)
      };
    });
    console.log('   Final sessionStorage:', JSON.stringify(finalStorage, null, 2));
    
    // Check for specific elements
    const successElements = await page.evaluate(() => {
      const elements = {
        'Order Confirmed': document.body.textContent.includes('Order Confirmed!'),
        'Your cart is empty': document.body.textContent.includes('Your cart is empty'),
        'Loading cart': document.body.textContent.includes('Loading cart'),
        'Payment successful': document.body.textContent.includes('Payment successful'),
        'Order Number': document.body.textContent.includes('Order Number:'),
        'h1_content': document.querySelector('h1')?.textContent || 'No H1',
        'h2_content': document.querySelector('h2')?.textContent || 'No H2',
        'h3_content': document.querySelector('h3')?.textContent || 'No H3',
        'full_text_preview': document.body.textContent.slice(0, 500) + '...'
      };
      
      return elements;
    });
    
    console.log('   Success page analysis:', JSON.stringify(successElements, null, 2));
    
    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'debug-success-page.png', fullPage: true });
    console.log('   📸 Screenshot saved: debug-success-page.png');
    
    console.log('\n🏁 DEBUG COMPLETE');
    if (successElements['Your cart is empty']) {
      console.log('❌ ISSUE CONFIRMED: Page still shows empty cart');
    } else if (successElements['Order Confirmed']) {
      console.log('✅ SUCCESS: Order confirmation is working');
    } else {
      console.log('⚠️  UNKNOWN STATE: Page shows something else');
    }
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugSuccessFlow().catch(console.error);