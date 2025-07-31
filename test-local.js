const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  try {
    console.log('Testing: http://localhost:3002/login');
    await page.goto('http://localhost:3002/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Page title:', await page.title());
    
    // Check if login form elements exist
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    const loginButton = await page.$('button[type="submit"]');
    
    console.log('Email input found:', !!emailInput);
    console.log('Password input found:', !!passwordInput); 
    console.log('Login button found:', !!loginButton);
    
    // Take a screenshot
    await page.screenshot({ path: '/Users/brianlapp/local-login-test.png' });
    console.log('Screenshot saved to: /Users/brianlapp/local-login-test.png');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();