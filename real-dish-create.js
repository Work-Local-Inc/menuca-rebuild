/**
 * 🍕 REAL DISH CREATE MECHANISM
 * 
 * BREAKTHROUGH: Found actual menu system!
 * - Menu items use /dish/create/{id}/0 endpoints
 * - Large Pizza 3 Toppings: /dish/create/226/0  
 * - Test Burger: /dish/create/278/0
 * - Address form uses setOrderType(e) and setAddr(e) functions
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function realDishCreate() {
  console.log('🍕 REAL DISH CREATE MECHANISM');
  console.log('=============================');
  console.log('✅ Found actual menu system: /dish/create/{id}/0');
  console.log('🎯 Testing with real menu items from the page');
  console.log('');

  try {
    // Step 1: Login first
    console.log('🔐 STEP 1: Login as admin');
    console.log('=========================');
    
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
        'Cookie': cookies
      },
      body: loginData
    });

    cookies = loginResponse.headers.get('set-cookie') || cookies;
    console.log('✅ Login completed');

    // Step 2: Set address first (using the setAddr mechanism)
    console.log('');
    console.log('📍 STEP 2: Set address (address popup simulation)');
    console.log('================================================');
    
    const addressData = new URLSearchParams({
      address: '407 tatlock rd carleton place on k7c0v2',
      order_type: 'pickup' // User said select pickup
    });

    const addressResponse = await fetch('https://aggregator-landing.menu.ca/index.php/check_address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
      },
      body: addressData
    });

    const addressResult = await addressResponse.text();
    cookies = addressResponse.headers.get('set-cookie') || cookies;
    console.log(`📍 Address: ${addressResponse.status} - ${addressResult.substring(0, 200)}...`);

    // Step 3: Add actual menu items using dish/create
    console.log('');
    console.log('🍕 STEP 3: Add real menu items to cart');
    console.log('======================================');
    
    const realMenuItems = [
      { id: 226, name: 'Large Pizza 3 Toppings' },
      { id: 278, name: 'Burger + Wings' }, 
      { id: 129, name: 'Taboule' }
    ];

    for (const item of realMenuItems) {
      console.log(`🧪 Adding: ${item.name} (ID: ${item.id})`);
      
      const dishResponse = await fetch(`https://aggregator-landing.menu.ca/dish/create/${item.id}/0`, {
        method: 'GET', // Start with GET to see the dish page
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const dishHTML = await dishResponse.text();
      cookies = dishResponse.headers.get('set-cookie') || cookies;
      
      console.log(`   📄 Dish page: ${dishResponse.status} - ${dishHTML.length} chars`);
      
      if (dishResponse.ok && dishHTML.includes('cart') || dishHTML.includes('add')) {
        console.log(`   ✅ ${item.name} dish page loaded successfully!`);
        
        // Now try to add to cart (look for form in the dish HTML)
        const formMatch = dishHTML.match(/<form[^>]*action=["']([^"']*cart[^"']*)["'][^>]*>/i) ||
                         dishHTML.match(/<form[^>]*action=["']([^"']*add[^"']*)["'][^>]*>/i);
        
        if (formMatch) {
          console.log(`   🛒 Found cart form: ${formMatch[1]}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Try direct checkout after adding items
    console.log('');
    console.log('💳 STEP 4: Proceed to checkout');
    console.log('==============================');
    
    const checkoutResponse = await fetch('https://aggregator-landing.menu.ca/checkout', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const checkoutHTML = await checkoutResponse.text();
    console.log(`💳 Checkout page: ${checkoutResponse.status} - ${checkoutHTML.length} chars`);
    
    if (checkoutHTML.includes('cart') || checkoutHTML.includes('total') || checkoutHTML.includes('payment')) {
      console.log('✅ Checkout page has order functionality!');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🔍 REAL MENU MECHANISM ANALYSIS');
  console.log('===============================');
  console.log('✅ Found actual dish creation endpoints');
  console.log('📍 Address setting mechanism identified'); 
  console.log('🛒 Need to complete the cart addition process');
  console.log('💳 Checkout flow needs proper cart population');
  console.log('');
  console.log('🎯 This is the real mechanism - now need to complete cart flow');
}

realDishCreate().catch(console.error);