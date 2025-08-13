/**
 * 🎯 TEST MULTIPLE RESTAURANTS - Find which one maps to A19 tablet
 * 
 * We'll send test orders to restaurants that might be yours:
 * - C26 (james): 689a5552ca164
 * - E25 (dovercourt): 689a555300f0d  
 * - B83 (test): 689a555330512
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Potential restaurants that might map to your A19 tablet
const POTENTIAL_RESTAURANTS = [
  {
    id: 'C26',
    key: '689a5552ca164',
    name: 'Found by searching "james"',
    reason: 'Your restaurant has "James" in the name'
  },
  {
    id: 'E25', 
    key: '689a555300f0d',
    name: 'Found by searching "dovercourt"',
    reason: 'Your restaurant has "Dovercourt" in the name'
  },
  {
    id: 'B83',
    key: '689a555330512', 
    name: 'Found by searching "test"',
    reason: 'Your restaurant has "test" in the name'
  }
];

async function testRestaurant(restaurant, orderNumber) {
  const testOrder = {
    id: `A19_TEST_${orderNumber}_${Date.now()}`,
    customer: {
      name: `Claude Test ${orderNumber}`,
      phone: '613-555-0100', 
      email: 'claude@menuca.com'
    },
    address: {
      name: `Claude Test ${orderNumber}`,
      address1: '100 Test Street',
      address2: `Suite ${orderNumber}`,
      city: 'Ottawa',
      province: 'ON', 
      postal_code: 'K1A 0H3',
      phone: '613-555-0100'
    },
    items: [
      {
        id: 'test_pizza',
        name: `Test Pizza #${orderNumber}`,
        price: 19.99,
        quantity: 1,
        special_instructions: `🔥 URGENT: This is test order #${orderNumber} for A19 tablet integration - Restaurant ${restaurant.id}`
      }
    ],
    totals: {
      subtotal: 19.99,
      tax: 2.60,
      delivery: 2.99,
      tip: 3.00,
      total: 28.58
    },
    payment: {
      method: 'Credit Card',
      status: 'succeeded',
      transaction_id: `pi_test_${orderNumber}_${Date.now()}`
    },
    delivery_instructions: `🧪 INTEGRATION TEST #${orderNumber}: Checking if restaurant ${restaurant.id} (${restaurant.name}) maps to A19 tablet. Please ignore this test order!`,
    restaurant_id: restaurant.id
  };

  console.log(`\n🎯 TESTING RESTAURANT ${restaurant.id} (${restaurant.name})`);
  console.log('========================================');
  console.log(`Reason: ${restaurant.reason}`);
  console.log(`Order ID: ${testOrder.id}`);
  console.log(`rt_key: ${restaurant.key}`);

  try {
    // Try to inject order directly to tablet.menu.ca
    const params = new URLSearchParams({
      key: restaurant.key,
      action: 'submit',
      order: JSON.stringify({
        id: testOrder.id,
        restaurant_id: restaurant.id,
        delivery_type: 1,
        customer: testOrder.customer,
        address: testOrder.address,
        order: testOrder.items.map(item => ({
          item: item.name,
          type: 'Food',
          qty: item.quantity,
          price: item.price,
          special_instructions: item.special_instructions
        })),
        price: {
          subtotal: testOrder.totals.subtotal,
          tax: testOrder.totals.tax,
          delivery: testOrder.totals.delivery,
          tip: testOrder.totals.tip,
          total: testOrder.totals.total,
          taxes: { 'HST': testOrder.totals.tax }
        },
        payment_method: testOrder.payment.method,
        payment_status: 1,
        comment: testOrder.delivery_instructions,
        delivery_time: Math.floor(Date.now() / 1000) + (30 * 60),
        time_created: Math.floor(Date.now() / 1000),
        status: 0,
        ver: 2
      }),
      api_ver: '13',
      restaurant_id: restaurant.id
    });

    const response = await fetch('https://tablet.menu.ca/action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MenuCA-A19-Test/1.0'
      },
      body: params
    });

    const responseText = await response.text();
    
    console.log(`📡 Response Status: ${response.status}`);
    console.log(`📄 Response Body: ${responseText || '(empty)'}`);

    // Check if order appears in queue
    console.log('🔍 Checking queue...');
    
    const queueParams = new URLSearchParams({
      key: restaurant.key,
      sw_ver: 'MenuCA-A19-Test',
      api_ver: '13'
    });

    const queueResponse = await fetch('https://tablet.menu.ca/get_orders.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MenuCA-A19-Test/1.0'
      },
      body: queueParams
    });

    const queueText = await queueResponse.text();
    console.log(`📋 Queue Response: ${queueText}`);
    
    if (queueText && queueText !== '{}') {
      console.log(`🎉 FOUND ORDERS IN QUEUE FOR ${restaurant.id}!`);
      try {
        const queueData = JSON.parse(queueText);
        console.log('📊 Queue Data:', JSON.stringify(queueData, null, 2));
      } catch (e) {
        console.log('📊 Raw Queue Data:', queueText);
      }
    }

    return {
      restaurant: restaurant,
      success: response.ok,
      responseText: responseText,
      queueData: queueText
    };

  } catch (error) {
    console.log(`❌ Error testing ${restaurant.id}:`, error.message);
    return {
      restaurant: restaurant,
      success: false,
      error: error.message
    };
  }
}

async function testAllRestaurants() {
  console.log('🧪 TESTING ALL POTENTIAL RESTAURANTS FOR A19 TABLET');
  console.log('==================================================');
  console.log('Your tablet device ID: A19');
  console.log('Your restaurant name: test James Dovercourt');
  console.log('');
  console.log('Testing 3 restaurants that might match your tablet...');

  const results = [];

  for (let i = 0; i < POTENTIAL_RESTAURANTS.length; i++) {
    const restaurant = POTENTIAL_RESTAURANTS[i];
    const result = await testRestaurant(restaurant, i + 1);
    results.push(result);
    
    // Wait 2 seconds between tests
    if (i < POTENTIAL_RESTAURANTS.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n📊 SUMMARY OF ALL TESTS');
  console.log('=======================');
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. Restaurant ${result.restaurant.id} (${result.restaurant.name}):`);
    console.log(`   Status: ${result.success ? '✅ API responded OK' : '❌ Failed'}`);
    console.log(`   Queue: ${result.queueData === '{}' ? 'Empty' : 'Has data!'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n🎯 CHECK YOUR A19 TABLET NOW!');
  console.log('=============================');
  console.log('Look for these test orders:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. A19_TEST_${index + 1}_* - Test Pizza #${index + 1} ($28.58)`);
  });
  console.log('');
  console.log('If you see ANY of these orders on your tablet:');
  console.log('🎉 That restaurant ID is the one connected to your A19 tablet!');
  console.log('🖨️ The order should also trigger your NETUM printer!');
  console.log('');
  console.log('Which order(s) do you see on your tablet?');
}

testAllRestaurants().catch(console.error);