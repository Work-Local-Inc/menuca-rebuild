const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('📸 Taking screenshot of onboarding page...');
    await page.goto('https://menuca-rebuild-rasmr8110-lapptastiks-projects.vercel.app/restaurant/onboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'onboarding-page-fixed.png', 
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved as onboarding-page-screenshot.png');
    
    // Also check homepage
    await page.goto('https://menuca-rebuild-rasmr8110-lapptastiks-projects.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'homepage-fixed.png', 
      fullPage: true 
    });
    
    console.log('✅ Homepage screenshot saved as homepage-screenshot.png');
    
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
  } finally {
    await browser.close();
  }
})();
