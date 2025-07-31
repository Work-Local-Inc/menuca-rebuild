const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Testing restaurant management page directly...');
    await page.goto('https://menuca-rebuild.vercel.app/restaurant', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Current URL:', page.url());
    
    // Wait for loading to complete
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: '/Users/brianlapp/restaurant-page-test.png', fullPage: true });
    console.log('Restaurant page screenshot saved');
    
    // Check for restaurant management elements
    const hasRestaurantSelect = await page.$('text=restaurant');
    const hasOrderManagement = await page.$('text=Order Management');
    const hasPendingOrders = await page.$('text=pending');
    
    console.log('Restaurant selector found:', !!hasRestaurantSelect);
    console.log('Order management found:', !!hasOrderManagement);
    console.log('Pending orders found:', !!hasPendingOrders);
    
    if (hasOrderManagement) {
      console.log('✅ SUCCESS: Real restaurant management system is accessible!');
    } else {
      console.log('❌ Restaurant management not loading');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();