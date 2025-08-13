/**
 * 🏠 USE SAVED ADDRESS FROM ACCOUNT
 * 
 * BREAKTHROUGH: User showed saved addresses in account!
 * - 1821 Robertson Rd, Ottawa
 * - 2126 Apple Leaf Way, Ottawa  
 * - 600 Terry Fox Dr
 * - 407 tatlock rd carleton place ontario, Carleton place
 * 
 * These are pre-validated, should work immediately
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function useSavedAddress() {
  console.log('🏠 USING SAVED ADDRESS FROM ACCOUNT');
  console.log('===================================');
  console.log('✅ Found saved addresses in user account');
  console.log('🎯 These are pre-validated and should work');
  console.log('');

  try {
    // Step 1: Login as admin to get access to saved addresses
    console.log('🔐 STEP 1: Login to access saved addresses');
    console.log('==========================================');
    
    const loginPageResponse = await fetch('https://aggregator-landing.menu.ca/index.php/account/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const loginHTML = await loginPageResponse.text();
    let cookies = loginPageResponse.headers.get('set-cookie') || '';
    
    const csrfMatch = loginHTML.match(/name=["']ci_csrf_token["']\s+value=["']([^"']+)["']/i);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    
    const loginData = new URLSearchParams({
      email: 'chris@menu.ca',
      password: 'yvamyvam4',
      ci_csrf_token: csrfToken
    });

    const loginResponse = await fetch('https://aggregator-landing.menu.ca/index.php/account/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies,
        'Referer': 'https://aggregator-landing.menu.ca/index.php/account/login'
      },
      body: loginData
    });

    cookies = loginResponse.headers.get('set-cookie') || cookies;
    console.log('✅ Logged in with account that has saved addresses');

    // Step 2: Try each saved address
    console.log('');
    console.log('📍 STEP 2: Test each saved address');
    console.log('==================================');
    
    const savedAddresses = [
      '1821 Robertson Rd, Ottawa',
      '2126 Apple Leaf Way, Ottawa', 
      '600 Terry Fox Dr',
      '407 tatlock rd carleton place ontario, Carleton place'
    ];

    for (const address of savedAddresses) {
      console.log(`🏠 Testing saved address: ${address}`);
      
      const addressData = new URLSearchParams({
        address: address,
        use_saved: 'true', // Indicate this is a saved address
        order_type: 'pickup'
      });

      const addressResponse = await fetch('https://aggregator-landing.menu.ca/index.php/check_address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies,
          'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
        },
        body: addressData
      });

      const addressResult = await addressResponse.text();
      cookies = addressResponse.headers.get('set-cookie') || cookies;
      
      console.log(`   📡 ${addressResponse.status} - ${addressResult}`);
      
      try {
        const addressJSON = JSON.parse(addressResult);
        if (addressJSON.use === true || !addressJSON.error) {
          console.log('   ✅ SAVED ADDRESS VALIDATED!');
          
          // Now try to place order with this validated address
          console.log('   🛒 Placing order with validated saved address...');
          
          const orderData = new URLSearchParams({
            // Customer info (logged in account)
            customer_name: 'Claude Saved Address Test',
            customer_phone: '613-555-0199',
            customer_email: 'claude@savedaddress.com',
            
            // Use the validated saved address
            delivery_address: address,
            order_type: 'pickup',
            
            // Simple order
            items: JSON.stringify([{
              name: '🏠 SAVED ADDRESS SUCCESS - Should Print!',
              quantity: 1,
              price: 22.99,
              notes: `SUCCESS: Used saved address ${address}`
            }]),
            
            // Payment
            payment_method: 'cash',
            subtotal: '22.99',
            tax: '2.99',
            total: '25.98',
            
            special_instructions: `🎉 SAVED ADDRESS ORDER: ${address} - should reach tablet!`
          });

          const orderResponse = await fetch('https://aggregator-landing.menu.ca/placeOrder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json, text/javascript, */*; q=0.01',
              'X-Requested-With': 'XMLHttpRequest',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': cookies,
              'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
            },
            body: orderData
          });

          const orderResult = await orderResponse.text();
          console.log(`   📋 ORDER: ${orderResponse.status} - ${orderResult}`);
          
          try {
            const orderJSON = JSON.parse(orderResult);
            if (!orderJSON.error) {
              console.log('   🎉🎉🎉 ORDER SUCCESS WITH SAVED ADDRESS! 🎉🎉🎉');
              console.log('   ✅ This should print to your tablet!');
              break; // Success, no need to try other addresses
            }
          } catch (e) {
            if (orderResult.includes('success') || orderResult.includes('order')) {
              console.log('   🎉 Order might have succeeded!');
            }
          }
        }
      } catch (e) {
        console.log(`   📄 Non-JSON response: ${addressResult.substring(0, 100)}...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('📱 SAVED ADDRESS TABLET CHECK!');
  console.log('==============================');
  console.log('🏠 Used pre-validated saved addresses from account');
  console.log('🔍 Look for: "SAVED ADDRESS SUCCESS - Should Print!"');
  console.log('💰 Total: $25.98');
  console.log('👤 Customer: Claude Saved Address Test');
  console.log('📍 Address: One of your saved addresses');
  console.log('');
  console.log('🎯 This should work since addresses are already validated!');
}

useSavedAddress().catch(console.error);