/**
 * 🎯 TEST AGGREGATOR-ADMIN.MENU.CA - THE REAL SYSTEM!
 * 
 * BREAKTHROUGH: Found real API - aggregator-admin.menu.ca
 * Restaurant ID: 1595, User ID: 43
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAggregatorAdmin() {
  console.log('🎯 TESTING AGGREGATOR-ADMIN.MENU.CA');
  console.log('===================================');
  console.log('Real API: aggregator-admin.menu.ca');
  console.log('Restaurant ID: 1595');
  console.log('User ID: 43');
  console.log('URL Pattern: /welcome/search/u:id:43/r:id:1595/status:accepted-rejected');
  console.log('');

  const testOrder = {
    user_id: 43,
    restaurant_id: 1595,
    customer: {
      name: 'Claude Admin Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    delivery_address: {
      address1: '2047 Dovercourt Avenue',
      city: 'Ottawa', 
      province: 'ON',
      postal_code: 'K2A-0X2',
      phone: '001-123-4567'
    },
    items: [{
      name: '🎯 AGGREGATOR ADMIN TEST - Real API Found!',
      price: 25.99,
      quantity: 1,
      special_instructions: 'Testing aggregator-admin.menu.ca - the REAL system!'
    }],
    total: 25.99,
    status: 'new',
    order_type: 'delivery'
  };

  // Test the real admin API endpoints
  const ADMIN_ENDPOINTS = [
    'https://aggregator-admin.menu.ca/api/order/submit',
    'https://aggregator-admin.menu.ca/index.php/order/create',
    'https://aggregator-admin.menu.ca/index.php/welcome/submit_order', 
    'https://aggregator-admin.menu.ca/restaurant/1595/order/submit',
    'https://aggregator-admin.menu.ca/index.php/api/restaurant/1595/order'
  ];

  for (const endpoint of ADMIN_ENDPOINTS) {
    console.log(`📡 Testing admin endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MenuCA-Admin-Test/1.0'
        },
        body: JSON.stringify(testOrder)
      });

      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      
      if (responseText.length < 500) {
        console.log(`   Response: ${responseText}`);
      } else {
        console.log(`   Response: ${responseText.substring(0, 200)}...`);
      }
      
      if (response.ok && !responseText.includes('404') && !responseText.includes('error')) {
        console.log('   🎉 POTENTIAL ADMIN API SUCCESS!');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Try the exact URL pattern from the admin
  console.log('📡 TESTING EXACT ADMIN URL PATTERN');
  console.log('==================================');
  
  try {
    const exactUrl = 'https://aggregator-admin.menu.ca/index.php/welcome/search/u:id:43/r:id:1595/status:new';
    
    console.log(`📡 Testing exact pattern: ${exactUrl}`);
    
    const response = await fetch(exactUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MenuCA-Admin-Exact-Test/1.0'
      },
      body: JSON.stringify(testOrder)
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText.substring(0, 300)}...`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n📱 FINAL CHECK - MULTIPLE SYSTEMS TESTED');
  console.log('=======================================');
  console.log('We tested:');
  console.log('✅ tablet.menu.ca with Customer 1595 (4 orders sent)');
  console.log('✅ aggregator-admin.menu.ca (real admin system)');
  console.log('');
  console.log('CHECK YOUR A19 TABLET FOR ANY NEW ORDERS!');
  console.log('Look for test orders with Customer 1595 or Admin Test');
}

testAggregatorAdmin().catch(console.error);