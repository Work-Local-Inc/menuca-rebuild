/**
 * 🔍 DEBUG TABLET AUTHENTICATION
 * 
 * CRITICAL INSIGHT: System assigns random IDs, A19 might not exist!
 * Let's check what the tablet actually sends for authentication
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugTabletAuth() {
  console.log('🔍 DEBUGGING TABLET AUTHENTICATION');
  console.log('==================================');
  console.log('Problem: System keeps assigning random restaurant IDs');
  console.log('Theory: A19 might not be registered or needs different approach');
  console.log('');

  // Check if we can access the actual restaurant list
  console.log('📋 CHECKING AVAILABLE RESTAURANTS');
  console.log('=================================');

  const restaurantEndpoints = [
    'https://tablet.menu.ca/restaurants.php',
    'https://tablet.menu.ca/list.php', 
    'https://tablet.menu.ca/devices.php',
    'https://tablet.menu.ca/status.php',
    'https://aggregator-admin.menu.ca/restaurants',
    'https://menuadmin.menu.ca/devices'
  ];

  for (const endpoint of restaurantEndpoints) {
    try {
      console.log(`🧪 Testing: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
        }
      });

      const responseText = await response.text();
      console.log(`   📡 ${response.status} - ${responseText.length} chars`);
      
      if (responseText.includes('A19') || responseText.includes('james') || responseText.includes('dovercourt')) {
        console.log(`   🎯 FOUND A19 REFERENCE!`);
        console.log(`   📄 Content snippet: ${responseText.substring(0, 200)}...`);
      }
      
      if (response.ok && responseText.length > 50) {
        console.log(`   ✅ Valid endpoint with content`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('🎯 ALTERNATIVE APPROACH: GET ORDERS TEST');
  console.log('=======================================');
  console.log('Let\'s see what get_orders.php returns for existing restaurant IDs');
  
  const knownRestaurants = [
    'A19', 'P41', 'W42', 'P30', 'D65', 'H60',
    'C26', 'E25', 'B83', '800', 'test'
  ];

  for (const restaurantId of knownRestaurants) {
    try {
      console.log(`🧪 Testing restaurant: ${restaurantId}`);
      
      // Try with cookie authentication
      const cookies = `rt_designator=${restaurantId}; rt_key=689a${restaurantId}bef18a4`;
      
      const response = await fetch('https://tablet.menu.ca/get_orders.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
        },
        body: new URLSearchParams({
          sw_ver: 'MenuCA-Debug-Test',
          api_ver: '13'
        })
      });

      const responseText = await response.text();
      console.log(`   📡 ${response.status} - ${responseText || '(empty)'}`);
      
      if (responseText && responseText !== '{}' && responseText.length > 10) {
        console.log(`   🎯 FOUND ACTIVE RESTAURANT: ${restaurantId}`);
        console.log(`   📄 Orders data: ${responseText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('');
  console.log('💡 DEBUGGING CONCLUSIONS');
  console.log('========================');
  console.log('1. System assigns random IDs when A19 is not found');
  console.log('2. A19 might need physical tablet registration');
  console.log('3. Your tablet might be using a different ID internally');
  console.log('4. The "Device ID: A19" might be display-only, not auth ID');
  console.log('');
  console.log('🔧 NEXT STEPS:');
  console.log('- Check what ID your tablet actually authenticates with');
  console.log('- Look for tablet settings/preferences that show real auth ID');
  console.log('- Try connecting to tablet.menu.ca directly on your tablet browser');
}

debugTabletAuth().catch(console.error);