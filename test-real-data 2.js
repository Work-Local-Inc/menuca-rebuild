const { chromium } = require('playwright');

async function testRealData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing Restaurant Dashboard...');
    
    // Test Restaurant Dashboard
    await page.goto('https://menuca-rebuild.vercel.app/restaurant/8731a563-4985-4381-9407-1355d48584c7/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Check if we see the real restaurant name
    const restaurantName = await page.textContent('h1');
    console.log('📊 Restaurant Name Found:', restaurantName);
    
    if (restaurantName && restaurantName.includes('CSS FINALLY FIXED')) {
      console.log('✅ SUCCESS: Real restaurant name is showing!');
    } else {
      console.log('❌ PROBLEM: Still showing mock data:', restaurantName);
    }
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: 'dashboard-test.png', 
      fullPage: true 
    });
    console.log('📸 Dashboard screenshot saved as dashboard-test.png');
    
    console.log('\n🔍 Testing Menu Page...');
    
    // Test Menu Page
    await page.goto('https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for menu to load
    await page.waitForTimeout(5000);
    
    // Check restaurant name on menu page
    const menuRestaurantName = await page.textContent('h1');
    console.log('📊 Menu Page Restaurant Name:', menuRestaurantName);
    
    // Count menu items
    const menuItems = await page.$$('[data-testid="menu-item"], .menu-item, [class*="menu-item"]');
    console.log('📊 Menu Items Found:', menuItems.length);
    
    // Look for specific Tony's Pizza items
    const pageContent = await page.content();
    const hasTonysSpecial = pageContent.includes("Tony's Special");
    const hasMargherita = pageContent.includes("Margherita Pizza");
    const hasRealPrices = pageContent.includes("$17.") || pageContent.includes("$15.75");
    
    console.log('🍕 Has Tony\'s Special:', hasTonysSpecial);
    console.log('🍕 Has Margherita Pizza:', hasMargherita);
    console.log('💰 Has Real Prices:', hasRealPrices);
    
    // Check for categories
    const hasCategories = pageContent.includes("Daily Special") || pageContent.includes("Super Specials");
    console.log('📂 Has Real Categories:', hasCategories);
    
    // Take screenshot of menu
    await page.screenshot({ 
      path: 'menu-test.png', 
      fullPage: true 
    });
    console.log('📸 Menu screenshot saved as menu-test.png');
    
    // Overall assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (restaurantName && restaurantName.includes('CSS FINALLY FIXED') && 
        (hasTonysSpecial || hasMargherita || hasRealPrices)) {
      console.log('🎉 SUCCESS: Real scraped data is displaying properly!');
    } else {
      console.log('⚠️  ISSUE: Still seeing mock data or loading problems');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  await browser.close();
}

testRealData();
