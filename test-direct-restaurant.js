/**
 * 🎯 DIRECT RESTAURANT TEST
 * 
 * Since we know your exact restaurant details, let's try sending an order
 * using the restaurant information directly - maybe there's a different API pattern
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Your confirmed restaurant details
const RESTAURANT_INFO = {
  name: 'Test James - Dovercourt Pizza',
  address: '2047 Dovercourt Avenue Ottawa, QC K2A-0X2', 
  phone: '(001) 123-4567',
  tablet_id: 'A19'
};

async function testDirectOrder() {
  console.log('🎯 DIRECT RESTAURANT ORDER TEST');
  console.log('==============================');
  console.log('Restaurant:', RESTAURANT_INFO.name);
  console.log('Address:', RESTAURANT_INFO.address);  
  console.log('Tablet ID:', RESTAURANT_INFO.tablet_id);
  console.log('');

  const testOrder = {
    id: `DIRECT_A19_${Date.now()}`,
    restaurant: RESTAURANT_INFO.name,
    restaurant_address: RESTAURANT_INFO.address,
    tablet_device: RESTAURANT_INFO.tablet_id,
    customer: {
      name: 'Claude Direct Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    items: [{
      name: '🎯 DIRECT A19 TEST PIZZA',
      price: 18.99,
      quantity: 1,
      special_instructions: 'DIRECT ORDER TEST for A19 tablet at Test James Dovercourt Pizza'
    }],
    totals: {
      subtotal: 18.99,
      tax: 2.47,
      total: 21.46
    },
    delivery_address: RESTAURANT_INFO.address,
    delivery_instructions: '🔍 TESTING DIRECT ORDER DELIVERY to A19 tablet - Test James Dovercourt Pizza'
  };

  // Try various possible API endpoints that might work
  const POSSIBLE_APIS = [
    // Maybe there's a main menu.ca API
    'https://menu.ca/api/orders',
    'https://api.menu.ca/orders', 
    'https://www.menu.ca/api/submit',
    
    // Maybe internal/private APIs
    'https://internal.menu.ca/orders',
    'https://tablet-api.menu.ca/orders',
    'https://restaurant.menu.ca/orders',
    
    // Maybe it uses the restaurant name directly
    'https://dovercourt.menu.ca/orders',
    'https://james.menu.ca/orders',
    'https://test-james.menu.ca/orders',
    
    // Try the aggregator with correct format
    'https://aggregator-landing.menu.ca/restaurant/1595/orders',
    'https://aggregator-landing.menu.ca/api/restaurant/orders',
  ];

  console.log('🧪 TESTING POSSIBLE API ENDPOINTS');
  console.log('=================================');

  for (const apiUrl of POSSIBLE_APIS) {
    console.log(`📡 Testing: ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MenuCA-Direct-Test/1.0'
        },
        body: JSON.stringify(testOrder)
      });

      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      
      if (response.status !== 404) {
        console.log(`   Response: ${responseText.substring(0, 150)}...`);
        
        if (response.ok && responseText && !responseText.includes('404') && !responseText.includes('Not Found')) {
          console.log('   🎉 POTENTIALLY SUCCESSFUL SUBMISSION!');
        }
      } else {
        console.log('   ❌ Not found');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log('📱 CHECK YOUR A19 TABLET NOW!');
  console.log('=============================');
  console.log('Look for: "DIRECT A19 TEST PIZZA" order ($21.46)');
  console.log('If you see this order, we found the right API!');
}

// Also try a WiFi network approach - maybe the tablet connects locally
async function testLocalNetwork() {
  console.log('\n🏠 LOCAL NETWORK TEST');
  console.log('====================');
  console.log('Maybe your A19 tablet connects to a local server...');
  console.log('');

  // Common local network APIs for restaurant systems
  const LOCAL_IPS = [
    'http://192.168.1.1/api/orders',
    'http://192.168.0.1/api/orders', 
    'http://192.168.1.100/menu/orders',
    'http://192.168.0.100/menu/orders',
    'http://localhost:8080/api/orders',
    'http://127.0.0.1:8080/api/orders'
  ];

  for (const localUrl of LOCAL_IPS) {
    console.log(`📡 Testing local: ${localUrl}`);
    
    try {
      const response = await fetch(localUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tablet_id: 'A19',
          restaurant: 'Test James - Dovercourt Pizza',
          test_order: 'Local network test'
        }),
        timeout: 2000 // Quick timeout for local network
      });

      console.log(`   Status: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`   ❌ ${error.message.includes('timeout') ? 'Timeout' : 'Not accessible'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function main() {
  await testDirectOrder();
  await testLocalNetwork();
  
  console.log('\n🤔 IF NO ORDERS APPEARED:');
  console.log('=========================');
  console.log('Your A19 tablet might be using:');
  console.log('1. A custom/private MenuCA server');
  console.log('2. A local network connection'); 
  console.log('3. A completely different API system');
  console.log('4. Special authentication we haven\'t discovered');
  console.log('');
  console.log('💡 Next step: Check if MenuCA app has any visible settings/info');
}

main().catch(console.error);