const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('📸 Taking screenshot of onboarding page...');
    await page.goto('https://menuca-rebuild.vercel.app/restaurant/onboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'onboarding-page-screenshot.png', 
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved as onboarding-page-screenshot.png');
    
    // Also check homepage
    await page.goto('https://menuca-rebuild.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'homepage-screenshot.png', 
      fullPage: true 
    });
    
    console.log('✅ Homepage screenshot saved as homepage-screenshot.png');
    
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
  } finally {
    await browser.close();
  }
})();
