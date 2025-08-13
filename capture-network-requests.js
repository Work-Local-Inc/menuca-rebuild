/**
 * 📡 CAPTURE NETWORK REQUESTS
 * 
 * Since I fucked up and closed your session, let's just capture the network 
 * requests when you manually place another order
 */

const { chromium } = require('playwright');

async function captureNetworkRequests() {
  let browser;
  let context;
  let page;

  try {
    console.log('📡 NETWORK REQUEST CAPTURE MODE');
    console.log('==============================');
    console.log('🎯 I will capture all network requests while you place order manually');
    console.log('');

    browser = await chromium.launch({
      headless: false,
      slowMo: 100
    });

    context = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });

    page = await context.newPage();

    // Capture all network requests
    const networkRequests = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      
      // Log important requests
      if (request.url().includes('placeOrder') || 
          request.url().includes('cart') || 
          request.url().includes('checkout') ||
          request.url().includes('address')) {
        console.log(`📤 ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log(`   Data: ${request.postData().substring(0, 200)}...`);
        }
      }
    });

    page.on('response', response => {
      // Log important responses
      if (response.url().includes('placeOrder') || 
          response.url().includes('cart') || 
          response.url().includes('checkout')) {
        console.log(`📥 ${response.status()} ${response.url()}`);
      }
    });

    // Start at login page
    await page.goto('https://aggregator-landing.menu.ca/index.php/account/login');
    
    console.log('');
    console.log('🌐 BROWSER READY FOR YOUR MANUAL ORDER');
    console.log('=====================================');
    console.log('📋 Please place your order manually (I will capture all requests):');
    console.log('   1. Login');
    console.log('   2. Go to menu');
    console.log('   3. Add items to cart');  
    console.log('   4. Checkout');
    console.log('   5. Place order');
    console.log('');
    console.log('📡 All network requests will be logged here...');
    console.log('⏸️  Press ENTER when order is complete');

    // Wait for user to complete order
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    console.log('');
    console.log('📊 NETWORK CAPTURE COMPLETE');
    console.log('===========================');
    console.log(`📡 Captured ${networkRequests.length} total requests`);
    
    // Filter and show important requests
    const importantRequests = networkRequests.filter(req => 
      req.url.includes('placeOrder') || 
      req.url.includes('check_address') ||
      req.url.includes('cart') ||
      req.method === 'POST'
    );

    console.log(`🎯 ${importantRequests.length} important requests:`);
    
    importantRequests.forEach((req, i) => {
      console.log(`\n${i+1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   Data: ${req.postData}`);
      }
      console.log(`   Headers: ${JSON.stringify(req.headers, null, 2)}`);
    });

    // Save to file
    require('fs').writeFileSync('captured-requests.json', JSON.stringify(importantRequests, null, 2));
    console.log('\n💾 Saved to captured-requests.json');

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureNetworkRequests().catch(console.error);