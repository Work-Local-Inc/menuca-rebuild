/**
 * 🎯 TEST WEB FORM ORDER SUBMISSION
 * 
 * BREAKTHROUGH: Old PHP4 system uses web form submissions, not APIs!
 * Let's simulate the actual customer ordering process.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebFormOrder() {
  console.log('🌐 TESTING WEB FORM ORDER SUBMISSION');
  console.log('===================================');
  console.log('Theory: A19 tablet receives orders through web form submissions');
  console.log('Restaurant: Test James - Dovercourt Pizza');
  console.log('Customer Menu: https://aggregator-landing.menu.ca/index.php/menu');
  console.log('');

  // Step 1: Get the menu page to establish session
  console.log('📋 Step 1: Loading customer menu page...');
  
  try {
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    console.log(`   Menu page status: ${menuResponse.status}`);
    
    if (menuResponse.ok) {
      // Step 2: Set delivery address (required step)
      console.log('📍 Step 2: Setting delivery address...');
      
      const addressData = new URLSearchParams({
        'delivery_address': '600 terry fox drive',
        'delivery_city': 'Ottawa',
        'delivery_province': 'ON',
        'delivery_postal': 'K2L4B6',
        'delivery_phone': '613-555-0199',
        'order_type': 'delivery',
        'action': 'set_address'
      });

      const addressResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
        },
        body: addressData
      });

      console.log(`   Address response: ${addressResponse.status}`);

      // Step 3: Add items to cart
      console.log('🛒 Step 3: Adding items to cart...');
      
      const cartData = new URLSearchParams({
        'item_name': 'WEB FORM TEST PIZZA',
        'item_price': '22.99',
        'item_quantity': '1',
        'special_instructions': '🌐 WEB FORM ORDER TEST - This should appear on A19 tablet!',
        'action': 'add_to_cart'
      });

      const cartResponse = await fetch('https://aggregator-landing.menu.ca/index.php/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
        },
        body: cartData
      });

      console.log(`   Cart response: ${cartResponse.status}`);

      // Step 4: Submit order through checkout
      console.log('💳 Step 4: Submitting order through checkout...');
      
      const checkoutData = new URLSearchParams({
        'customer_name': 'Claude Web Form Test',
        'customer_phone': '613-555-0199',
        'customer_email': 'claude@menuca.com',
        'delivery_instructions': '🎯 WEB FORM INTEGRATION TEST - Testing if web orders trigger A19 tablet',
        'payment_method': 'credit_card',
        'order_total': '28.58',
        'action': 'submit_order'
      });

      const orderResponse = await fetch('https://aggregator-landing.menu.ca/index.php/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://aggregator-landing.menu.ca/index.php/cart'
        },
        body: checkoutData
      });

      console.log(`   Order submission: ${orderResponse.status}`);
      
      if (orderResponse.ok) {
        const orderText = await orderResponse.text();
        console.log(`   Response preview: ${orderText.substring(0, 300)}...`);
        
        if (orderText.includes('success') || orderText.includes('thank') || orderText.includes('order')) {
          console.log('   🎉 POTENTIAL WEB FORM ORDER SUCCESS!');
        }
      }

      // Try alternative form endpoints
      console.log('\n📝 Testing alternative form endpoints...');
      
      const ALT_ENDPOINTS = [
        'https://aggregator-landing.menu.ca/index.php/order/submit',
        'https://aggregator-landing.menu.ca/index.php/submit',
        'https://aggregator-landing.menu.ca/submit_order.php',
        'https://aggregator-landing.menu.ca/process_order.php'
      ];

      for (const endpoint of ALT_ENDPOINTS) {
        try {
          const altResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            body: checkoutData
          });

          console.log(`   ${endpoint}: ${altResponse.status}`);
          
          if (altResponse.ok && altResponse.status !== 404) {
            const altText = await altResponse.text();
            if (altText.length < 200) {
              console.log(`      Response: ${altText}`);
            }
          }
          
        } catch (error) {
          console.log(`   ${endpoint}: Error - ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } else {
      console.log('   ❌ Could not load customer menu page');
    }
    
  } catch (error) {
    console.error('❌ Web form test failed:', error.message);
  }

  console.log('\n📱 FINAL CHECK - WEB FORM ORDER');
  console.log('==============================');
  console.log('If web form submission worked, check your A19 tablet for:');
  console.log('Order: "WEB FORM TEST PIZZA" ($28.58)');
  console.log('Customer: Claude Web Form Test');
  console.log('Instructions: "WEB FORM INTEGRATION TEST"');
  console.log('');
  console.log('🖨️ This should trigger your NETUM printer if successful!');
}

testWebFormOrder().catch(console.error);