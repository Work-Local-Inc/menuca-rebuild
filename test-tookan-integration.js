/**
 * 🎯 TEST TOOKAN API INTEGRATION
 * 
 * Found "Send order to tookan api" setting - maybe A19 tablet gets orders through Tookan!
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testTookanIntegration() {
  console.log('🚚 TESTING TOOKAN API INTEGRATION');
  console.log('=================================');
  console.log('Restaurant: test stefan (ID: 800)');
  console.log('Theory: A19 tablet receives orders through Tookan delivery system');
  console.log('');

  // Test possible Tookan endpoints
  const TOOKAN_ENDPOINTS = [
    'https://api.tookanapp.com/v2/create_task',
    'https://tookan.menu.ca/api/orders',
    'https://menu.ca/tookan/create_order',
    'https://api.menu.ca/tookan/restaurant/800',
    'https://tookan-api.menu.ca/restaurant/800/orders'
  ];

  const testOrder = {
    restaurant_id: '800',
    restaurant_name: 'test stefan',
    device_id: 'A19',
    customer: {
      name: 'Claude Tookan Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    delivery_address: '600 terry fox drive, Ottawa, ON K2L4B6',
    items: [{
      name: '🚚 TOOKAN API TEST ORDER',
      price: 18.99,
      quantity: 1,
      special_instructions: 'Testing Tookan integration for A19 tablet'
    }],
    totals: {
      subtotal: 18.99,
      tax: 2.47,
      total: 21.46
    },
    order_type: 'delivery',
    delivery_instructions: '🎯 TOOKAN TEST: Checking if orders flow through Tookan API to A19 tablet'
  };

  for (const endpoint of TOOKAN_ENDPOINTS) {
    console.log(`📡 Testing Tookan endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MenuCA-Tookan-Test/1.0'
        },
        body: JSON.stringify(testOrder)
      });

      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}...`);
      
      if (response.ok && !responseText.includes('404') && !responseText.includes('Not Found')) {
        console.log('   🎉 POTENTIAL TOOKAN SUCCESS!');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Also test direct ping system
  console.log('📡 TESTING RESTAURANT PING SYSTEM');
  console.log('=================================');
  
  try {
    const pingData = {
      restaurant_id: '800',
      device_id: 'A19', 
      ping_type: 'new_order',
      order_data: testOrder
    };

    const pingResponse = await fetch('https://menu.ca/api/ping/restaurant/800', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MenuCA-Ping-Test/1.0'
      },
      body: JSON.stringify(pingData)
    });

    const pingText = await pingResponse.text();
    console.log(`📡 Ping result: ${pingResponse.status} - ${pingText.substring(0, 200)}...`);
    
  } catch (error) {
    console.log(`❌ Ping test failed: ${error.message}`);
  }

  console.log('\n📱 CHECK YOUR A19 TABLET FOR TOOKAN TEST ORDERS!');
  console.log('===============================================');
  console.log('Look for: "TOOKAN API TEST ORDER" ($21.46)');
  console.log('If this appears, orders flow through Tookan system!');
}

testTookanIntegration().catch(console.error);