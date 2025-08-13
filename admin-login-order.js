/**
 * 🔐 ADMIN LOGIN AND ORDER PLACEMENT
 * 
 * BREAKTHROUGH: Got admin credentials!
 * Login: chris@menu.ca / yvamyvam4
 * This should replicate the exact successful order process
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function adminLoginAndOrder() {
  console.log('🔐 ADMIN LOGIN AND ORDER PLACEMENT');
  console.log('==================================');
  console.log('✅ Got admin credentials: chris@menu.ca');
  console.log('🎯 Going to login and replicate successful order process');
  console.log('');

  try {
    // Step 1: Get login page and session
    console.log('🌐 STEP 1: Getting login page');
    console.log('=============================');
    
    const loginPageResponse = await fetch('https://aggregator-landing.menu.ca/index.php/account/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const loginPageHTML = await loginPageResponse.text();
    const initialCookies = loginPageResponse.headers.get('set-cookie') || '';
    
    console.log(`📄 Login page: ${loginPageResponse.status} - ${loginPageHTML.length} chars`);
    console.log(`🍪 Initial cookies: ${initialCookies}`);

    // Extract CSRF token from login page
    let csrfToken = '';
    const csrfMatch = loginPageHTML.match(/name=["']ci_csrf_token["']\s+value=["']([^"']+)["']/i) ||
                     loginPageHTML.match(/"ci_csrf_token"\s*:\s*"([^"]+)"/i) ||
                     loginPageHTML.match(/ci_csrf_token["']?\s*:\s*["']([^"']+)["']/i);
    
    if (csrfMatch) {
      csrfToken = csrfMatch[1];
      console.log(`🔑 CSRF Token: ${csrfToken.substring(0, 20)}...`);
    }

    // Step 2: Login as admin
    console.log('');
    console.log('🔐 STEP 2: Logging in as admin');
    console.log('==============================');
    
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
        'Referer': 'https://aggregator-landing.menu.ca/index.php/account/login',
        'Cookie': initialCookies
      },
      body: loginData
    });

    const loginResult = await loginResponse.text();
    const loggedInCookies = loginResponse.headers.get('set-cookie') || initialCookies;
    
    console.log(`📡 Login response: ${loginResponse.status}`);
    console.log(`🍪 Logged in cookies: ${loggedInCookies}`);
    
    if (loginResponse.status === 302 || loginResult.includes('dashboard') || loginResult.includes('welcome')) {
      console.log('✅ LOGIN SUCCESS!');
    } else {
      console.log('❌ Login might have failed');
      console.log(`📄 Login result snippet: ${loginResult.substring(0, 300)}...`);
    }

    // Step 3: Access menu page as logged-in admin
    console.log('');
    console.log('📋 STEP 3: Accessing menu as logged-in admin');
    console.log('============================================');
    
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': loggedInCookies
      }
    });

    const menuHTML = await menuResponse.text();
    const menuCookies = menuResponse.headers.get('set-cookie') || loggedInCookies;
    
    console.log(`📄 Menu (as admin): ${menuResponse.status} - ${menuHTML.length} chars`);
    
    if (menuHTML.includes('chris') || menuHTML.includes('admin') || menuHTML.includes('logout')) {
      console.log('✅ Successfully accessed menu as admin!');
    }

    // Step 4: Place order as admin (exactly like successful order)
    console.log('');
    console.log('🛒 STEP 4: Placing order as admin');
    console.log('=================================');
    
    // Extract any ordering tokens from the menu page
    let orderToken = '';
    const tokenMatch = menuHTML.match(/ci_csrf_token["']?\s*:\s*["']([^"']+)["']/i);
    if (tokenMatch) {
      orderToken = tokenMatch[1];
      console.log(`🔑 Order token: ${orderToken.substring(0, 20)}...`);
    }

    const adminOrderData = new URLSearchParams({
      // Customer info (replicating successful order format)
      customer_name: 'Claude Admin Test Success',
      customer_phone: '613-555-0199',
      customer_email: 'claude@admintest.com',
      
      // Delivery address (using same format as Order #83022)
      delivery_name: 'Claude Admin Success',
      delivery_address: '407 tatlock rd',  
      delivery_city: 'carleton place',
      delivery_province: 'ontario',
      delivery_postal: 'K7C-0V4',
      delivery_phone: '613-555-0199',
      
      // Order items
      'items[0][name]': '🎉 ADMIN SUCCESS - Should Print Like Order #83022!',
      'items[0][quantity]': '1',
      'items[0][price]': '26.99',
      'items[0][notes]': 'ADMIN LOGIN SUCCESS: Replicating exact working process!',
      
      // Totals
      subtotal: '26.99',
      tax: '3.51',
      delivery_fee: '4.99',
      tip: '5.00',
      total: '40.49',
      payment_method: 'cash',
      order_type: 'delivery',
      special_instructions: '🚀 ADMIN LOGGED IN: This should print like Order #83022!',
      
      // Tokens
      ci_csrf_token: orderToken || csrfToken
    });

    const adminOrderResponse = await fetch('https://aggregator-landing.menu.ca/placeOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://aggregator-landing.menu.ca/index.php/menu',
        'Cookie': menuCookies
      },
      body: adminOrderData
    });

    const adminOrderResult = await adminOrderResponse.text();
    console.log(`📋 ADMIN ORDER: ${adminOrderResponse.status}`);
    console.log(`📄 Order result: ${adminOrderResult}`);
    
    try {
      const orderJSON = JSON.parse(adminOrderResult);
      if (!orderJSON.error) {
        console.log('🎉🎉🎉 ADMIN ORDER SUCCESS! 🎉🎉🎉');
        console.log('✅ Should print to your tablet now!');
      } else {
        console.log(`📋 Order issue: ${orderJSON.msg || 'Unknown error'}`);
      }
    } catch (e) {
      if (adminOrderResult.includes('success') || adminOrderResult.includes('thank')) {
        console.log('🎉 Order might have succeeded (non-JSON response)');
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('📱 ADMIN TABLET CHECK!');
  console.log('======================');
  console.log('🔐 Placed order as logged-in admin (chris@menu.ca)');
  console.log('🔍 Look for: "ADMIN SUCCESS - Should Print Like Order #83022!"');
  console.log('💰 Total: $40.49');
  console.log('👤 Customer: Claude Admin Test Success');
  console.log('📍 Address: 407 tatlock rd, carleton place');
  console.log('');
  console.log('🚀 This should replicate your exact successful process!');
}

adminLoginAndOrder().catch(console.error);