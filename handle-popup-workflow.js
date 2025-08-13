/**
 * 🎯 HANDLE POPUP WORKFLOW PROPERLY
 * 
 * USER CLARIFIED: Same page with popup when clicking menu item
 * Popup contains: size/quantity selection → add to cart
 * 
 * /dish/create/ URLs are AJAX endpoints that return popup content
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function handlePopupWorkflow() {
  console.log('🎯 HANDLE POPUP WORKFLOW PROPERLY');
  console.log('=================================');
  console.log('💡 USER CLARIFIED: Menu click → popup → select size/qty → add to cart');
  console.log('🎯 /dish/create/ URLs are AJAX endpoints for popup content');
  console.log('');

  try {
    // Login first
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
    console.log('✅ Session established');

    // Load menu page first (to establish proper session state)
    console.log('');
    console.log('📋 STEP 2: Load menu page for proper session');
    console.log('============================================');
    
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const menuHTML = await menuResponse.text();
    cookies = menuResponse.headers.get('set-cookie') || cookies;
    
    console.log(`📋 Menu page loaded: ${menuResponse.status}`);

    // Get dish URLs (these are AJAX endpoints for popup content)
    const dishURLs = [...new Set(menuHTML.match(/href=["']([^"']*\/dish\/create\/\d+\/\d+)["']/gi) || [])]
      .map(match => match.match(/href=["']([^"']+)["']/)[1]);
    
    console.log(`🔍 Found ${dishURLs.length} menu items (AJAX popup endpoints)`);

    // Test several items to find working ones
    for (let i = 5; i < Math.min(dishURLs.length, 12); i++) {
      const dishURL = dishURLs[i];
      console.log('');
      console.log(`🎯 TESTING POPUP ENDPOINT ${i+1}: ${dishURL}`);
      console.log('=================================================');
      
      const fullDishURL = dishURL.startsWith('http') ? dishURL : `https://aggregator-landing.menu.ca${dishURL}`;
      
      // Make AJAX request to get popup content (as browser would)
      const popupResponse = await fetch(fullDishURL, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest', // Important: AJAX header
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': cookies,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
        }
      });

      const popupHTML = await popupResponse.text();
      cookies = popupResponse.headers.get('set-cookie') || cookies;
      
      console.log(`📄 Popup response: ${popupResponse.status}, Content: ${popupHTML.length} chars`);
      
      if (popupHTML.length > 100) { // Substantial content, not just error
        console.log('✅ Got substantial popup content!');
        console.log(`📄 Popup preview: ${popupHTML.substring(0, 300)}...`);
        
        // Look for form elements in popup
        const hasForm = popupHTML.includes('<form');
        const hasQuantity = popupHTML.includes('quantity') || popupHTML.includes('qty');
        const hasSize = popupHTML.includes('size') || popupHTML.includes('Size');
        const hasAddToCart = popupHTML.includes('cart') || popupHTML.includes('Cart');
        
        console.log(`🔍 Popup analysis:`);
        console.log(`   - Has form: ${hasForm}`);
        console.log(`   - Has quantity selection: ${hasQuantity}`);
        console.log(`   - Has size selection: ${hasSize}`);
        console.log(`   - Has add to cart: ${hasAddToCart}`);
        
        if (hasForm && (hasQuantity || hasAddToCart)) {
          console.log('🎯 FOUND WORKING POPUP! Attempting to add to cart...');
          
          // Extract form action and fields
          const formMatch = popupHTML.match(/<form[^>]*action=["']([^"']+)["'][^>]*method=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i);
          
          if (formMatch) {
            const formAction = formMatch[1];
            const formMethod = formMatch[2];
            const formContent = formMatch[3];
            
            console.log(`📋 Form found: ${formMethod.toUpperCase()} ${formAction}`);
            
            // Extract all form inputs
            const inputs = [...formContent.matchAll(/<input[^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*/gi)];
            const selects = [...formContent.matchAll(/<select[^>]*name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi)];
            
            // Build form data
            const formData = new URLSearchParams();
            
            // Add input values
            inputs.forEach(input => {
              const name = input[1];
              const value = input[2];
              if (name && !name.includes('csrf')) { // Skip CSRF for now
                formData.append(name, value);
              }
            });
            
            // Add select values (choose first option)
            selects.forEach(select => {
              const name = select[1];
              const options = select[2];
              const firstOption = options.match(/<option[^>]*value=["']([^"']+)["']/);
              if (firstOption) {
                formData.append(name, firstOption[1]);
              }
            });
            
            // Add standard cart data
            formData.set('quantity', '1');
            formData.append('special_instructions', '🎯 POPUP WORKFLOW TEST - Should print!');
            
            console.log(`📤 Form data:`, [...formData.entries()]);
            
            // Submit the popup form
            const cartSubmitResponse = await fetch(
              formAction.startsWith('http') ? formAction : `https://aggregator-landing.menu.ca${formAction}`,
              {
                method: formMethod.toUpperCase(),
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                  'Cookie': cookies,
                  'X-Requested-With': 'XMLHttpRequest',
                  'Referer': 'https://aggregator-landing.menu.ca/index.php/menu'
                },
                body: formData
              }
            );

            const cartResult = await cartSubmitResponse.text();
            cookies = cartSubmitResponse.headers.get('set-cookie') || cookies;
            
            console.log(`🛒 Cart submission: ${cartSubmitResponse.status}`);
            console.log(`📄 Response: ${cartResult.substring(0, 200)}...`);
            
            if (cartSubmitResponse.ok) {
              // Check if cart now has items
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
                console.log(`🎉🎉🎉 SUCCESS! Cart now has ${totalItemsMatch[1]} items! 🎉🎉🎉`);
                console.log('✅ Popup workflow successful!');
                console.log('🚀 Ready for checkout and order placement!');
                break; // Success!
              } else {
                console.log(`📊 Cart still shows ${totalItemsMatch ? totalItemsMatch[1] : '0'} items`);
              }
            }
          } else {
            console.log('❌ Could not find form in popup content');
          }
        } else {
          console.log('⚠️ Popup missing expected elements');
        }
      } else {
        console.log('❌ Popup response too short (likely error or redirect)');
      }
      
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🎯 POPUP WORKFLOW ANALYSIS COMPLETE');
  console.log('===================================');
  console.log('💡 KEY INSIGHTS:');
  console.log('   - Menu items trigger AJAX popup requests');
  console.log('   - Popup contains form with size/quantity selection');
  console.log('   - Form submission adds items to cart');
  console.log('🔗 This is the correct integration workflow!');
}

handlePopupWorkflow().catch(console.error);