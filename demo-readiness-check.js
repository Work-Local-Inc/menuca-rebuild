const { chromium } = require('playwright');

async function demoReadinessCheck() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🎬 FINAL DEMO READINESS CHECK');
    console.log('============================');
    
    await page.goto('https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(6000);
    
    const pageContent = await page.content();
    
    console.log('\n🏪 RESTAURANT HEADER INFO:');
    
    // Check restaurant name
    const restaurantName = await page.textContent('h1').catch(() => null);
    console.log('✅ Restaurant Name:', restaurantName || 'Not found');
    
    // Check key restaurant info elements
    const checks = {
      hasRealName: restaurantName && restaurantName.includes('CSS FINALLY FIXED'),
      hasDescription: pageContent.includes('Delicious Pizza restaurant'),
      hasAddress: pageContent.includes('7772 Jeanne') || pageContent.includes('Ottawa'),
      hasPhone: pageContent.includes('613-555-9999'),
      hasRating: pageContent.includes('4.8'),
      hasReviews: pageContent.includes('47') || pageContent.includes('review'),
      hasDeliveryInfo: pageContent.includes('25-35 min') && pageContent.includes('$2.99'),
      hasChefIcon: pageContent.includes('chef') || pageContent.includes('ChefHat')
    };
    
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    
    console.log('\n🍕 MENU ITEMS CHECK:');
    
    const menuChecks = {
      hasTonysSpecial: pageContent.includes("Tony's Special"),
      hasMargherita: pageContent.includes('Margherita Pizza'),
      hasHawaiian: pageContent.includes('Hawaiian'),
      hasCategories: pageContent.includes('Daily Special') && pageContent.includes('Super Specials'),
      hasRealPrices: pageContent.includes('$17.') && pageContent.includes('$15.75'),
      itemCount: (pageContent.match(/\$\d+\.\d+/g) || []).length
    };
    
    Object.entries(menuChecks).forEach(([key, value]) => {
      console.log(`${typeof value === 'boolean' ? (value ? '✅' : '❌') : '📊'} ${key}: ${value}`);
    });
    
    console.log('\n❌ MOCK DATA CHECK (should all be false):');
    
    const mockDataChecks = {
      hasXtremePizza: pageContent.includes('Xtreme Pizza Ottawa'),
      hasMockAddress: pageContent.includes('123 Bank Street'),
      hasPepperoniSupreme: pageContent.includes('Pepperoni Supreme'),
      hasMockPhone: pageContent.includes('613-123-4567')
    };
    
    Object.entries(mockDataChecks).forEach(([key, value]) => {
      console.log(`${value ? '🚨' : '✅'} ${key}: ${value}`);
    });
    
    // Take final demo screenshot
    await page.screenshot({ 
      path: 'demo-ready-screenshot.png', 
      fullPage: true 
    });
    console.log('\n📸 Demo screenshot saved as demo-ready-screenshot.png');
    
    // Demo readiness score
    const positiveChecks = Object.values(checks).filter(Boolean).length;
    const menuPositiveChecks = Object.values({...menuChecks, itemCount: menuChecks.itemCount > 30}).filter(Boolean).length;
    const mockDataIssues = Object.values(mockDataChecks).filter(Boolean).length;
    
    const totalScore = positiveChecks + menuPositiveChecks - mockDataIssues;
    const maxScore = Object.keys(checks).length + Object.keys(menuChecks).length;
    
    console.log('\n🎯 DEMO READINESS SCORE:');
    console.log(`📊 Score: ${totalScore}/${maxScore} (${Math.round(totalScore/maxScore*100)}%)`);
    
    if (totalScore >= maxScore * 0.9) {
      console.log('🎉 DEMO READY! Restaurant looks great for presentation!');
    } else if (totalScore >= maxScore * 0.7) {
      console.log('⚠️  MOSTLY READY - Minor improvements recommended');
    } else {
      console.log('❌ NOT READY - Significant issues need fixing');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    if (!checks.hasAddress) console.log('- Add real restaurant address');
    if (!checks.hasPhone) console.log('- Add restaurant phone number'); 
    if (mockDataIssues > 0) console.log('- Remove remaining mock data');
    if (menuChecks.itemCount < 30) console.log('- Ensure all 34 menu items are displaying');
    
    console.log('\n🔗 Demo URLs:');
    console.log('Dashboard:', 'https://menuca-rebuild.vercel.app/restaurant/8731a563-4985-4381-9407-1355d48584c7/dashboard');
    console.log('Menu:', 'https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7');
    
  } catch (error) {
    console.error('❌ Demo check failed:', error);
  }
  
  await browser.close();
}

demoReadinessCheck();
