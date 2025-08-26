const { chromium } = require('playwright');

async function checkMenuDisplay() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Checking menu display for demo readiness...');
    
    await page.goto('https://menuca-rebuild.vercel.app/menu/8731a563-4985-4381-9407-1355d48584c7', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    // Check restaurant information display
    console.log('\n🏪 RESTAURANT INFO CHECK:');
    
    const restaurantName = await page.textContent('h1').catch(() => null);
    console.log('📛 Restaurant Name:', restaurantName);
    
    const pageContent = await page.content();
    
    // Check for dummy/mock data that shouldn't be there
    const hasMockData = {
      xtremeP: pageContent.includes('Xtreme Pizza'),
      mockAddress: pageContent.includes('123 Bank Street'),
      mockPhone: pageContent.includes('613-123-4567'),
      mockRating: pageContent.includes('4.8') && pageContent.includes('342'), // mock review count
      pepperoniSupreme: pageContent.includes('Pepperoni Supreme') // mock menu item
    };
    
    console.log('❌ Mock Data Found:');
    Object.entries(hasMockData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Check for real restaurant data
    const hasRealData = {
      realName: pageContent.includes('CSS FINALLY FIXED'),
      realPhone: pageContent.includes('613-555-9999'),
      realEmail: pageContent.includes('css@reallyFixed.com'),
      tonysItems: pageContent.includes("Tony's Special"),
      realPrices: pageContent.includes('$17.') || pageContent.includes('$15.75')
    };
    
    console.log('✅ Real Data Found:');
    Object.entries(hasRealData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Check for missing elements that should be present
    console.log('\n🔍 MISSING ELEMENTS CHECK:');
    
    const missingElements = {
      logo: !pageContent.includes('logo') && !pageContent.includes('Logo'),
      restaurantImage: !pageContent.includes('restaurant-image') && !pageContent.includes('header-image'),
      cuisineType: !pageContent.includes('Pizza') || !pageContent.includes('cuisine'),
      address: !pageContent.includes('address') || pageContent.includes('{}'),
      description: !pageContent.includes('Delicious Pizza restaurant')
    };
    
    console.log('❌ Missing Elements:');
    Object.entries(missingElements).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'menu-display-check.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as menu-display-check.png');
    
    // Demo readiness assessment
    console.log('\n🎯 DEMO READINESS ASSESSMENT:');
    const hasCriticalIssues = Object.values(hasMockData).some(Boolean) || Object.values(missingElements).some(Boolean);
    
    if (!hasCriticalIssues && Object.values(hasRealData).every(Boolean)) {
      console.log('🎉 DEMO READY: Real data showing, no mock data detected!');
    } else {
      console.log('⚠️  NEEDS FIXES: Found issues that should be resolved before demo');
      console.log('🔧 Issues to fix:');
      if (Object.values(hasMockData).some(Boolean)) {
        console.log('   - Remove remaining mock/dummy data');
      }
      if (Object.values(missingElements).some(Boolean)) {
        console.log('   - Add missing restaurant information (logo, image, description, etc.)');
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
  
  await browser.close();
}

checkMenuDisplay();
