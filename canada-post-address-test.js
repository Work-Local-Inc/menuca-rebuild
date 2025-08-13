/**
 * 🍁 CANADA POST ADDRESS TEST
 * 
 * USER CLARIFIED: 
 * - Address validated with CP (Canada Post) API
 * - User starts typing in form
 * - Must click suggested address from list that appears
 * 
 * Let me simulate this step by step
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function canadaPostAddressTest() {
  console.log('🍁 CANADA POST ADDRESS VALIDATION TEST');
  console.log('======================================');
  console.log('💡 User clarification: CP API validates address');
  console.log('📝 Process: Type → Get suggestions → Click suggestion');
  console.log('');

  try {
    // Step 1: Get a session from the menu page
    console.log('🌐 STEP 1: Get session from menu page');
    console.log('=====================================');
    
    const menuResponse = await fetch('https://aggregator-landing.menu.ca/index.php/menu', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const menuHTML = await menuResponse.text();
    let cookies = menuResponse.headers.get('set-cookie') || '';
    
    console.log(`📄 Menu loaded: ${menuResponse.status} - ${menuHTML.length} chars`);

    // Step 2: Look for Canada Post address validation endpoints
    console.log('');
    console.log('🔍 STEP 2: Find Canada Post validation endpoints');
    console.log('===============================================');
    
    // Look for autocomplete or address validation endpoints in the HTML
    const autocompleteMatches = menuHTML.match(/url\s*:\s*["']([^"']*address[^"']*)["']/gi) ||
                               menuHTML.match(/action=["']([^"']*address[^"']*)["']/gi) ||
                               menuHTML.match(/["']([^"']*autocomplete[^"']*)["']/gi) || [];
    
    if (autocompleteMatches.length > 0) {
      console.log(`🔍 Found address endpoints:`);
      autocompleteMatches.forEach((match, i) => {
        console.log(`   ${i+1}: ${match}`);
      });
    }

    // Step 3: Simulate typing "407 tatlock" and getting suggestions
    console.log('');
    console.log('📝 STEP 3: Simulate address autocomplete');
    console.log('========================================');
    
    const addressQuery = '407 tatlock rd carleton place on';
    
    // Try different Canada Post / address autocomplete endpoints
    const autocompleteEndpoints = [
      'https://aggregator-landing.menu.ca/address/autocomplete',
      'https://aggregator-landing.menu.ca/index.php/address/autocomplete', 
      'https://aggregator-landing.menu.ca/api/address',
      'https://aggregator-landing.menu.ca/geocode',
      'https://aggregator-landing.menu.ca/validate_address'
    ];

    let addressSuggestions = [];
    
    for (const endpoint of autocompleteEndpoints) {
      try {
        console.log(`🧪 Testing: ${endpoint}`);
        
        const autocompleteResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': cookies
          },
          body: new URLSearchParams({
            query: addressQuery,
            address: addressQuery,
            term: addressQuery
          })
        });

        const autocompleteResult = await autocompleteResponse.text();
        console.log(`   📡 ${autocompleteResponse.status} - ${autocompleteResult.substring(0, 200)}...`);
        
        if (autocompleteResponse.ok && autocompleteResult.includes('tatlock')) {
          console.log('   ✅ Found Canada Post suggestions!');
          addressSuggestions = JSON.parse(autocompleteResult);
          break;
        }
        
      } catch (e) {
        console.log(`   ❌ ${endpoint}: ${e.message}`);
      }
    }

    // Step 4: If we found suggestions, try to "click" the first one
    console.log('');
    console.log('🖱️ STEP 4: Simulate clicking first suggestion');
    console.log('============================================');
    
    if (addressSuggestions.length > 0) {
      const firstSuggestion = addressSuggestions[0];
      console.log(`🎯 Selecting: ${JSON.stringify(firstSuggestion)}`);
      
      // Now try to set this validated address
      const setAddressData = new URLSearchParams({
        address: firstSuggestion.formatted || firstSuggestion.address || '407 Tatlock Rd, Carleton Place, ON K7C 0V2',
        city: 'Carleton Place',
        province: 'ON', 
        postal_code: 'K7C 0V2',
        validated: 'true'
      });

      const setAddressResponse = await fetch('https://aggregator-landing.menu.ca/index.php/check_address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies
        },
        body: setAddressData
      });

      const setAddressResult = await setAddressResponse.text();
      console.log(`📍 Set address: ${setAddressResponse.status} - ${setAddressResult}`);
      
      if (setAddressResult.includes('success') || setAddressResult.includes('valid')) {
        console.log('✅ Address validated successfully!');
      }
    } else {
      // Fallback: try with properly formatted address
      console.log('📍 Fallback: Using properly formatted Canadian address');
      
      const fallbackData = new URLSearchParams({
        address: '407 Tatlock Rd',
        city: 'Carleton Place', 
        province: 'ON',
        postal_code: 'K7C 0V2',
        country: 'CA'
      });

      const fallbackResponse = await fetch('https://aggregator-landing.menu.ca/index.php/check_address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies
        },
        body: fallbackData
      });

      const fallbackResult = await fallbackResponse.text();
      console.log(`📍 Fallback address: ${fallbackResponse.status} - ${fallbackResult}`);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🍁 CANADA POST ADDRESS TEST COMPLETE');
  console.log('====================================');
  console.log('📝 Tested address autocomplete simulation');
  console.log('🎯 This should help understand the validation flow');
  console.log('📍 Need to complete this before proceeding to order placement');
}

canadaPostAddressTest().catch(console.error);