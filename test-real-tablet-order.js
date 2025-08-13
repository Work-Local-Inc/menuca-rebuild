/**
 * 🎯 REAL TABLET TEST - Send order to your Samsung tablet
 * 
 * This creates a real order that should appear on your tablet app
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Create a realistic test order that should show up on your tablet
const realTestOrder = {
  id: `REAL_ORDER_${Date.now()}`,
  customer: {
    name: 'Claude AI Test',
    phone: '613-555-0199', 
    email: 'claude@menuca.com'
  },
  address: {
    name: 'Claude AI',
    address1: '100 Sparks Street',
    address2: 'Suite 800',
    city: 'Ottawa',
    province: 'ON', 
    postal_code: 'K1A 0H3',
    phone: '613-555-0199'
  },
  items: [
    {
      id: 'large_pepperoni_pizza',
      name: 'Large Pepperoni Pizza',
      price: 24.99,
      quantity: 1,
      special_instructions: 'TABLET TEST - Please ignore this test order'
    },
    {
      id: 'wings_medium',
      name: 'Chicken Wings (10pc) - Medium',
      price: 13.99,
      quantity: 1, 
      special_instructions: 'This is a system integration test'
    }
  ],
  totals: {
    subtotal: 38.98,
    tax: 5.07,
    delivery: 2.99,
    tip: 6.00,
    total: 53.04
  },
  payment: {
    method: 'Credit Card',
    status: 'succeeded',
    transaction_id: `pi_test_${Date.now()}`
  },
  delivery_instructions: '🧪 SYSTEM TEST - This is Claude testing the tablet integration! Please ignore this order.',
  restaurant_id: 'P41' // Using the working restaurant we found
};

async function testRealTabletOrder() {
  console.log('🎯 SENDING REAL ORDER TO YOUR TABLET');
  console.log('====================================');
  console.log('📱 This order should appear on your Samsung tablet running MenuCA app');
  console.log('🖨️ It should also trigger the NETUM printer if connected');
  console.log('');
  
  console.log('📋 Order Details:');
  console.log(`   Order ID: ${realTestOrder.id}`);
  console.log(`   Customer: ${realTestOrder.customer.name}`);
  console.log(`   Phone: ${realTestOrder.customer.phone}`);
  console.log(`   Total: $${realTestOrder.totals.total}`);
  console.log(`   Items: ${realTestOrder.items.length}`);
  realTestOrder.items.forEach((item, i) => {
    console.log(`     ${i + 1}. ${item.quantity}x ${item.name} ($${item.price})`);
    if (item.special_instructions) {
      console.log(`        Instructions: ${item.special_instructions}`);
    }
  });
  console.log(`   Delivery Instructions: ${realTestOrder.delivery_instructions}`);
  console.log('');

  try {
    console.log('📡 Sending to MenuCA backend...');
    
    const response = await fetch('http://localhost:3001/api/inject-tablet-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MenuCA-Real-Tablet-Test/1.0'
      },
      body: JSON.stringify({ order: realTestOrder })
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    const result = await response.json();
    console.log('📄 Backend Response:');
    console.log(JSON.stringify(result, null, 2));

    console.log('');
    console.log('🔍 WHAT TO CHECK ON YOUR TABLET:');
    console.log('================================');
    console.log('1. 📱 Open the MenuCA app on your Samsung tablet');
    console.log('2. 👀 Look for a new order with ID:', realTestOrder.id);
    console.log('3. 📋 The order should show:');
    console.log('   - Customer: Claude AI Test');
    console.log('   - Phone: 613-555-0199');
    console.log('   - Large Pepperoni Pizza ($24.99)');
    console.log('   - Chicken Wings 10pc Medium ($13.99)');
    console.log('   - Total: $53.04');
    console.log('   - Special note about this being a test');
    console.log('4. 🖨️ If NETUM printer is connected, it should print automatically');
    console.log('5. ✅ If you see the order, our integration is working!');
    console.log('');
    
    if (response.ok) {
      console.log('✅ Order successfully sent to tablet system!');
      console.log('🕐 Give it 10-30 seconds to appear on the tablet...');
      
      // Poll the queue to see if we can detect the order
      console.log('');
      console.log('🔄 Checking if order appears in tablet queue...');
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`📡 Queue check attempt ${attempt}...`);
        
        try {
          const queueResponse = await fetch('https://tablet.menu.ca/get_orders.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'MenuCA-Integration-Test/1.0'
            },
            body: new URLSearchParams({
              key: '689a41bef18a4',
              sw_ver: 'MenuCA-Test-1.0',
              api_ver: '13'
            })
          });
          
          const queueText = await queueResponse.text();
          console.log(`   Response: ${queueText}`);
          
          if (queueText && queueText !== '{}') {
            console.log('🎉 FOUND SOMETHING IN QUEUE! Order might be there!');
            try {
              const queueData = JSON.parse(queueText);
              console.log('📊 Queue Data:', JSON.stringify(queueData, null, 2));
            } catch (e) {
              console.log('📊 Raw Queue Data:', queueText);
            }
            break;
          } else {
            console.log('   Queue still empty...');
            if (attempt < 3) {
              console.log('   Waiting 5 seconds...');
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
          
        } catch (queueError) {
          console.log(`   Queue check failed: ${queueError.message}`);
        }
      }
      
    } else {
      console.log('❌ Failed to send order to tablet system');
    }

    console.log('');
    console.log('📱 CHECK YOUR TABLET NOW!');
    console.log('=========================');
    console.log('Does the order appear in your MenuCA tablet app?');
    console.log('- If YES: 🎉 Integration working perfectly!');
    console.log('- If NO: 🔧 We may need to adjust the order format');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('- Development server is running (npm run dev)');
    console.log('- You have internet connection to tablet.menu.ca');
    console.log('- Your tablet is connected and running MenuCA app');
  }
}

// Run the test
testRealTabletOrder().then(() => {
  console.log('🏁 Test complete - check your tablet!');
}).catch(console.error);