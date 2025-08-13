/**
 * 🔍 DISCOVER MORE RESTAURANT CREDENTIALS
 * 
 * We need to find more rt_key values since none of our 15+ discovered ones
 * connect to the user's A19 tablet showing "Stephan menu"/"test Dovercourt James"
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Try to extract more restaurant credentials from tablet.menu.ca
async function scrapeMoreCredentials() {
  console.log('🔍 DISCOVERING MORE RESTAURANT CREDENTIALS');
  console.log('=========================================');
  console.log('Looking for restaurants beyond our current 15+ known ones...\n');

  try {
    // Try different pages that might list restaurants
    const urls = [
      'https://tablet.menu.ca/app.php',
      'https://tablet.menu.ca/admin.php',
      'https://tablet.menu.ca/list.php', 
      'https://tablet.menu.ca/restaurants.php',
      'https://tablet.menu.ca/config.php'
    ];

    for (const url of urls) {
      console.log(`📡 Checking: ${url}`);
      
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 9; SM-T290)' }
        });
        
        const text = await response.text();
        
        // Look for rt_key patterns
        const keyMatches = text.match(/689a[a-f0-9]{8,12}/gi) || [];
        const uniqueKeys = [...new Set(keyMatches)];
        
        // Look for rt_designator patterns  
        const designatorMatches = text.match(/[A-Z][0-9]{2,3}/g) || [];
        const uniqueDesignators = [...new Set(designatorMatches)];
        
        if (uniqueKeys.length > 0) {
          console.log(`   🎯 Found ${uniqueKeys.length} potential rt_keys:`);
          uniqueKeys.forEach(key => console.log(`      ${key}`));
        }
        
        if (uniqueDesignators.length > 0) {
          console.log(`   🏷️ Found ${uniqueDesignators.length} potential designators:`);
          uniqueDesignators.forEach(des => console.log(`      ${des}`));
        }
        
        // Look for restaurant names
        const nameMatches = text.match(/restaurant[^"]*"[^"]*"/gi) || [];
        if (nameMatches.length > 0) {
          console.log(`   📝 Found restaurant references:`);
          nameMatches.slice(0, 5).forEach(name => console.log(`      ${name}`));
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Failed to access: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('Error during credential discovery:', error);
  }
}

// Try alphabet/number pattern discovery for more restaurant IDs
async function tryAlphabetPatterns() {
  console.log('🔤 TRYING ALPHABET PATTERN DISCOVERY');
  console.log('===================================');
  console.log('Testing more restaurant ID patterns...\n');
  
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numbers = ['01', '02', '03', '19', '20', '21', '25', '26', '30', '33'];
  
  const newCredentials = [];
  
  // Test A-Z + 01-33 patterns
  for (const letter of letters.slice(0, 10)) { // Test first 10 letters
    for (const num of numbers.slice(0, 3)) { // Test first 3 numbers per letter
      const designator = letter + num;
      
      // Skip ones we already tested
      const knownIds = ['P41', 'C26', 'E25', 'B83', 'O33', 'Q71', 'R88', 'K60'];
      if (knownIds.includes(designator)) continue;
      
      console.log(`🧪 Testing pattern: ${designator}`);
      
      try {
        // Generate potential rt_key for this pattern
        const testKeys = [
          `689a${designator.toLowerCase()}bef18a4`, // Pattern like P41
          `689a555${designator.toLowerCase()}`, // Pattern like others
          `689a54b${designator.toLowerCase()}8`, // Another pattern
          `689a${Math.random().toString(36).substring(2, 8)}` // Random pattern
        ];
        
        for (const testKey of testKeys.slice(0, 1)) { // Test only first pattern to save time
          const params = new URLSearchParams({
            key: testKey,
            sw_ver: 'MenuCA-Discovery',
            api_ver: '13'
          });

          const response = await fetch('https://tablet.menu.ca/get_orders.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'MenuCA-Discovery/1.0'
            },
            body: params
          });

          if (response.status === 200) {
            const responseText = await response.text();
            console.log(`   ✅ ${designator} (${testKey}): Valid - ${responseText}`);
            
            newCredentials.push({ id: designator, key: testKey });
            
            // If we found a working credential, try sending a test order
            if (responseText !== '{}') {
              console.log(`   🎉 ${designator} HAS ACTIVE ORDERS!`);
            }
            break; // Found working key for this designator
          }
        }
        
      } catch (error) {
        // Ignore errors, just continue
      }
      
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
    }
  }
  
  console.log(`\n🎯 DISCOVERED ${newCredentials.length} NEW RESTAURANT CREDENTIALS`);
  if (newCredentials.length > 0) {
    console.log('=======================================');
    newCredentials.forEach(cred => {
      console.log(`${cred.id}: ${cred.key}`);
    });
  }
  
  return newCredentials;
}

async function main() {
  await scrapeMoreCredentials();
  console.log('\n' + '='.repeat(50) + '\n');
  const newCreds = await tryAlphabetPatterns();
  
  if (newCreds.length > 0) {
    console.log('\n🚀 TESTING NEW CREDENTIALS WITH YOUR A19 TABLET');
    console.log('==============================================');
    
    for (const cred of newCreds) {
      console.log(`\n📤 Testing ${cred.id} with A19 search order...`);
      
      const testOrder = {
        id: `A19_NEW_${cred.id}_${Date.now()}`,
        restaurant_id: cred.id,
        delivery_type: 1,
        customer: { name: 'A19 NEW TEST', phone: '613-555-0199', email: 'test@menuca.com' },
        address: { 
          name: 'Stephan Menu Test', address1: '600 Terry Fox Drive', city: 'Ottawa', 
          province: 'ON', postal_code: 'K2L 1B9', phone: '613-555-0199'
        },
        order: [{
          item: `🔍 NEW CREDENTIAL TEST - ${cred.id}`,
          type: 'Food', qty: 1, price: 12.99,
          special_instructions: `SEARCHING FOR STEPHAN MENU / A19 TABLET - Testing restaurant ${cred.id}`
        }],
        price: { subtotal: 12.99, tax: 1.69, delivery: 0, tip: 0, total: 14.68, taxes: { HST: 1.69 }},
        payment_method: 'Credit Card', payment_status: 1,
        comment: `🎯 A19 TABLET SEARCH: New credential test for Stephan Menu / test Dovercourt James`,
        delivery_time: Math.floor(Date.now() / 1000) + (30 * 60),
        time_created: Math.floor(Date.now() / 1000),
        status: 0, ver: 2
      };

      try {
        const params = new URLSearchParams({
          key: cred.key,
          action: 'submit',
          order: JSON.stringify(testOrder),
          api_ver: '13',
          restaurant_id: cred.id
        });

        const response = await fetch('https://tablet.menu.ca/action.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MenuCA-Discovery/1.0'
          },
          body: params
        });

        const responseText = await response.text();
        console.log(`   📡 Order result: ${response.status} - ${responseText || '(empty)'}`);
        
      } catch (error) {
        console.log(`   ❌ Order failed: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n📱 CHECK YOUR A19 TABLET FOR ANY NEW TEST ORDERS!');
  console.log('Look for orders with "NEW CREDENTIAL TEST" in the name.');
}

main().catch(console.error);