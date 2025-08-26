const { chromium } = require('playwright');

async function debugApiCalls() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Track all network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/restaurants/')) {
      requests.push({
        url: request.url(),
        method: request.method()
      });
      console.log('📤 API REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/restaurants/')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        ok: response.ok()
      });
      console.log('📥 API RESPONSE:', response.status(), response.url());
    }
  });

  page.on('console', msg => {
    if (msg.text().includes('Error') || msg.text().includes('error') || msg.text().includes('Failed')) {
      console.log('🚨 BROWSER ERROR:', msg.text());
    }
  });

  try {
    console.log('🔍 Debugging API calls on menu page...');
    
    await page.goto('https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(8000);
    
    console.log('\n📊 SUMMARY:');
    console.log('Total API requests:', requests.length);
    console.log('Total API responses:', responses.length);
    
    requests.forEach((req, i) => {
      const resp = responses[i];
      console.log(`${i + 1}. ${req.method} ${req.url}`);
      if (resp) {
        console.log(`   → ${resp.status} ${resp.ok ? '✅' : '❌'}`);
      } else {
        console.log(`   → No response received ❌`);
      }
    });
    
    // Check which state the page is in
    const pageContent = await page.content();
    const isUsingMockData = pageContent.includes('Xtreme Pizza Ottawa') || pageContent.includes('123 Bank Street');
    const isUsingRealData = pageContent.includes('CSS FINALLY FIXED') && pageContent.includes("Tony's Special");
    
    console.log('\n🎯 PAGE STATE:');
    console.log('Using Mock Data:', isUsingMockData);
    console.log('Using Real Data:', isUsingRealData);
    
    if (!isUsingRealData && requests.length === 0) {
      console.log('🚨 ISSUE: No API requests made - JavaScript may not be loading properly');
    } else if (!isUsingRealData && responses.some(r => !r.ok)) {
      console.log('🚨 ISSUE: API requests failing - falling back to mock data');
    } else if (!isUsingRealData) {
      console.log('🚨 ISSUE: Unknown problem preventing real data display');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  await browser.close();
}

debugApiCalls();
