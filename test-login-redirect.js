const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Testing updated login flow...');
    await page.goto('https://menuca-rebuild.vercel.app/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Current URL:', page.url());
    
    // Fill in login form
    await page.fill('input[type="email"]', 'admin@menuca.local');
    await page.fill('input[type="password"]', 'password123');
    
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(5000);
    
    console.log('Post-login URL:', page.url());
    
    // Take screenshot of destination page
    await page.screenshot({ path: '/Users/brianlapp/login-redirect-test.png', fullPage: true });
    console.log('Login redirect screenshot saved');
    
    // Check if we're on restaurant page
    const isRestaurantPage = page.url().includes('/restaurant');
    const hasRestaurantSelect = await page.$('text=restaurant');
    const hasOrderManagement = await page.$('text=Order Management');
    
    console.log('Redirected to restaurant page:', isRestaurantPage);
    console.log('Restaurant selector found:', !!hasRestaurantSelect);
    console.log('Order management found:', !!hasOrderManagement);
    
    if (isRestaurantPage && hasOrderManagement) {
      console.log('✅ SUCCESS: Login now redirects to restaurant management system!');
    } else {
      console.log('❌ Login redirect not working correctly');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();