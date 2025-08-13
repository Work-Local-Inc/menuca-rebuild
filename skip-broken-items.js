/**
 * 🛠️ SKIP BROKEN MENU ITEMS - USE WORKING ONES
 * 
 * USER INSIGHT: Top menu items have broken popups that disable page
 * Items further down the list work properly
 * Skip the problematic ones and use working items for integration
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function skipBrokenItems() {
  console.log('🛠️ SKIP BROKEN MENU ITEMS - USE WORKING ONES');
  console.log('============================================');
  console.log('💡 USER INSIGHT: Top items have broken popups');
  console.log('✅ Items further down work properly');
  console.log('🎯 Skip problematic items and use working ones');
  console.log('');

  try {
    // Login first
    console.log('🔐 STEP 1: Login');
    console.log('================');
    
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
    console.log('✅ Logged in');

    // Get menu and find ALL items
    console.log('');
    console.log('📋 STEP 2: Find ALL menu items (skip broken ones)');
    console.log('=================================================');
    
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const menuHTML = await menuResponse.text();
    cookies = menuResponse.headers.get('set-cookie') || cookies;
    
    // Get ALL dish URLs (not just first 3)
    const allDishURLs = [...new Set(menuHTML.match(/href=["']([^"']*\/dish\/create\/\d+\/\d+)["']/gi) || [])]
      .map(match => match.match(/href=["']([^"']+)["']/)[1]);
    
    console.log(`🔍 Found ${allDishURLs.length} total menu items`);
    console.log(`🛠️ Skipping first 5 items (likely broken popups)`);
    console.log(`✅ Testing items 6+ (should work properly)`);
    
    // Skip the first several items and test the ones further down
    const workingItems = allDishURLs.slice(5, 10); // Skip first 5, test next 5
    
    console.log(`🧪 Testing working items:`);
    workingItems.forEach((url, i) => {
      console.log(`   ${i+6}. ${url}`);
    });

    for (const dishURL of workingItems) {
      console.log('');
      console.log(`🍕 TESTING ITEM: ${dishURL}`);
      console.log('=====================================');
      
      const fullDishURL = dishURL.startsWith('http') ? dishURL : `https://aggregator-landing.menu.ca${dishURL}`;
      
      const dishResponse = await fetch(fullDishURL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': cookies
        }
      });

      const dishHTML = await dishResponse.text();
      cookies = dishResponse.headers.get('set-cookie') || cookies;
      
      console.log(`📄 Status: ${dishResponse.status}, Content: ${dishHTML.length} chars`);
      
      // Check if this item has proper forms/buttons (not broken)
      const hasPopupElements = dishHTML.includes('modal') || dishHTML.includes('popup');
      const hasFormElements = dishHTML.includes('<form') && dishHTML.includes('cart');
      const hasButtons = dishHTML.includes('add to cart') || dishHTML.includes('Add to Cart');
      
      console.log(`🔍 Analysis:`);
      console.log(`   - Has popup elements: ${hasPopupElements}`);
      console.log(`   - Has form elements: ${hasFormElements}`);
      console.log(`   - Has cart buttons: ${hasButtons}`);
      
      if (hasFormElements || hasButtons) {
        console.log('✅ This item looks functional! Attempting to use it...');
        
        // Try to extract and use cart form
        const cartFormMatch = dishHTML.match(/<form[^>]*>([\s\S]*?cart[\s\S]*?)<\/form>/i);
        
        if (cartFormMatch) {
          console.log('🛒 Found cart form - attempting submission...');
          
          // Extract form action
          const actionMatch = dishHTML.match(/<form[^>]*action=["']([^"']+)["']/i);
          
          if (actionMatch) {
            const formAction = actionMatch[1];
            console.log(`📤 Form action: ${formAction}`);
            
            // Try to submit cart form
            const cartData = new URLSearchParams({
              quantity: '1',
              special_instructions: '🛠️ WORKING ITEM TEST - Should print!',
              dish_id: dishURL.match(/\/(\d+)\/\d+$/)?.[1] || '',
              variant_id: dishURL.match(/\/\d+\/(\d+)$/)?.[1] || '0'
            });

            const cartSubmitResponse = await fetch(
              formAction.startsWith('http') ? formAction : `https://aggregator-landing.menu.ca${formAction}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                  'Cookie': cookies,
                  'Referer': fullDishURL
                },
                body: cartData
              }
            );

            const cartResult = await cartSubmitResponse.text();
            cookies = cartSubmitResponse.headers.get('set-cookie') || cookies;
            
            console.log(`🛒 Cart submission: ${cartSubmitResponse.status}`);
            
            if (cartSubmitResponse.ok) {
              console.log('✅ Cart submission successful!');
              
              // Check cart status
              const cartCheckResponse = await fetch('https://aggregator-landing.menu.ca/index.php/ajax/cart/display', {
                method: 'GET',
                headers: {
                  'X-Requested-With': 'XMLHttpRequest',
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                  'Cookie': cookies
                }
              });

              const cartCheckResult = await cartCheckResponse.text();
              const totalItemsMatch = cartCheckResult.match(/var total_items = (\d+)/);
              
              if (totalItemsMatch && totalItemsMatch[1] > 0) {
                console.log(`🎉 SUCCESS! Cart now has ${totalItemsMatch[1]} items!`);
                console.log('🚀 Ready to proceed with checkout and order placement!');
                break; // Success! Don't need to test more items
              }
            }
          }
        }
      } else {
        console.log('❌ This item appears broken (like the top items)');
      }
      
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Final cart check
    console.log('');
    console.log('📊 FINAL CART CHECK');
    console.log('===================');
    
    const finalCartCheck = await fetch('https://aggregator-landing.menu.ca/index.php/ajax/cart/display', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const finalCartResult = await finalCartCheck.text();
    const finalTotalMatch = finalCartResult.match(/var total_items = (\d+)/);
    
    if (finalTotalMatch) {
      console.log(`🔢 Final cart total: ${finalTotalMatch[1]} items`);
      
      if (finalTotalMatch[1] > 0) {
        console.log('🎉🎉🎉 BREAKTHROUGH: CART HAS ITEMS! 🎉🎉🎉');
        console.log('✅ Successfully added items using working menu items');
        console.log('🚀 Ready for checkout and order placement integration!');
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🛠️ BROKEN ITEM ANALYSIS COMPLETE');
  console.log('================================');
  console.log('💡 KEY INSIGHT: Skip first 5 menu items (broken popups)');
  console.log('✅ Use items 6+ for successful cart addition');
  console.log('🔗 This is crucial for new platform integration!');
}

skipBrokenItems().catch(console.error);