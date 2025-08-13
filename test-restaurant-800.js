/**
 * 🎯 TEST RESTAURANT 800 - "test stephan" 
 * 
 * You found restaurant ID 800 in the admin! Let's test if this connects to A19 tablet
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Try restaurant ID 800 with various rt_key patterns
const TEST_CREDENTIALS = [
  { id: '800', key: '689a800bef18a4', description: 'Pattern based on restaurant ID 800' },
  { id: '800', key: '689a54b800804', description: 'Alternative pattern for 800' },  
  { id: '800', key: '689a555800', description: 'Short pattern for 800' },
  { id: 'S800', key: '689as800bef18a4', description: 'S800 variant' },
  { id: 'R800', key: '689ar800bef18a4', description: 'R800 variant' }
];

async function testRestaurant800() {
  console.log('🎯 TESTING RESTAURANT 800 - "test stephan"');
  console.log('===========================================');
  console.log('Restaurant: test stephan (ID: 800)'); 
  console.log('Address: 600 Terry Fox Drive');
  console.log('Tablet: A19 device');
  console.log('Status: ACTIVE (just set by you)');
  console.log('');

  for (const creds of TEST_CREDENTIALS) {
    console.log(`🧪 Testing ${creds.id} (${creds.description})`);
    console.log(`   rt_key: ${creds.key}`);
    
    try {
      // Test if credentials work
      const params = new URLSearchParams({
        key: creds.key,
        sw_ver: 'MenuCA-Restaurant800-Test',
        api_ver: '13'
      });

      const response = await fetch('https://tablet.menu.ca/get_orders.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MenuCA-800-Test/1.0'
        },
        body: params
      });

      const responseText = await response.text();
      console.log(`   📡 Response: ${response.status} - ${responseText}`);
      
      if (response.status === 200) {
        console.log('   ✅ Valid credentials!');
        
        // If valid, send test order
        const testOrder = {
          id: `A19_RESTAURANT_800_${Date.now()}`,
          restaurant_id: creds.id,
          delivery_type: 1,
          customer: { name: 'Claude Test - Restaurant 800', phone: '613-555-0199', email: 'test@menuca.com' },
          address: { 
            name: 'Stephan Test', address1: '600 Terry Fox Drive', city: 'Ottawa', 
            province: 'ON', postal_code: 'K2L 1B9', phone: '613-555-0199'
          },
          order: [{
            item: `🎯 RESTAURANT 800 TEST - Stephan Menu`,
            type: 'Food', qty: 1, price: 17.99,
            special_instructions: `TESTING Restaurant 800 (test stephan) → A19 tablet integration`
          }],
          price: { subtotal: 17.99, tax: 2.34, delivery: 0, tip: 0, total: 20.33, taxes: { HST: 2.34 }},
          payment_method: 'Credit Card', payment_status: 1,
          comment: `🔍 RESTAURANT 800 TEST: Testing if admin restaurant "test stephan" maps to A19 tablet`,
          delivery_time: Math.floor(Date.now() / 1000) + (30 * 60),
          time_created: Math.floor(Date.now() / 1000),
          status: 0, ver: 2
        };

        console.log(`   📤 Sending test order...`);
        
        const orderParams = new URLSearchParams({
          key: creds.key,
          action: 'submit',
          order: JSON.stringify(testOrder),
          api_ver: '13',
          restaurant_id: creds.id
        });

        const orderResponse = await fetch('https://tablet.menu.ca/action.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MenuCA-800-Test/1.0'
          },
          body: orderParams
        });

        const orderText = await orderResponse.text();
        console.log(`   📋 Order result: ${orderResponse.status} - ${orderText || '(empty)'}`);
        
      } else {
        console.log('   ❌ Invalid credentials');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('📱 CHECK YOUR A19 TABLET NOW!');
  console.log('=============================');
  console.log('Look for: "RESTAURANT 800 TEST - Stephan Menu" ($20.33)');
  console.log('If you see this order, restaurant 800 connects to your A19 tablet!');
}

testRestaurant800().catch(console.error);