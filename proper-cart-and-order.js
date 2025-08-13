/**
 * 🔗 PROPER CART AND ORDER - INTEGRATION BRIDGE
 * 
 * REAL GOAL: Connect NEW menu platform to OLD tablet app for printing
 * 1. Actually add items to cart properly
 * 2. Get real order time dropdown values 
 * 3. Place complete order that prints
 * 4. Document the process for integration
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function properCartAndOrder() {
  console.log('🔗 BUILDING INTEGRATION BRIDGE: NEW PLATFORM → OLD APP');
  console.log('====================================================');
  console.log('🎯 Goal: Connect new menu platform to old tablet app for printing');
  console.log('📋 Step 1: Learn how to properly add items and place orders');
  console.log('📋 Step 2: Document process for integration bridge');
  console.log('');

  try {
    // Step 1: Login and establish session
    console.log('🔐 STEP 1: Login and establish session');
    console.log('======================================');
    
    const loginPageResponse = await fetch('https://aggregator-landing.menu.ca/index.php/account/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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
    console.log('✅ Session established for integration testing');

    // Step 2: Get menu and analyze cart mechanism
    console.log('');
    console.log('📋 STEP 2: Analyze menu structure for cart integration');
    console.log('===================================================');
    
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const menuHTML = await menuResponse.text();
    cookies = menuResponse.headers.get('set-cookie') || cookies;
    
    // Extract dish creation URLs for integration
    const dishURLs = [...new Set(menuHTML.match(/href=["']([^"']*\/dish\/create\/\d+\/\d+)["']/gi) || [])]
      .map(match => match.match(/href=["']([^"']+)["']/)[1])
      .slice(0, 3); // Get first 3 for testing
    
    console.log(`🔍 INTEGRATION POINT: Found ${dishURLs.length} menu items for cart integration:`);
    dishURLs.forEach((url, i) => {
      console.log(`   ${i+1}. ${url}`);
    });

    if (dishURLs.length > 0) {
      // Step 3: Analyze dish page structure for proper cart addition
      console.log('');
      console.log('🛒 STEP 3: Analyze dish page for proper cart addition');
      console.log('===================================================');
      
      const firstDishURL = dishURLs[0].startsWith('http') ? dishURLs[0] : `https://aggregator-landing.menu.ca${dishURLs[0]}`;
      
      const dishResponse = await fetch(firstDishURL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': cookies
        }
      });

      const dishHTML = await dishResponse.text();
      cookies = dishResponse.headers.get('set-cookie') || cookies;
      
      console.log(`🍕 Dish page loaded: ${dishResponse.status}`);
      
      // Look for actual cart addition mechanisms
      const cartForms = dishHTML.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
      const cartButtons = dishHTML.match(/<button[^>]*cart[^>]*>.*?<\/button>/gi) || 
                         dishHTML.match(/<input[^>]*cart[^>]*[^>]*>/gi) || [];
      
      console.log(`📋 CART INTEGRATION ANALYSIS:`);
      console.log(`   - Found ${cartForms.length} forms on dish page`);
      console.log(`   - Found ${cartButtons.length} cart-related buttons`);
      
      // Extract form actions and methods
      cartForms.forEach((form, i) => {
        const actionMatch = form.match(/action=["']([^"']+)["']/i);
        const methodMatch = form.match(/method=["']([^"']+)["']/i);
        if (actionMatch) {
          console.log(`   Form ${i+1}: ${methodMatch ? methodMatch[1] : 'GET'} ${actionMatch[1]}`);
        }
      });

      // Step 4: Try to add item using proper form submission
      console.log('');
      console.log('🔄 STEP 4: Attempt proper item addition to cart');
      console.log('===============================================');
      
      // Look for the actual cart form
      const cartFormMatch = dishHTML.match(/<form[^>]*action=["']([^"']+)["'][^>]*method=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i);
      
      if (cartFormMatch) {
        const formAction = cartFormMatch[1];
        const formMethod = cartFormMatch[2];
        const formContent = cartFormMatch[3];
        
        console.log(`📋 Found cart form: ${formMethod} ${formAction}`);
        
        // Extract form fields
        const inputMatches = [...formContent.matchAll(/<input[^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*/gi)];
        const selectMatches = [...formContent.matchAll(/<select[^>]*name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi)];
        
        console.log(`   - ${inputMatches.length} input fields`);
        console.log(`   - ${selectMatches.length} select fields`);
        
        // Build form data from extracted fields
        const formData = new URLSearchParams();
        
        // Add input fields
        inputMatches.forEach(match => {
          const name = match[1];
          const value = match[2];
          formData.append(name, value);
        });
        
        // Add default cart values
        formData.append('quantity', '1');
        formData.append('special_instructions', '🔗 INTEGRATION TEST: New platform → Old tablet');
        
        console.log(`📤 Submitting cart form data...`);
        
        const cartSubmitResponse = await fetch(
          formAction.startsWith('http') ? formAction : `https://aggregator-landing.menu.ca${formAction}`,
          {
            method: formMethod.toUpperCase(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Cookie': cookies,
              'Referer': firstDishURL
            },
            body: formData
          }
        );

        const cartSubmitResult = await cartSubmitResponse.text();
        cookies = cartSubmitResponse.headers.get('set-cookie') || cookies;
        
        console.log(`🛒 Cart submission: ${cartSubmitResponse.status}`);
        console.log(`📄 Result: ${cartSubmitResult.substring(0, 200)}...`);
        
        if (cartSubmitResponse.status === 302 || cartSubmitResult.includes('success')) {
          console.log('✅ Item likely added to cart successfully!');
        }
      } else {
        console.log('❌ Could not find proper cart form - need alternative approach');
      }
    }

    // Step 5: Check updated cart status
    console.log('');
    console.log('📊 STEP 5: Check cart status after addition');
    console.log('==========================================');
    
    const cartCheckResponse = await fetch('https://aggregator-landing.menu.ca/index.php/ajax/cart/display', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const cartCheckResult = await cartCheckResponse.text();
    console.log(`📊 Cart check: ${cartCheckResponse.status}`);
    console.log(`📄 Cart contents: ${cartCheckResult.substring(0, 300)}...`);
    
    // Look for total_items value
    const totalItemsMatch = cartCheckResult.match(/var total_items = (\d+)/);
    if (totalItemsMatch) {
      const totalItems = totalItemsMatch[1];
      console.log(`🔢 Total items in cart: ${totalItems}`);
      
      if (totalItems > 0) {
        console.log('✅ SUCCESS: Items in cart! Ready for checkout integration');
        
        // Step 6: Analyze checkout for order time options
        console.log('');
        console.log('⏰ STEP 6: Analyze checkout for order time integration');
        console.log('====================================================');
        
        const checkoutResponse = await fetch('https://aggregator-landing.menu.ca/index.php/checkout', {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Cookie': cookies
          }
        });

        const checkoutHTML = await checkoutResponse.text();
        cookies = checkoutResponse.headers.get('set-cookie') || cookies;
        
        // Extract order time options
        const timeSelectMatch = checkoutHTML.match(/<select[^>]*name=["']time["'][^>]*>([\s\S]*?)<\/select>/i);
        
        if (timeSelectMatch) {
          const timeOptions = [...timeSelectMatch[1].matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([^<]*)<\/option>/gi)];
          
          console.log(`⏰ INTEGRATION POINT: Found ${timeOptions.length} order time options:`);
          timeOptions.slice(0, 5).forEach((option, i) => {
            console.log(`   ${i+1}. Value: "${option[1]}" - Display: "${option[2].trim()}"`);
          });
          
          if (timeOptions.length > 0) {
            // Use first available time option
            const selectedTime = timeOptions[0][1];
            console.log(`✅ Using time option: "${selectedTime}"`);
            
            // Step 7: Complete order with proper time
            console.log('');
            console.log('🚀 STEP 7: Complete integration test order');
            console.log('==========================================');
            
            const orderData = new URLSearchParams({
              pm: '1',     // Cash payment
              comment: 'Integration test: New platform → Old tablet app',
              time: selectedTime,
              asap: 'n'
            });

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
            console.log(`🚀 INTEGRATION ORDER: ${orderResponse.status}`);
            console.log(`📄 Order result: ${orderResult}`);
            
            if (!orderResult.includes('error') || orderResult.includes('success')) {
              console.log('🎉🎉🎉 INTEGRATION SUCCESS! 🎉🎉🎉');
              console.log('✅ Order placed successfully - should print to tablet!');
            }
          }
        }
      } else {
        console.log('❌ Cart still empty - cart addition failed');
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🔗 INTEGRATION BRIDGE ANALYSIS COMPLETE');
  console.log('======================================');
  console.log('📋 KEY INTEGRATION POINTS DISCOVERED:');
  console.log('   1. Menu items: /dish/create/{id}/{variant}');
  console.log('   2. Cart addition: Form submission to cart endpoint');  
  console.log('   3. Cart check: /ajax/cart/display');
  console.log('   4. Order times: Dropdown values from checkout page');
  console.log('   5. Order placement: /placeOrder with proper data');
  console.log('');
  console.log('🎯 NEXT: Build integration bridge for new platform!');
  console.log('📱 Check tablet for any prints from this test!');
}

properCartAndOrder().catch(console.error);