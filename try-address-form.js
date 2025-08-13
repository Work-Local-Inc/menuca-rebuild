/**
 * 🏠 TRY THE ADDRESS FORM
 * 
 * Found form action: "check_address" 
 * Maybe need to set delivery address first before ordering?
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function tryAddressForm() {
  console.log('🏠 TESTING ADDRESS FORM SUBMISSION');
  console.log('==================================');
  console.log('🔍 Found form: check_address');
  console.log('💡 Theory: Need to set address before ordering');
  console.log('');

  try {
    // Step 1: Get a fresh session
    const sessionResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const sessionCookies = sessionResponse.headers.get('set-cookie') || '';
    console.log(`🍪 Session: ${sessionCookies}`);

    // Step 2: Submit address form (like customer setting delivery address)
    console.log('');
    console.log('📍 STEP 2: Setting delivery address');
    console.log('===================================');
    
    const addressData = new URLSearchParams({
      // James Dovercourt restaurant address (your tablet location)
      street: '2047 Dovercourt Avenue',
      city: 'Ottawa', 
      province: 'QC',
      postal_code: 'K2A-0X2',
      // Customer details
      customer_name: 'Claude Test Customer',
      customer_phone: '613-555-0199',
      customer_email: 'test@customer.com'
    });

    const addressResponse = await fetch('https://aggregator-landing.menu.ca/index.php/check_address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': sessionCookies,
        'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
      },
      body: addressData
    });

    const addressResult = await addressResponse.text();
    const newCookies = addressResponse.headers.get('set-cookie') || sessionCookies;
    
    console.log(`📡 Address form: ${addressResponse.status}`);
    console.log(`📄 Response: ${addressResult.substring(0, 500)}...`);
    console.log(`🍪 New cookies: ${newCookies}`);

    // Step 3: After setting address, try ordering
    console.log('');
    console.log('🛒 STEP 3: Now trying to order (after address set)');
    console.log('================================================');
    
    if (addressResponse.ok) {
      // Try the placeOrder endpoint again, but with address session
      const orderData = new URLSearchParams({
        // Order details
        items: JSON.stringify([{
          name: 'Address Test Order - Should reach James Dovercourt tablet',
          quantity: 1,
          price: 25.99
        }]),
        subtotal: 25.99,
        tax: 3.38,
        delivery_fee: 4.99,
        total: 34.36,
        payment_method: 'cash',
        special_instructions: 'TEST: Order after setting address - should reach tablet'
      });

      const orderResponse = await fetch('https://aggregator-landing.menu.ca/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': newCookies,
          'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
        },
        body: orderData
      });

      const orderResult = await orderResponse.text();
      console.log(`📋 Order after address: ${orderResponse.status}`);
      console.log(`📄 Order result: ${orderResult.substring(0, 300)}...`);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('📊 ADDRESS FORM TEST COMPLETE');
  console.log('=============================');
  console.log('🎯 Testing if setting address first helps with ordering');
  console.log('📱 Check tablet for: "Address Test Order - Should reach James Dovercourt tablet"');
}

tryAddressForm().catch(console.error);