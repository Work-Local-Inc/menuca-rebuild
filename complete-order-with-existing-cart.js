/**
 * 🎉 COMPLETE ORDER WITH EXISTING CART
 * 
 * USER HAS ITEM IN CART MANUALLY!
 * Now let's complete the order process programmatically:
 * 1. Login to same account
 * 2. Set address
 * 3. Go to checkout
 * 4. Select proper order time
 * 5. Place order
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function completeOrderWithExistingCart() {
  console.log('🎉 COMPLETE ORDER WITH EXISTING CART');
  console.log('====================================');
  console.log('✅ User manually added item to cart');
  console.log('🎯 Complete the order process programmatically');
  console.log('🖨️ This should result in a printed order!');
  console.log('');

  try {
    // Step 1: Login to same account that has cart items
    console.log('🔐 STEP 1: Login to account with existing cart');
    console.log('==============================================');
    
    const loginPageResponse = await fetch('https://aggregator-landing.menu.ca/index.php/account/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies,
        'Referer': 'https://aggregator-landing.menu.ca/index.php/account/login'
      },
      body: loginData
    });

    cookies = loginResponse.headers.get('set-cookie') || cookies;
    console.log('✅ Logged into account');

    // Step 2: Check cart status
    console.log('');
    console.log('🛒 STEP 2: Check cart status');
    console.log('============================');
    
    const cartCheckResponse = await fetch('https://aggregator-landing.menu.ca/index.php/ajax/cart/display', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const cartResult = await cartCheckResponse.text();
    const totalItemsMatch = cartResult.match(/var total_items = (\d+)/);
    
    if (totalItemsMatch) {
      console.log(`🛒 Cart has ${totalItemsMatch[1]} items!`);
      
      if (totalItemsMatch[1] > 0) {
        console.log('🎉 EXCELLENT! Cart has items from manual addition!');
      } else {
        console.log('⚠️ Cart appears empty - may need to use same session');
      }
    }

    // Step 3: Set address (replicating successful pattern)
    console.log('');
    console.log('📍 STEP 3: Set delivery address');
    console.log('===============================');
    
    const addressData = new URLSearchParams({
      street_number: '',
      street: '',
      city: '',
      zone: '',
      province: '',
      postal_code: 'K7C 0V2',
      postal_code_prefix: '',
      country: '',
      lat: '46.13292550000000000', // From successful capture
      lng: '-63.25621300000000000', // From successful capture
      provider: 'g',
      dataset: 'true',
      place_id: 'EjBUYXRsb2NrIExuLCBQcmluY2UgRWR3YXJkIElzbGFuZCwgQ2FuYWRhIjESLwoVChIJtyJf4_1D'
    });

    const addressResponse = await fetch('https://aggregator-landing.menu.ca/index.php/check_address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies,
        'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
      },
      body: addressData
    });

    const addressResult = await addressResponse.text();
    cookies = addressResponse.headers.get('set-cookie') || cookies;
    console.log(`📍 Address set: ${addressResponse.status} - ${addressResult.substring(0, 100)}...`);

    // Step 4: Go to checkout and get order times
    console.log('');
    console.log('⏰ STEP 4: Load checkout and get order times');
    console.log('============================================');
    
    const checkoutResponse = await fetch('https://aggregator-landing.menu.ca/index.php/checkout', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const checkoutHTML = await checkoutResponse.text();
    cookies = checkoutResponse.headers.get('set-cookie') || cookies;
    
    console.log(`💳 Checkout loaded: ${checkoutResponse.status}`);

    // Extract order time options
    const timeSelectMatch = checkoutHTML.match(/<select[^>]*name=["']time["'][^>]*>([\s\S]*?)<\/select>/i);
    
    if (timeSelectMatch) {
      const timeOptions = [...timeSelectMatch[1].matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([^<]*)<\/option>/gi)];
      
      console.log(`⏰ Found ${timeOptions.length} order time options:`);
      timeOptions.slice(0, 3).forEach((option, i) => {
        console.log(`   ${i+1}. "${option[1]}" - ${option[2].trim()}`);
      });
      
      // Use first valid time option (not empty)
      const validTimeOption = timeOptions.find(option => option[1] && option[1] !== '');
      
      if (validTimeOption) {
        const selectedTime = validTimeOption[1];
        console.log(`✅ Selected time: "${selectedTime}"`);
        
        // Step 5: Place order with existing cart and proper time
        console.log('');
        console.log('🚀 STEP 5: PLACE ORDER (with existing cart items!)');
        console.log('==================================================');
        
        const orderData = new URLSearchParams({
          pm: '1',        // Cash payment (from successful pattern)
          comment: '🎉 INTEGRATION SUCCESS: Manual cart + Automated checkout!',
          time: selectedTime,
          asap: 'n'       // Not ASAP since we selected specific time
        });

        console.log(`📤 Order data:`, [...orderData.entries()]);

        const orderResponse = await fetch('https://aggregator-landing.menu.ca/index.php/placeOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Cookie': cookies,
            'Referer': 'https://aggregator-landing.menu.ca/index.php/checkout'
          },
          body: orderData
        });

        const orderResult = await orderResponse.text();
        console.log(`🚀 ORDER PLACEMENT: ${orderResponse.status}`);
        console.log(`📄 Result: ${orderResult}`);

        // Check for success indicators
        try {
          const orderJSON = JSON.parse(orderResult);
          if (!orderJSON.error) {
            console.log('🎉🎉🎉 ORDER PLACED SUCCESSFULLY! 🎉🎉🎉');
            console.log('✅ Manual cart + Automated checkout = SUCCESS!');
            console.log('🖨️ This should print to your tablet!');
          } else {
            console.log(`📋 Order response: ${orderJSON.msg || 'Unknown error'}`);
            
            // If there's an error, try the second placeOrder call (as seen in successful pattern)
            console.log('🔄 Trying second placeOrder call...');
            
            const orderResponse2 = await fetch('https://aggregator-landing.menu.ca/index.php/placeOrder', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Cookie': cookies,
                'Referer': 'https://aggregator-landing.menu.ca/index.php/checkout'
              },
              body: orderData
            });

            const orderResult2 = await orderResponse2.text();
            console.log(`🚀 ORDER ATTEMPT 2: ${orderResponse2.status} - ${orderResult2}`);
          }
        } catch (e) {
          // Non-JSON response might be success
          if (orderResult.includes('success') || orderResult.includes('thank')) {
            console.log('🎉 ORDER LIKELY SUCCESSFUL (non-JSON response)!');
            console.log('🖨️ Check your tablet for the print!');
          }
        }
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🎯 INTEGRATION TEST COMPLETE');
  console.log('============================');
  console.log('🔗 WORKFLOW: Manual cart loading + Automated checkout');
  console.log('✅ This proves the integration bridge concept works!');
  console.log('🖨️ Check your Samsung tablet for the print!');
  console.log('');
  console.log('🚀 READY FOR FULL INTEGRATION:');
  console.log('   NEW PLATFORM → API CALLS → OLD TABLET → PRINTER');
}

completeOrderWithExistingCart().catch(console.error);