const { chromium } = require('playwright');

async function testMenuOnly() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing Menu Page Only...');
    
    await page.goto('https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait longer for menu to load
    console.log('⏳ Waiting for menu to load...');
    await page.waitForTimeout(8000);
    
    // Take screenshot first
    await page.screenshot({ 
      path: 'menu-page-current.png', 
      fullPage: true 
    });
    console.log('📸 Menu screenshot saved');
    
    // Check page content without waiting for specific elements
    const pageContent = await page.content();
    
    // Look for loading states
    const isLoading = pageContent.includes('Loading') || pageContent.includes('loading');
    console.log('⏳ Page is loading:', isLoading);
    
    // Look for Tony's Pizza items
    const hasTonysSpecial = pageContent.includes("Tony's Special");
    const hasMargherita = pageContent.includes("Margherita Pizza");
    const hasHawaiian = pageContent.includes("Hawaiian");
    const hasRealPrices = pageContent.includes("$17.") || pageContent.includes("$15.75") || pageContent.includes("$24.95");
    
    console.log('🍕 Has Tony\'s Special:', hasTonysSpecial);
    console.log('🍕 Has Margherita Pizza:', hasMargherita);
    console.log('🍕 Has Hawaiian:', hasHawaiian);
    console.log('💰 Has Real Prices:', hasRealPrices);
    
    // Check for categories
    const hasDailySpecial = pageContent.includes("Daily Special");
    const hasSuperSpecials = pageContent.includes("Super Specials");
    const hasPizzaCategory = pageContent.includes("Pizza");
    const hasDrinksCategory = pageContent.includes("Drinks");
    
    console.log('📂 Has Daily Special category:', hasDailySpecial);
    console.log('📂 Has Super Specials category:', hasSuperSpecials);
    console.log('📂 Has Pizza category:', hasPizzaCategory);
    console.log('📂 Has Drinks category:', hasDrinksCategory);
    
    // Check for mock data (should NOT be present)
    const hasMockData = pageContent.includes("Xtreme Pizza Ottawa") || pageContent.includes("Pepperoni Supreme");
    console.log('❌ Has Mock Data (should be false):', hasMockData);
    
    // Count potential menu items by looking for price patterns
    const priceMatches = pageContent.match(/\$\d+\.\d+/g) || [];
    console.log('💰 Price patterns found:', priceMatches.length);
    
    console.log('\n🎯 MENU PAGE ASSESSMENT:');
    if (hasTonysSpecial && hasMargherita && hasRealPrices && !hasMockData) {
      console.log('🎉 SUCCESS: Real Tony\'s Pizza menu is displaying!');
    } else if (isLoading) {
      console.log('⏳ LOADING: Menu is still loading, may need more time');
    } else {
      console.log('⚠️  ISSUE: Menu may still be showing mock data or not loading properly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  await browser.close();
}

testMenuOnly();
