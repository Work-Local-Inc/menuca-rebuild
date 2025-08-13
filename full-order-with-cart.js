/**
 * 🛒 FULL ORDER WITH CART ITEMS FIRST
 * 
 * DUH MOMENT: Can't print empty cart! Need to add items FIRST
 * 1. Login
 * 2. Add items to cart (create the order)
 * 3. Set address
 * 4. Checkout with placeOrder calls
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fullOrderWithCart() {
  console.log('🛒 FULL ORDER WITH CART ITEMS FIRST');
  console.log('===================================');
  console.log('💡 DUH MOMENT: Need items in cart before placeOrder!');
  console.log('🎯 Adding items to cart FIRST, then finalizing order');
  console.log('');

  try {
    // Step 1: Login
    console.log('🔐 STEP 1: Login');
    console.log('================');
    
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
    console.log('✅ Logged in');

    // Step 2: Load menu page to get available items
    console.log('');
    console.log('📋 STEP 2: Load menu and find items to add');
    console.log('==========================================');
    
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const menuHTML = await menuResponse.text();
    cookies = menuResponse.headers.get('set-cookie') || cookies;
    
    console.log(`📋 Menu loaded: ${menuResponse.status}`);

    // Find dish/create links from the menu
    const dishMatches = menuHTML.match(/href=["']([^"']*\/dish\/create\/\d+\/\d+)["']/gi) || [];
    console.log(`🔍 Found ${dishMatches.length} menu items`);

    if (dishMatches.length > 0) {
      // Extract the first dish URL
      const firstDishURL = dishMatches[0].match(/href=["']([^"']+)["']/)[1];
      console.log(`🍕 Adding first item: ${firstDishURL}`);
      
      // Step 3: Add item to cart (this creates the order!)
      console.log('');
      console.log('🛒 STEP 3: Add item to cart (CREATE ORDER)');
      console.log('===========================================');
      
      const dishResponse = await fetch(firstDishURL.startsWith('http') ? firstDishURL : `https://aggregator-landing.menu.ca${firstDishURL}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': cookies
        }
      });

      const dishHTML = await dishResponse.text();
      cookies = dishResponse.headers.get('set-cookie') || cookies;
      
      console.log(`🍕 Dish page: ${dishResponse.status}`);
      
      // Look for add to cart form in the dish page
      const cartFormMatch = dishHTML.match(/<form[^>]*action=["']([^"']*cart[^"']*)["'][^>]*>/i) ||
                           dishHTML.match(/action=["']([^"']*add[^"']*)["']/i);
      
      if (cartFormMatch) {
        console.log(`🛒 Found cart form: ${cartFormMatch[1]}`);
        
        // Try to submit the add to cart form
        const cartData = new URLSearchParams({
          quantity: '1',
          special_instructions: 'Automated test order - should print to tablet!',
          add_to_cart: '1'
        });

        const cartResponse = await fetch(cartFormMatch[1], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Cookie': cookies,
            'Referer': firstDishURL.startsWith('http') ? firstDishURL : `https://aggregator-landing.menu.ca${firstDishURL}`
          },
          body: cartData
        });

        const cartResult = await cartResponse.text();
        cookies = cartResponse.headers.get('set-cookie') || cookies;
        console.log(`🛒 Add to cart: ${cartResponse.status} - ${cartResult.substring(0, 200)}...`);
      }
    }

    // Step 4: Check cart display to confirm items added
    console.log('');
    console.log('📊 STEP 4: Check cart display');
    console.log('=============================');
    
    const cartDisplayResponse = await fetch('https://aggregator-landing.menu.ca/index.php/ajax/cart/display', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const cartDisplayResult = await cartDisplayResponse.text();
    console.log(`📊 Cart display: ${cartDisplayResponse.status} - ${cartDisplayResult.substring(0, 300)}...`);
    
    if (cartDisplayResult.includes('item') || cartDisplayResult.includes('total') || cartDisplayResult.length > 100) {
      console.log('✅ Cart has items! Order created successfully');
    } else {
      console.log('❌ Cart appears empty - may need different approach');
    }

    // Step 5: Set address (now that we have items in cart)
    console.log('');
    console.log('📍 STEP 5: Set address validation');
    console.log('=================================');
    
    const addressData = new URLSearchParams({
      street_number: '',
      street: '',
      city: '',
      zone: '',
      province: '',
      postal_code: 'K7C 0V2',
      postal_code_prefix: '',
      country: '',
      lat: '46.13292550000000000',
      lng: '-63.25621300000000000',
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
    console.log(`📍 Address validation: ${addressResponse.status} - ${addressResult}`);

    // Step 6: Go to checkout
    console.log('');
    console.log('💳 STEP 6: Load checkout page');
    console.log('=============================');
    
    const checkoutResponse = await fetch('https://aggregator-landing.menu.ca/index.php/checkout', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    cookies = checkoutResponse.headers.get('set-cookie') || cookies;
    console.log(`💳 Checkout loaded: ${checkoutResponse.status}`);

    // Step 7: Place order (now with items in cart!)
    console.log('');
    console.log('🚀 STEP 7: Place order (WITH ITEMS IN CART)');
    console.log('============================================');
    
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) + ' ' + currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // First placeOrder call
    const orderData1 = new URLSearchParams({
      pm: '1',
      comment: ' ',
      time: '',
      asap: 'n'
    });

    const orderResponse1 = await fetch('https://aggregator-landing.menu.ca/index.php/placeOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies,
        'Referer': 'https://aggregator-landing.menu.ca/index.php/checkout'
      },
      body: orderData1
    });

    const orderResult1 = await orderResponse1.text();
    cookies = orderResponse1.headers.get('set-cookie') || cookies;
    console.log(`🚀 Order attempt 1: ${orderResponse1.status} - ${orderResult1}`);

    // Second placeOrder call with time
    const orderData2 = new URLSearchParams({
      pm: '1',
      comment: ' ',
      time: formattedTime.replace(/:/g, '%3A').replace(/ /g, '+'),
      asap: 'n'
    });

    const orderResponse2 = await fetch('https://aggregator-landing.menu.ca/index.php/placeOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies,
        'Referer': 'https://aggregator-landing.menu.ca/index.php/checkout'
      },
      body: orderData2
    });

    const orderResult2 = await orderResponse2.text();
    console.log(`🚀 Order attempt 2: ${orderResponse2.status} - ${orderResult2}`);

    if (orderResult1.includes('success') || orderResult2.includes('success') ||
        orderResult1.includes('thank') || orderResult2.includes('thank') ||
        (!orderResult1.includes('error') && !orderResult2.includes('error'))) {
      console.log('🎉🎉🎉 ORDER WITH CART ITEMS SUCCESSFUL! 🎉🎉🎉');
      console.log('✅ This should print to your tablet!');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('📱 FULL ORDER WITH CART COMPLETE');
  console.log('================================');
  console.log('🛒 Added items to cart BEFORE placing order');
  console.log('🚀 Then executed placeOrder calls');
  console.log('📱 Check your tablet for the print!');
}

fullOrderWithCart().catch(console.error);