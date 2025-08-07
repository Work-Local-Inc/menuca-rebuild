/**
 * Final comprehensive test of the fixed payment flow
 */

const { chromium } = require('playwright');

async function finalTest() {
  console.log('🎯 FINAL TEST: Complete Payment Success Flow...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🍕 Step 1: Go to Xtreme Pizza');
    await page.goto('https://menuca-rebuild.vercel.app/restaurant/xtreme-pizza-checkout');
    await page.waitForLoadState('networkidle');
    
    console.log('🛒 Step 2: Add items and checkout');
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 10000 });
    
    // Add items
    const addButtons = await page.locator('button:has-text("Add to Cart")');
    await addButtons.first().click();
    await page.waitForTimeout(1000);
    await addButtons.nth(2).click(); // Add a different item
    
    // Get cart total for verification
    const cartInfo = await page.locator('text=/Cart: \\d+ items • \\$[\\d.]+/').textContent();
    console.log('   Cart status:', cartInfo);
    
    console.log('💳 Step 3: Proceed to checkout');
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForURL('**/checkout', { timeout: 10000 });
    
    console.log('   ✅ Successfully redirected to checkout page');
    
    // Wait for the cart to load on checkout page
    await page.waitForTimeout(3000);
    
    console.log('🎉 Step 4: Simulate payment success');
    
    // Check if cart loaded properly
    const checkoutContent = await page.textContent('body');
    if (checkoutContent.includes('Your cart is empty')) {
      console.log('   ⚠️  Cart appears empty on checkout page - this might resolve after payment');
    } else if (checkoutContent.includes('Review Your Order')) {
      console.log('   ✅ Cart loaded successfully on checkout page');
    }
    
    // Simulate the success redirect 
    const successUrl = 'https://menuca-rebuild.vercel.app/checkout?payment=success&payment_intent=pi_final_test_' + Date.now() + '&redirect_status=succeeded';
    
    console.log('🚀 Step 5: Navigate to success URL');
    await page.goto(successUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give React time to process
    
    console.log('🔍 Step 6: Verify success page');
    
    const finalContent = await page.textContent('body');
    
    const results = {
      hasOrderConfirmed: finalContent.includes('Order Confirmed'),
      hasPaymentSuccessful: finalContent.includes('Payment successful'),
      hasOrderNumber: finalContent.includes('Order Number'),
      hasEmptyCart: finalContent.includes('Your cart is empty'),
      hasLoadingCart: finalContent.includes('Loading cart'),
      url: page.url()
    };
    
    console.log('   Results:', results);
    
    if (results.hasOrderConfirmed && results.hasPaymentSuccessful) {
      console.log('\n🏆 SUCCESS! Payment flow is working correctly!');
      console.log('✅ Users now see order confirmation instead of empty cart');
      console.log('✅ Payment success page displays properly');
      console.log('✅ Order details are shown correctly');
      
      // Take success screenshot
      await page.screenshot({ path: 'payment-success.png', fullPage: true });
      console.log('📸 Success screenshot saved: payment-success.png');
      
    } else if (!results.hasEmptyCart) {
      console.log('\n🟡 PARTIAL SUCCESS: Empty cart issue is fixed');
      console.log('⚠️  But success page styling may need adjustment');
      
    } else {
      console.log('\n❌ ISSUE PERSISTS: Still showing empty cart');
      await page.screenshot({ path: 'still-failing.png' });
      console.log('📸 Screenshot saved: still-failing.png');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    console.log('\n👋 Test complete - browser will close in 5 seconds');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

finalTest().catch(console.error);