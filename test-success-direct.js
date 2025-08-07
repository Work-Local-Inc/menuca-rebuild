/**
 * Direct test of success page functionality 
 */

const { chromium } = require('playwright');

async function testSuccessDirect() {
  console.log('🎯 DIRECT SUCCESS PAGE TEST...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🧪 Step 1: Set up order data manually');
    
    // Go to any page first to set sessionStorage
    await page.goto('https://menuca-rebuild.vercel.app/');
    
    // Set up order data
    await page.evaluate(() => {
      const orderData = {
        items: [
          {
            menuItem: { name: 'Large Pepperoni Pizza', price: 18.99 },
            quantity: 1,
            finalPrice: 18.99
          },
          {
            menuItem: { name: 'Caesar Salad', price: 8.99 },
            quantity: 1,
            finalPrice: 8.99
          }
        ],
        total: 32.86,
        subtotal: 27.98,
        tax: 3.64,
        delivery: 2.99,
        tip: 0,
        timestamp: new Date().toISOString(),
      };
      
      sessionStorage.setItem('completed_order', JSON.stringify(orderData));
      console.log('Set order data in sessionStorage');
    });
    
    console.log('   ✅ Order data stored in sessionStorage');
    
    console.log('🎉 Step 2: Navigate directly to success page');
    const successUrl = 'https://menuca-rebuild.vercel.app/order-success?payment_intent=pi_test_direct_' + Date.now();
    
    await page.goto(successUrl);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('🔍 Step 3: Check what page actually loaded');
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('❌ REDIRECTED TO LOGIN - Authentication issue');
      
      // Try to bypass login by going directly to success page
      console.log('🔄 Step 4: Trying to access success page directly...');
      await page.goto(successUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log('   Final URL after direct access:', finalUrl);
    }
    
    if (currentUrl.includes('/order-success')) {
      console.log('✅ SUCCESS PAGE LOADED!');
      
      // Check page content
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          hasOrderConfirmed: document.body.textContent.includes('Order Confirmed!'),
          hasPaymentSuccessful: document.body.textContent.includes('Payment successful'),
          hasOrderNumber: document.body.textContent.includes('Order Number'),
          hasTotalPaid: document.body.textContent.includes('Total Paid'),
          hasProcessing: document.body.textContent.includes('Processing your order'),
          fullContent: document.body.textContent.slice(0, 500)
        };
      });
      
      console.log('   📄 Page analysis:', JSON.stringify(pageContent, null, 2));
      
      if (pageContent.hasOrderConfirmed) {
        console.log('\n🏆 SUCCESS! ORDER CONFIRMATION IS WORKING!');
        console.log('✅ Users will see proper order receipt');
        
        await page.screenshot({ path: 'success-page-working.png', fullPage: true });
        console.log('📸 Success screenshot: success-page-working.png');
        
      } else if (pageContent.hasProcessing) {
        console.log('⏳ Page is stuck on "Processing your order..." - investigating...');
        
        // Check if there are any JavaScript errors
        const errors = await page.evaluate(() => {
          return window.errors || [];
        });
        console.log('   JS Errors:', errors);
        
      } else {
        console.log('❌ Success page loaded but content is wrong');
        await page.screenshot({ path: 'success-page-wrong.png' });
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'direct-test-error.png' });
  } finally {
    console.log('\n👋 Closing browser...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testSuccessDirect().catch(console.error);