const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  
  // Capture JavaScript errors 
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    console.log(`[ERROR STACK] ${error.stack}`);
  });
  
  try {
    console.log('Testing: https://menuca-rebuild.vercel.app/login');
    await page.goto('https://menuca-rebuild.vercel.app/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Page title:', await page.title());
    
    // Wait a bit for any async errors
    await page.waitForTimeout(3000);
    
    // Try to find login form elements
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    const loginButton = await page.$('button[type="submit"]');
    
    console.log('Email input found:', !!emailInput);
    console.log('Password input found:', !!passwordInput);
    console.log('Login button found:', !!loginButton);
    
    // Take a screenshot
    await page.screenshot({ path: '/Users/brianlapp/login-test.png' });
    console.log('Screenshot saved to: /Users/brianlapp/login-test.png');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();