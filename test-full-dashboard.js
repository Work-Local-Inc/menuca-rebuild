const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  
  try {
    console.log('Testing full dashboard flow...');
    await page.goto('https://menuca-rebuild.vercel.app/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Fill in login credentials
    await page.fill('#email', 'admin@menuca.local');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    console.log('Submitted login form');
    
    // Wait for navigation and loading to complete
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    
    // Take screenshot of the full dashboard
    await page.screenshot({ path: '/Users/brianlapp/full-dashboard-test.png', fullPage: true });
    console.log('Full dashboard screenshot saved');
    
    // Check for specific dashboard elements
    const hasAnalyticsTitle = await page.$('text=MenuCA Analytics Dashboard');
    const hasCampaignTab = await page.$('text=Campaigns');
    const hasKPITab = await page.$('text=KPI Management');
    
    console.log('Analytics title found:', !!hasAnalyticsTitle);
    console.log('Campaign tab found:', !!hasCampaignTab);
    console.log('KPI tab found:', !!hasKPITab);
    
    if (hasAnalyticsTitle) {
      console.log('✅ SUCCESS: Real MenuCA dashboard is loaded!');
    } else {
      console.log('❌ Still showing basic dashboard');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();