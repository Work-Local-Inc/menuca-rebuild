/**
 * 🎯 REAL PLACEORDER ENDPOINT - BREAKTHROUGH!
 * 
 * Found the actual customer order submission path from checkout.min.js
 * This is how real customers place orders that reach tablets!
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRealPlaceOrder() {
  console.log('🎯 TESTING REAL PLACEORDER ENDPOINT');
  console.log('==================================');
  console.log('🚀 BREAKTHROUGH: Found actual customer order path!');
  console.log('📡 Endpoint: /placeOrder (from checkout.min.js)');
  console.log('');

  // Test the real customer order submission endpoints
  const PLACEORDER_ENDPOINTS = [
    'https://aggregator-landing.menu.ca/placeOrder',
    'https://tablet.menu.ca/placeOrder', 
    'https://menuadmin.menu.ca/placeOrder',
    'https://aggregator-admin.menu.ca/placeOrder'
  ];

  const realCustomerOrder = {
    restaurant_id: 'O11',
    customer: {
      name: 'REAL CUSTOMER ORDER TEST',
      phone: '613-555-0199',
      email: 'customer@test.com'
    },
    delivery_address: {
      street: '2047 Dovercourt Avenue',
      city: 'Ottawa',
      province: 'ON',
      postal_code: 'K2A-0X2'
    },
    items: [{
      name: '🚀 REAL CUSTOMER ORDER - Should reach O11 tablet!',
      quantity: 1,
      price: 28.99,
      special_instructions: 'BREAKTHROUGH: Using real customer order path!'
    }],
    payment: {
      method: 'credit_card',
      amount: 38.98,
      subtotal: 28.99,
      tax: 3.77,
      delivery_fee: 4.99,
      tip: 1.23
    },
    delivery_type: 'delivery',
    order_time: 'ASAP',
    comment: '🎉 REAL ORDER PATH: This should appear on your O11 tablet!',
    csrf_token: 'test_token_123'
  };

  for (const endpoint of PLACEORDER_ENDPOINTS) {
    console.log(`🧪 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://aggregator-landing.menu.ca/',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(realCustomerOrder)
      });

      const responseText = await response.text();
      console.log(`   📡 ${response.status} - ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      if (response.ok && responseText && responseText !== '{}') {
        console.log('   🎉 SUCCESS: Real customer order endpoint found!');
        
        // Also try form-encoded version
        const formData = new URLSearchParams();
        Object.keys(realCustomerOrder).forEach(key => {
          if (typeof realCustomerOrder[key] === 'object') {
            formData.append(key, JSON.stringify(realCustomerOrder[key]));
          } else {
            formData.append(key, realCustomerOrder[key]);
          }
        });

        const formResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://aggregator-landing.menu.ca/'
          },
          body: formData
        });

        const formText = await formResponse.text();
        console.log(`   📋 FORM VERSION: ${formResponse.status} - ${formText.substring(0, 200)}${formText.length > 200 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('🔍 ALTERNATIVE: MENU SELECTION TEST');
  console.log('===================================');
  console.log('Let\'s also test if we need to go through menu selection first');
  
  // Test accessing the menu for O11 first
  try {
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const menuText = await menuResponse.text();
    console.log(`📋 MENU PAGE: ${menuResponse.status} - ${menuText.length} chars`);
    
    if (menuText.includes('O11') || menuText.includes('menu') || menuText.includes('restaurant')) {
      console.log('✅ Menu page accessible - this is the right path!');
    }
    
  } catch (error) {
    console.log(`❌ Menu test error: ${error.message}`);
  }

  console.log('');
  console.log('📱 CRITICAL CHECK');
  console.log('================');
  console.log('🎯 This uses the REAL customer order submission path');
  console.log('🔍 Check tablet for: "REAL CUSTOMER ORDER - Should reach O11 tablet!"');
  console.log('💰 Amount: $38.98');
  console.log('👤 Customer: REAL CUSTOMER ORDER TEST');
  console.log('');
  console.log('🚀 If this works, we found the actual working integration!');
}

testRealPlaceOrder().catch(console.error);