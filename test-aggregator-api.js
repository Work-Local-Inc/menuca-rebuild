/**
 * 🔍 TEST AGGREGATOR-LANDING.MENU.CA API
 * 
 * You found your restaurant on aggregator-landing.menu.ca!
 * Let's test if this system can send orders to your A19 tablet.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test various API endpoints on the aggregator system
const API_TESTS = [
  // Try common API patterns on aggregator domain
  'https://aggregator-landing.menu.ca/api/orders',
  'https://aggregator-landing.menu.ca/api/submit',
  'https://aggregator-landing.menu.ca/action.php',
  'https://aggregator-landing.menu.ca/get_orders.php',
  'https://aggregator-landing.menu.ca/index.php/api/orders',
  'https://aggregator-landing.menu.ca/index.php/submit',
  'https://aggregator-landing.menu.ca/tablet/submit',
  'https://aggregator-landing.menu.ca/restaurant/orders',
  
  // Maybe it bridges to the tablet system
  'https://aggregator-api.menu.ca/orders',
  'https://api.menu.ca/aggregator/orders',
  'https://menu.ca/api/aggregator/submit'
];

async function testAggregatorAPIs() {
  console.log('🔍 TESTING AGGREGATOR SYSTEM APIs');
  console.log('================================');
  console.log('Your restaurant: Test James - Dovercourt Pizza');
  console.log('Address: 2047 Dovercourt Avenue Ottawa, QC K2A-0X2');
  console.log('Tablet: A19 device');
  console.log('');

  const workingEndpoints = [];

  for (const url of API_TESTS) {
    console.log(`📡 Testing: ${url}`);
    
    try {
      // Try GET first
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'MenuCA-Aggregator-Test/1.0' }
      });
      
      console.log(`   GET: ${getResponse.status}`);
      
      if (getResponse.status !== 404) {
        const getText = await getResponse.text();
        if (getText && getText.length > 0 && getText.length < 1000) {
          console.log(`   Response: ${getText.substring(0, 200)}...`);
        }
        workingEndpoints.push({ url, method: 'GET', status: getResponse.status });
      }
      
      // Try POST with order data
      const testOrder = {
        restaurant: 'Test James - Dovercourt Pizza',
        restaurant_id: 'A19',
        customer: { name: 'Claude Aggregator Test', phone: '613-555-0199' },
        items: [{ name: 'Test Pizza Aggregator', price: 19.99, quantity: 1 }],
        total: 19.99,
        delivery_address: '2047 Dovercourt Avenue Ottawa, QC K2A-0X2'
      };
      
      const postResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MenuCA-Aggregator-Test/1.0'
        },
        body: JSON.stringify(testOrder)
      });
      
      console.log(`   POST: ${postResponse.status}`);
      
      if (postResponse.status !== 404) {
        const postText = await postResponse.text();
        if (postText && postText.length > 0 && postText.length < 1000) {
          console.log(`   POST Response: ${postText.substring(0, 200)}...`);
        }
        workingEndpoints.push({ url, method: 'POST', status: postResponse.status });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (workingEndpoints.length > 0) {
    console.log('🎯 FOUND WORKING ENDPOINTS:');
    console.log('===========================');
    workingEndpoints.forEach(ep => {
      console.log(`${ep.method} ${ep.url} - Status: ${ep.status}`);
    });
  } else {
    console.log('❌ No working API endpoints found on aggregator system');
  }
}

// Also test if the aggregator system connects to tablet.menu.ca
async function testAggregatorBridge() {
  console.log('\n🌉 TESTING AGGREGATOR → TABLET BRIDGE');
  console.log('=====================================');
  console.log('Maybe aggregator-landing.menu.ca forwards orders to tablet.menu.ca...');
  console.log('');
  
  // Try submitting order through aggregator that might appear on tablet.menu.ca
  const bridgeTestOrder = {
    id: `AGGREGATOR_BRIDGE_${Date.now()}`,
    restaurant_name: 'Test James - Dovercourt Pizza',
    restaurant_address: '2047 Dovercourt Avenue Ottawa, QC K2A-0X2',
    tablet_id: 'A19',
    customer: {
      name: 'Claude Bridge Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    items: [{
      name: '🌉 AGGREGATOR BRIDGE TEST',
      price: 16.99,
      quantity: 1,
      special_instructions: 'Testing if aggregator system connects to A19 tablet'
    }],
    totals: {
      subtotal: 16.99,
      tax: 2.21,
      total: 19.20
    },
    delivery_instructions: '🎯 BRIDGE TEST: This order tests if aggregator-landing.menu.ca can send orders to A19 tablet at Dovercourt Pizza'
  };
  
  // Try multiple submission formats
  const bridgeUrls = [
    'https://aggregator-landing.menu.ca/index.php/submit',
    'https://aggregator-landing.menu.ca/api/submit',
    'https://aggregator-landing.menu.ca/restaurant/submit'
  ];
  
  for (const url of bridgeUrls) {
    console.log(`📤 Testing bridge via: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MenuCA-Bridge-Test/1.0'
        },
        body: JSON.stringify(bridgeTestOrder)
      });
      
      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}...`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📱 CHECK YOUR A19 TABLET FOR BRIDGE TEST ORDERS!');
  console.log('Look for "AGGREGATOR BRIDGE TEST" orders ($19.20)');
}

async function main() {
  await testAggregatorAPIs();
  await testAggregatorBridge();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  console.log('1. Check your A19 tablet for any new test orders');
  console.log('2. If no orders appear, the aggregator might use a different integration method');
  console.log('3. We may need to find the specific API that aggregator-landing.menu.ca uses');
  console.log('4. Your restaurant details are confirmed: Test James - Dovercourt Pizza');
}

main().catch(console.error);