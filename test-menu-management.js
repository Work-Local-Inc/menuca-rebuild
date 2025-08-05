const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Testing menu management system...');
    
    // Login first
    await page.goto('https://menuca-rebuild.vercel.app/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.fill('input[type="email"]', 'admin@menuca.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to restaurant page
    await page.waitForTimeout(5000);
    
    console.log('Current URL after login:', page.url());
    
    // Take screenshot of menu management page
    await page.screenshot({ path: '/Users/brianlapp/menu-management-test.png', fullPage: true });
    console.log('Menu management screenshot saved');
    
    // Check for menu management elements
    const hasMenuManagement = await page.$('text=Menu Management');
    const hasAddCategory = await page.$('text=Add Category');
    const hasRestaurantSelect = await page.$('text=Select Restaurant');
    
    console.log('Menu Management header found:', !!hasMenuManagement);
    console.log('Add Category button found:', !!hasAddCategory);
    console.log('Restaurant selector found:', !!hasRestaurantSelect);
    
    if (hasMenuManagement && hasAddCategory) {
      console.log('✅ SUCCESS: Menu Management system is now accessible!');
    } else {
      console.log('❌ Menu Management system not loading correctly');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();