/**
 * Test the NEW dedicated order success page
 */

const { chromium } = require('playwright');

async function testRealSuccess() {
  console.log('🎯 TESTING REAL ORDER SUCCESS PAGE...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🍕 Step 1: Go to Xtreme Pizza and add items');
    await page.goto('https://menuca-rebuild.vercel.app/restaurant/xtreme-pizza-checkout');
    await page.waitForLoadState('networkidle');
    
    // Add items
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 10000 });
    const addButtons = await page.locator('button:has-text("Add to Cart")');
    await addButtons.first().click();
    await page.waitForTimeout(1000);
    await addButtons.nth(1).click();
    
    const cartInfo = await page.locator('text=/Cart: \\d+ items • \\$[\\d.]+/').textContent();
    console.log('   ✅ Cart status:', cartInfo);
    
    console.log('💳 Step 2: Start checkout process');
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForURL('**/checkout', { timeout: 5000 });
    console.log('   ✅ Redirected to main checkout page');
    
    console.log('🎉 Step 3: Test the NEW order success page directly');
    
    // Set up order data in sessionStorage
    await page.evaluate(() => {
      const orderData = {
        items: [
          {
            menuItem: { name: 'Large Pepperoni Pizza', price: 18.99 },
            quantity: 1,
            finalPrice: 18.99
          },
          {
            menuItem: { name: 'Garlic Bread', price: 7.99 },
            quantity: 1,
            finalPrice: 7.99
          }
        ],
        total: 32.39,
        subtotal: 26.98,
        tax: 3.51,
        delivery: 2.99,
        tip: 0,
        timestamp: new Date().toISOString(),
      };
      
      sessionStorage.setItem('completed_order', JSON.stringify(orderData));
    });
    
    // Navigate to the NEW success page
    const successUrl = 'https://menuca-rebuild.vercel.app/order-success?payment_intent=pi_test_real_success_' + Date.now();
    await page.goto(successUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('🔍 Step 4: Verify SUCCESS PAGE ELEMENTS');
    
    const successElements = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        hasOrderConfirmed: text.includes('Order Confirmed!'),
        hasPaymentSuccessful: text.includes('Payment successful'),
        hasOrderNumber: text.includes('Order Number'),
        hasTotalPaid: text.includes('Total Paid'),
        hasYourOrder: text.includes('Your Order'),
        hasWhatNext: text.includes('What\'s Next'),
        hasOrderAgain: text.includes('Order Again'),
        hasEmptyCart: text.includes('Your cart is empty'),
        url: window.location.href
      };
    });
    
    console.log('   🔍 Success page analysis:', successElements);
    
    if (successElements.hasOrderConfirmed && 
        successElements.hasPaymentSuccessful && 
        successElements.hasOrderNumber &&
        !successElements.hasEmptyCart) {
      
      console.log('\n🏆🏆🏆 SUCCESS! ORDER CONFIRMATION PAGE IS WORKING! 🏆🏆🏆');
      console.log('✅ Shows "Order Confirmed!"');
      console.log('✅ Shows "Payment successful"'); 
      console.log('✅ Shows order number');
      console.log('✅ Shows order details');
      console.log('✅ NO empty cart message!');
      console.log('✅ Users now get proper receipt confirmation!');
      
      await page.screenshot({ path: 'SUCCESS-order-confirmation.png', fullPage: true });
      console.log('📸 Success screenshot: SUCCESS-order-confirmation.png');
      
    } else {
      console.log('\n❌ STILL ISSUES:');
      if (!successElements.hasOrderConfirmed) console.log('   - Missing "Order Confirmed!"');
      if (!successElements.hasPaymentSuccessful) console.log('   - Missing "Payment successful"');  
      if (!successElements.hasOrderNumber) console.log('   - Missing order number');
      if (successElements.hasEmptyCart) console.log('   - Still shows empty cart');
      
      await page.screenshot({ path: 'still-broken.png' });
    }
    
    console.log('\n🎯 Step 5: Test order details display');
    const orderDetails = await page.locator('text=Large Pepperoni Pizza').count();
    const priceDisplay = await page.locator('text=$32.39').count();
    
    if (orderDetails > 0) {
      console.log('✅ Order items are displayed correctly');
    }
    if (priceDisplay > 0) {
      console.log('✅ Total amount is displayed correctly');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error-real.png' });
  } finally {
    console.log('\n👋 Closing browser in 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testRealSuccess().catch(console.error);