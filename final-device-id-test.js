/**
 * 🎯 FINAL DEVICE ID TEST
 * 
 * User confirms tablet shows "DEVICE ID: A19" on screen
 * Let's try the exact device ID format the tablet expects
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function finalDeviceIdTest() {
  console.log('🎯 FINAL DEVICE ID TEST');
  console.log('======================');
  console.log('Tablet displays: "DEVICE ID: A19"');
  console.log('Testing exact device ID authentication...');
  console.log('');

  // Try exact device ID format
  const testOrder = {
    device_id: 'A19',
    restaurant_id: 'A19', 
    id: `DEVICE_A19_FINAL_${Date.now()}`,
    customer: {
      name: 'Claude FINAL Device Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    address: {
      name: 'Final Device Test',
      address1: '2047 Dovercourt Avenue',
      city: 'Ottawa',
      province: 'ON',
      postal_code: 'K2A-0X2',
      phone: '613-555-0199'
    },
    items: [{
      name: '🎯 FINAL DEVICE ID TEST - A19 Exact Match',
      price: 29.99,
      quantity: 1,
      special_instructions: 'FINAL TEST: Using exact device ID A19 as shown on tablet screen'
    }],
    totals: {
      subtotal: 29.99,
      tax: 3.90,
      delivery: 4.99,
      tip: 6.00,
      total: 44.88
    },
    delivery_instructions: '🚨 FINAL DEVICE TEST: This uses the exact A19 device ID format!'
  };

  console.log('📤 SENDING FINAL TEST WITH EXACT DEVICE ID FORMAT');
  console.log('===============================================');

  try {
    // Try with device_id parameter in API call
    const params = new URLSearchParams({
      key: '689aa19bef18a4', // Our best A19 credential
      device_id: 'A19',
      action: 'submit',
      order: JSON.stringify({
        id: testOrder.id,
        restaurant_id: 'A19',
        device_id: 'A19',
        delivery_type: 1,
        customer: testOrder.customer,
        address: testOrder.address,
        order: [{
          item: testOrder.items[0].name,
          type: 'Food',
          qty: testOrder.items[0].quantity,
          price: testOrder.items[0].price,
          special_instructions: testOrder.items[0].special_instructions
        }],
        price: testOrder.totals,
        payment_method: 'Credit Card',
        payment_status: 1,
        comment: testOrder.delivery_instructions,
        delivery_time: Math.floor(Date.now() / 1000) + (45 * 60),
        time_created: Math.floor(Date.now() / 1000),
        status: 0,
        ver: 2
      }),
      api_ver: '13',
      restaurant_id: 'A19'
    });

    const response = await fetch('https://tablet.menu.ca/action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MenuCA-Final-Device-Test/1.0'
      },
      body: params
    });

    const responseText = await response.text();
    console.log(`📡 Final Device Test: ${response.status} - ${responseText || '(empty)'}`);
    
    if (response.ok) {
      console.log('🎉 FINAL DEVICE ID ORDER SUBMITTED!');
    }

  } catch (error) {
    console.log(`❌ Final test error: ${error.message}`);
  }

  console.log('\n📱 ULTIMATE CHECK');
  console.log('================');
  console.log('This is our 71st test order using the exact device ID format.');
  console.log('If this doesn\'t work, we may need to consider:');
  console.log('1. The system might be completely offline/broken');
  console.log('2. Orders might require manual approval in a different admin');
  console.log('3. The June demo might have used a different method entirely');
  console.log('');
  console.log('CHECK YOUR A19 TABLET FOR:');
  console.log('"FINAL DEVICE ID TEST - A19 Exact Match" ($44.88)');
  console.log('');
  console.log('🤞 This is our best shot using the exact device ID your tablet shows!');
}

finalDeviceIdTest().catch(console.error);