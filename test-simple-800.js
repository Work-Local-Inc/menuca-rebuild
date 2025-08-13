/**
 * 🎯 TEST SIMPLE RESTAURANT 800 APPROACH
 * 
 * Maybe A19 tablet just uses restaurant ID 800 with simple/standard authentication
 * No complex rt_keys needed!
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSimpleRestaurant800() {
  console.log('🎯 TESTING SIMPLE RESTAURANT 800 AUTHENTICATION');
  console.log('=============================================');
  console.log('Restaurant ID: 800');
  console.log('Name: test stefan');
  console.log('Address: 600 terry fox drive');
  console.log('Tablet: A19');
  console.log('');

  // Try simple authentication methods
  const SIMPLE_METHODS = [
    {
      name: 'Restaurant ID Only',
      params: { restaurant_id: '800', device_id: 'A19' }
    },
    {
      name: 'Domain Based Auth', 
      params: { domain: 'my_domain', restaurant_id: '800', device: 'A19' }
    },
    {
      name: 'Session Based',
      params: { session_id: '800_A19', restaurant: '800' }
    },
    {
      name: 'Simple Token',
      params: { token: '800', device: 'A19', auth: 'simple' }
    }
  ];

  for (const method of SIMPLE_METHODS) {
    console.log(`🧪 Testing: ${method.name}`);
    
    try {
      // Try get_orders first
      const params = new URLSearchParams(method.params);
      
      const response = await fetch('https://tablet.menu.ca/get_orders.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MenuCA-Simple-Test/1.0'
        },
        body: params
      });

      const responseText = await response.text();
      console.log(`   📡 Response: ${response.status} - ${responseText.substring(0, 100)}...`);
      
      // If we get anything other than empty {}, try sending an order
      if (response.status === 200 && responseText !== '{}') {
        console.log('   🎉 Got non-empty response! Trying order submission...');
        
        const testOrder = {
          id: `SIMPLE_800_${Date.now()}`,
          restaurant_id: '800',
          device_id: 'A19',
          customer: { name: 'Claude Simple Test', phone: '613-555-0199' },
          items: [{ name: '🎯 SIMPLE 800 TEST', price: 14.99, quantity: 1 }],
          total: 14.99,
          address: '600 terry fox drive'
        };

        const orderResponse = await fetch('https://tablet.menu.ca/action.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MenuCA-Simple-Test/1.0'
          },
          body: JSON.stringify({ ...method.params, order: testOrder, action: 'submit' })
        });

        const orderText = await orderResponse.text();
        console.log(`   📋 Order: ${orderResponse.status} - ${orderText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('📱 CHECK YOUR A19 TABLET FOR "SIMPLE 800 TEST" ORDERS!');
  console.log('====================================================');
  
  // Also try the aggregator system with restaurant 800
  console.log('\n🌉 TESTING AGGREGATOR WITH RESTAURANT 800');
  console.log('=========================================');
  
  try {
    const aggregatorOrder = {
      restaurant_id: '800',
      restaurant_name: 'test stefan',
      device_id: 'A19',
      customer: { name: 'Claude Aggregator 800', phone: '613-555-0199' },
      items: [{ name: '🌉 AGGREGATOR 800 TEST', price: 16.99, quantity: 1 }],
      total: 16.99,
      address: '600 terry fox drive'
    };

    const aggResponse = await fetch('https://aggregator-landing.menu.ca/restaurant/800/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MenuCA-Aggregator-Test/1.0'
      },
      body: JSON.stringify(aggregatorOrder)
    });

    const aggText = await aggResponse.text();
    console.log(`📡 Aggregator: ${aggResponse.status} - ${aggText.substring(0, 150)}...`);
    
  } catch (error) {
    console.log(`❌ Aggregator test failed: ${error.message}`);
  }
}

testSimpleRestaurant800().catch(console.error);