/**
 * 🎉 REPLICATE SUCCESSFUL ORDER - WE HAVE PROOF IT WORKS!
 * 
 * SUCCESS DATA:
 * - Admin: chris bouzioutas (signed in required)
 * - Restaurant: Test James - Dovercourt Pizza  
 * - Order #83022 placed successfully and PRINTED!
 * - URL: https://aggregator-landing.menu.ca/index.php/menu
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function replicateSuccessfulOrder() {
  console.log('🎉 REPLICATING SUCCESSFUL ORDER PROCESS');
  console.log('======================================');
  console.log('✅ CONFIRMED: Order #83022 printed successfully!');
  console.log('👤 Admin: chris bouzioutas (signed in)');
  console.log('🏪 Restaurant: Test James - Dovercourt Pizza');
  console.log('📍 Address: 407 tatlock rd carleton place ontario');
  console.log('🌐 URL: https://aggregator-landing.menu.ca/index.php/menu');
  console.log('');

  try {
    // Step 1: Access the exact landing page that worked
    console.log('🌐 STEP 1: Accessing successful landing page');
    console.log('============================================');
    
    const landingResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    const landingHTML = await landingResponse.text();
    const landingCookies = landingResponse.headers.get('set-cookie') || '';
    
    console.log(`📄 Landing page: ${landingResponse.status} - ${landingHTML.length} chars`);
    console.log(`🍪 Session cookies: ${landingCookies}`);
    
    // Look for login forms or admin access
    if (landingHTML.includes('login') || landingHTML.includes('sign in') || landingHTML.includes('admin')) {
      console.log('🔐 Page has login functionality - need admin access');
    }
    
    // Look for ordering forms/buttons
    if (landingHTML.includes('add to cart') || landingHTML.includes('order') || landingHTML.includes('checkout')) {
      console.log('🛒 Page has ordering functionality');
    }

    // Step 2: Try to simulate admin login (if needed)
    console.log('');
    console.log('🔐 STEP 2: Attempting admin access simulation');
    console.log('============================================');
    
    // Look for login endpoints in the HTML
    const loginMatches = landingHTML.match(/action=["']([^"']*login[^"']*)["']/gi) || 
                        landingHTML.match(/href=["']([^"']*login[^"']*)["']/gi) || [];
    
    if (loginMatches.length > 0) {
      console.log(`🔍 Found ${loginMatches.length} login-related endpoints:`);
      loginMatches.forEach((match, i) => {
        console.log(`   ${i+1}: ${match}`);
      });
    }

    // Step 3: Try to place an order using the same format as successful order
    console.log('');
    console.log('🛒 STEP 3: Placing order (replicating successful process)');
    console.log('========================================================');
    
    const successfulOrderData = {
      // Use same customer data as successful order
      customer_name: 'claude test replication',
      customer_phone: '613-555-0199', 
      customer_email: 'claude@test.com',
      
      // Use same address format as successful order
      delivery_name: 'Claude Test Order',
      delivery_address: '407 tatlock rd',
      delivery_city: 'carleton place',
      delivery_province: 'ontario', 
      delivery_postal: 'K7C-0V3',
      delivery_phone: '613-555-0199',
      
      // Order details (similar to what worked)
      restaurant: 'Test James - Dovercourt Pizza',
      items: JSON.stringify([{
        name: '🎉 REPLICATING SUCCESS - Order #83022 Pattern!',
        quantity: 1,
        price: 24.99,
        notes: 'SUCCESS REPLICATION: Following exact pattern that printed!'
      }]),
      
      // Payment/totals
      subtotal: 24.99,
      tax: 3.25,
      delivery_fee: 4.99,
      tip: 4.00,
      total: 37.23,
      payment_method: 'cash',
      order_type: 'delivery',
      special_instructions: '🚀 REPLICATION TEST: Following Order #83022 successful pattern'
    };

    // Try multiple submission approaches
    const submissionMethods = [
      {
        name: 'Form POST (like web form)',
        endpoint: 'https://aggregator-landing.menu.ca/placeOrder',
        contentType: 'application/x-www-form-urlencoded',
        data: new URLSearchParams(successfulOrderData)
      },
      {
        name: 'JSON POST (like AJAX)',
        endpoint: 'https://aggregator-landing.menu.ca/placeOrder', 
        contentType: 'application/json',
        data: JSON.stringify(successfulOrderData)
      },
      {
        name: 'Menu page submission',
        endpoint: 'https://aggregator-landing.menu.ca/index.php/menu',
        contentType: 'application/x-www-form-urlencoded',
        data: new URLSearchParams({...successfulOrderData, action: 'place_order'})
      }
    ];

    for (const method of submissionMethods) {
      console.log(`🧪 Trying: ${method.name}`);
      
      const response = await fetch(method.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': method.contentType,
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://aggregator-landing.menu.ca/index.php/menu',
          'Cookie': landingCookies
        },
        body: method.data
      });

      const responseText = await response.text();
      console.log(`   📡 ${response.status} - ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      // Look for success indicators
      if (responseText.includes('success') || responseText.includes('order') && responseText.includes('83023')) {
        console.log('   🎉 POTENTIAL SUCCESS - MIGHT HAVE REPLICATED!');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('📱 TABLET CHECK - REPLICATION ATTEMPT');
  console.log('====================================');
  console.log('🎯 Following exact pattern as successful Order #83022');
  console.log('🔍 Look for: "REPLICATING SUCCESS - Order #83022 Pattern!"');
  console.log('💰 Total: $37.23');
  console.log('👤 Customer: claude test replication');
  console.log('📍 Address: 407 tatlock rd, carleton place');
  console.log('');
  console.log('🚀 If this prints, we successfully replicated the process!');
  console.log('📋 This would prove we can programmatically generate orders');
}

replicateSuccessfulOrder().catch(console.error);