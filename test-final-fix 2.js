const { chromium } = require('playwright');

async function testFinalFix() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs and errors
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    console.log('🔍 Testing FINAL FIX - Menu page should now work...');
    
    await page.goto('https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for menu to fully load...');
    await page.waitForTimeout(8000);
    
    // Check for React errors
    console.log('\n❌ React Errors Found:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    
    // Look for success indicators in console
    const hasLoadedRestaurant = consoleMessages.some(msg => msg.includes('Loaded restaurant'));
    const hasLoadedMenu = consoleMessages.some(msg => msg.includes('Loaded 34 menu items'));
    
    console.log('✅ Restaurant Loaded:', hasLoadedRestaurant);
    console.log('✅ Menu Items Loaded:', hasLoadedMenu);
    
    // Check page content
    const pageContent = await page.content();
    
    // Look for Tony's Pizza items
    const hasTonysSpecial = pageContent.includes("Tony's Special");
    const hasMargherita = pageContent.includes("Margherita Pizza");
    const hasHawaiian = pageContent.includes("Hawaiian");
    const hasRealPrices = pageContent.includes("$17.") || pageContent.includes("$15.75");
    
    console.log('\n🍕 MENU CONTENT CHECK:');
    console.log('🍕 Has Tony\'s Special:', hasTonysSpecial);
    console.log('🍕 Has Margherita Pizza:', hasMargherita);
    console.log('🍕 Has Hawaiian:', hasHawaiian);
    console.log('💰 Has Real Prices:', hasRealPrices);
    
    // Check for categories
    const hasDailySpecial = pageContent.includes("Daily Special");
    const hasSuperSpecials = pageContent.includes("Super Specials");
    
    console.log('📂 Has Daily Special:', hasDailySpecial);
    console.log('📂 Has Super Specials:', hasSuperSpecials);
    
    // Check for loading states
    const isStillLoading = pageContent.includes('Loading') && !pageContent.includes('Tony');
    console.log('⏳ Still Loading:', isStillLoading);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'menu-final-test.png', 
      fullPage: true 
    });
    console.log('📸 Final screenshot saved as menu-final-test.png');
    
    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (errors.length === 0 && hasTonysSpecial && hasMargherita && hasRealPrices) {
      console.log('🎉🎉🎉 SUCCESS! Menu is displaying real Tony\'s Pizza data! 🎉🎉🎉');
    } else if (errors.length === 0 && hasLoadedMenu) {
      console.log('✅ No React errors, menu data loaded, but may need more time to render');
    } else if (errors.length > 0) {
      console.log('❌ Still has React errors preventing proper display');
    } else {
      console.log('⚠️  Unknown issue - check screenshot');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  await browser.close();
}

testFinalFix();
