/**
 * 🎯 TEST WEB ORDER TRIGGER
 * 
 * Maybe we need to simulate a real web order through the MenuCA system
 * instead of direct API calls
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebOrderTrigger() {
  console.log('🌐 TESTING WEB ORDER TRIGGER');
  console.log('============================');
  console.log('Theory: A19 tablet only receives orders placed through the actual MenuCA web system');
  console.log('Restaurant: test stefan (800)');
  console.log('Domain: my_domain.menu.ca');
  console.log('');

  // Try to simulate placing an order through the web interface
  const WEB_ORDER_ENDPOINTS = [
    'https://menuadmin.menu.ca/api/order/submit',
    'https://menuadmin.menu.ca/?p=orders&action=create',
    'https://menu.ca/restaurant/800/order/submit',
    'https://menu.ca/api/restaurant/800/order',
    'https://order.menu.ca/restaurant/800/submit'
  ];

  const webOrder = {
    restaurant_id: '800',
    restaurant_name: 'test stefan',
    customer: {
      name: 'Claude Web Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    delivery_address: {
      address1: '600 terry fox drive',
      city: 'Ottawa',
      province: 'ON',
      postal_code: 'K2L4B6'
    },
    items: [{
      id: 'web_test_item',
      name: '🌐 WEB ORDER TEST',
      price: 19.99,
      quantity: 1,
      instructions: 'Testing web order trigger for A19 tablet'
    }],
    payment: {
      method: 'credit_card',
      total: 19.99
    },
    delivery_type: 'delivery',
    order_source: 'web',
    notes: '🎯 WEB TEST: Checking if web orders trigger A19 tablet notifications'
  };

  for (const endpoint of WEB_ORDER_ENDPOINTS) {
    console.log(`📡 Testing web endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://menuadmin.menu.ca/'
        },
        body: JSON.stringify(webOrder)
      });

      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}...`);
      
      if (response.ok && !responseText.includes('404') && !responseText.includes('error')) {
        console.log('   🎉 POTENTIAL WEB ORDER SUCCESS!');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Try the email notification system
  console.log('📧 TESTING EMAIL ORDER SYSTEM');
  console.log('=============================');
  console.log('Alert email: support@menu.ca');
  
  try {
    const emailOrder = {
      to: 'support@menu.ca',
      restaurant_id: '800',
      restaurant_name: 'test stefan',
      subject: 'New Order - A19 Tablet Test',
      order_details: webOrder,
      trigger_tablet: true
    };

    const emailResponse = await fetch('https://menu.ca/api/email/order_notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MenuCA-Email-Test/1.0'
      },
      body: JSON.stringify(emailOrder)
    });

    const emailText = await emailResponse.text();
    console.log(`📧 Email result: ${emailResponse.status} - ${emailText.substring(0, 200)}...`);
    
  } catch (error) {
    console.log(`❌ Email test failed: ${error.message}`);
  }

  console.log('\n📱 CHECK YOUR A19 TABLET FOR WEB ORDER TEST!');
  console.log('==========================================');
  console.log('Look for: "WEB ORDER TEST" ($19.99)');
  console.log('If this appears, web orders trigger your tablet!');
}

testWebOrderTrigger().catch(console.error);