const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  
  try {
    console.log('Testing login flow on: https://menuca-rebuild.vercel.app/login');
    await page.goto('https://menuca-rebuild.vercel.app/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Page loaded successfully');
    
    // Fill in login credentials
    await page.fill('#email', 'admin@menuca.local');
    await page.fill('#password', 'password123');
    console.log('Filled login credentials');
    
    // Click login button and wait for navigation
    const navigationPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
    await page.click('button[type="submit"]');
    console.log('Clicked login button');
    
    const navigation = await navigationPromise;
    if (navigation) {
      console.log('✅ Login successful! Redirected to:', page.url());
      
      // Take screenshot of dashboard
      await page.screenshot({ path: '/Users/brianlapp/dashboard-test.png' });
      console.log('Dashboard screenshot saved');
      
      // Check if we're on dashboard
      if (page.url().includes('/dashboard')) {
        console.log('✅ Successfully reached dashboard');
      }
    } else {
      console.log('❌ No navigation occurred - login may have failed');
      
      // Check for error messages
      const errorElement = await page.$('.text-red-600');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log('Error message:', errorText);
      }
      
      // Take screenshot of current state
      await page.screenshot({ path: '/Users/brianlapp/login-failed-test.png' });
      console.log('Login failure screenshot saved');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();