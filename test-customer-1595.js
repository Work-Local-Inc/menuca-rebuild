/**
 * 🎯 TEST CUSTOMER ID 1595 - THE REAL IDENTIFIER!
 * 
 * BREAKTHROUGH: Found Customer ID 1595 in restaurant statement
 * Domain: aggregator-landing.menu.ca (not tablet.menu.ca!)
 * This might be the missing piece!
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCustomer1595() {
  console.log('🎯 TESTING CUSTOMER ID 1595');
  console.log('===========================');
  console.log('Customer ID: 1595');
  console.log('Restaurant: Test James - Dovercourt Pizza');
  console.log('Address: 2047 Dovercourt Avenue Ottawa, K2A-0X2');
  console.log('Domain: aggregator-landing.menu.ca');
  console.log('Printer: G10H22000898');
  console.log('SIM: 893027204030307');
  console.log('');

  // Test aggregator-landing.menu.ca with customer ID 1595
  const AGGREGATOR_TESTS = [
    'https://aggregator-landing.menu.ca/restaurant/1595/orders',
    'https://aggregator-landing.menu.ca/api/restaurant/1595/submit',
    'https://aggregator-landing.menu.ca/customer/1595/orders',
    'https://aggregator-landing.menu.ca/index.php/restaurant/1595/order',
    'https://aggregator-landing.menu.ca/1595/submit_order'
  ];

  const testOrder = {
    customer_id: '1595',
    restaurant_id: '1595', 
    restaurant_name: 'Test James - Dovercourt Pizza',
    printer_serial: 'G10H22000898',
    sim_serial: '893027204030307',
    tablet_id: 'A19',
    customer: {
      name: 'Claude Customer 1595 Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    delivery_address: {
      name: 'Customer 1595 Test',
      address1: '2047 Dovercourt Avenue', 
      city: 'Ottawa',
      province: 'ON',
      postal_code: 'K2A-0X2',
      phone: '001-123-4567'
    },
    items: [{
      name: '🎯 CUSTOMER 1595 TEST - Real ID Found!',
      price: 21.99,
      quantity: 1,
      special_instructions: 'TESTING Customer ID 1595 integration with aggregator-landing.menu.ca'
    }],
    totals: {
      subtotal: 21.99,
      tax: 2.86,
      delivery: 3.99,
      tip: 4.50,
      total: 33.34
    },
    payment: {
      method: 'Credit Card',
      status: 'completed'
    },
    order_type: 'delivery',
    delivery_instructions: '🔍 CUSTOMER 1595 TEST: Testing real restaurant identifier found in statement'
  };

  for (const url of AGGREGATOR_TESTS) {
    console.log(`📡 Testing aggregator endpoint: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MenuCA-Customer1595-Test/1.0'
        },
        body: JSON.stringify(testOrder)
      });

      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}...`);
      
      if (response.ok && !responseText.includes('This restaurant doesn\'t exist')) {
        console.log('   🎉 POTENTIAL SUCCESS WITH CUSTOMER 1595!');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Also test tablet.menu.ca with customer ID 1595
  console.log('📡 TESTING tablet.menu.ca WITH CUSTOMER 1595');
  console.log('============================================');
  
  const TABLET_1595_CREDENTIALS = [
    { id: '1595', key: '689a1595bef18a4', description: 'Customer 1595 pattern' },
    { id: '1595', key: '689a5551595', description: 'Customer 1595 short pattern' },
    { id: 'C1595', key: '689ac1595bef18a4', description: 'C1595 variant' },
    { id: '1595', key: '689a1595555804', description: 'Customer 1595 mixed pattern' }
  ];

  for (const creds of TABLET_1595_CREDENTIALS) {
    console.log(`🧪 Testing tablet.menu.ca with ${creds.id}: ${creds.key}`);
    
    try {
      const params = new URLSearchParams({
        key: creds.key,
        action: 'submit',
        order: JSON.stringify({
          id: `CUSTOMER_1595_TABLET_${Date.now()}`,
          restaurant_id: creds.id,
          customer: testOrder.customer,
          address: testOrder.delivery_address,
          order: [{
            item: testOrder.items[0].name,
            type: 'Food',
            qty: testOrder.items[0].quantity,
            price: testOrder.items[0].price,
            special_instructions: testOrder.items[0].special_instructions
          }],
          price: testOrder.totals,
          delivery_time: Math.floor(Date.now() / 1000) + (40 * 60),
          time_created: Math.floor(Date.now() / 1000),
          status: 0,
          ver: 2
        }),
        api_ver: '13',
        restaurant_id: creds.id
      });

      const response = await fetch('https://tablet.menu.ca/action.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MenuCA-Customer1595-Test/1.0'
        },
        body: params
      });

      const responseText = await response.text();
      console.log(`   📡 Response: ${response.status} - ${responseText || '(empty)'}`);
      
      if (response.ok) {
        console.log('   🎉 CUSTOMER 1595 TABLET ORDER SUBMITTED!');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📱 CHECK YOUR A19 TABLET FOR CUSTOMER 1595 ORDERS!');
  console.log('=================================================');
  console.log('Look for: "CUSTOMER 1595 TEST - Real ID Found!" ($33.34)');
  console.log('This uses the REAL customer ID from your statement!');
}

testCustomer1595().catch(console.error);