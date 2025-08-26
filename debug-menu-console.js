const { chromium } = require('playwright');

async function debugMenuConsole() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs and errors
  page.on('console', msg => {
    console.log('🖥️  BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
  });
  
  page.on('requestfailed', request => {
    console.log('🚫 FAILED REQUEST:', request.url(), request.failure()?.errorText);
  });
  
  try {
    console.log('🔍 Loading menu page with console monitoring...');
    
    await page.goto('https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Waiting 10 seconds to see what happens...');
    await page.waitForTimeout(10000);
    
    // Check network requests
    console.log('\n🌐 Checking if API calls were made...');
    
    // Try to see what's in the page
    const title = await page.title();
    console.log('📄 Page Title:', title);
    
    // Check if there are any visible elements
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.length > 100;
    console.log('📝 Has Content:', hasContent);
    console.log('📝 Body Text Length:', bodyText ? bodyText.length : 0);
    
    if (bodyText) {
      // Show first 200 characters
      console.log('📝 First 200 chars:', bodyText.substring(0, 200));
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'menu-debug-final.png', 
      fullPage: true 
    });
    console.log('📸 Debug screenshot saved as menu-debug-final.png');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  await browser.close();
}

debugMenuConsole();
