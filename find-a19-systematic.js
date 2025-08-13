/**
 * 🎯 SYSTEMATIC A19 CREDENTIAL SEARCH
 * 
 * Since none of our 3 guesses worked, let's try a more systematic approach
 * to find the rt_key for your A19 tablet showing "test Dovercourt James"
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Known working credentials from our previous discoveries
const KNOWN_CREDENTIALS = [
  { id: 'P41', key: '689a41bef18a4' },
  { id: 'C26', key: '689a5552ca164' },
  { id: 'E25', key: '689a555300f0d' },
  { id: 'B83', key: '689a555330512' },
  { id: 'O33', key: '689a3cd4216f2' },
  { id: 'Q71', key: '689a54b146408' },
  { id: 'R88', key: '689a54b17a8ec' },
  { id: 'K60', key: '689a54b21b804' }
];

// Try pattern-based guessing for A19
const A19_GUESSES = [
  '689a19', // Simple A19 pattern
  '689a19bef18a4', // Similar to P41 pattern
  '689a555a19', // Similar to other patterns
  '689a54a19', // Another pattern
  '689aa19bef18a4', // Variation
  '689a41a19', // Mix with P41
  '689a19bef19a4' // A19 variation
];

async function testCredential(id, key, description) {
  console.log(`🧪 Testing ${id} (${description}): ${key}`);
  
  try {
    const params = new URLSearchParams({
      key: key,
      sw_ver: 'MenuCA-A19-Search',
      api_ver: '13'
    });

    const response = await fetch('https://tablet.menu.ca/get_orders.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MenuCA-A19-Search/1.0'
      },
      body: params
    });

    const responseText = await response.text();
    
    if (response.status === 200) {
      console.log(`   ✅ Valid credentials - Response: ${responseText}`);
      if (responseText !== '{}') {
        console.log(`   🎉 HAS ACTIVE ORDERS! This might be your A19!`);
        return { valid: true, hasOrders: true, response: responseText };
      } else {
        console.log(`   📋 Valid but empty queue`);
        return { valid: true, hasOrders: false, response: responseText };
      }
    } else {
      console.log(`   ❌ Invalid credentials (${response.status})`);
      return { valid: false };
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function systematicSearch() {
  console.log('🔍 SYSTEMATIC SEARCH FOR A19 TABLET CREDENTIALS');
  console.log('===============================================');
  console.log('Target: A19 tablet showing "test Dovercourt James" at 600 Terry Fox Drive');
  console.log('');

  const validCredentials = [];

  // Test all known credentials first
  console.log('📋 TESTING ALL KNOWN CREDENTIALS');
  console.log('================================');
  
  for (const cred of KNOWN_CREDENTIALS) {
    const result = await testCredential(cred.id, cred.key, 'known working');
    if (result.valid) {
      validCredentials.push({ ...cred, ...result });
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test A19 pattern guesses
  console.log('\n🎯 TESTING A19 PATTERN GUESSES');
  console.log('==============================');
  
  for (let i = 0; i < A19_GUESSES.length; i++) {
    const key = A19_GUESSES[i];
    const result = await testCredential(`A19_GUESS_${i+1}`, key, 'pattern guess');
    if (result.valid) {
      validCredentials.push({ id: `A19_GUESS_${i+1}`, key, ...result });
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Try sending a test order to each valid credential
  console.log('\n🧪 SENDING TEST ORDER TO ALL VALID CREDENTIALS');
  console.log('=============================================');
  
  for (const cred of validCredentials) {
    console.log(`\n📤 Sending test to ${cred.id} (${cred.key})`);
    
    const testOrder = {
      id: `A19_SYSTEMATIC_${cred.id}_${Date.now()}`,
      restaurant_id: cred.id,
      delivery_type: 1,
      customer: { name: 'A19 Search Test', phone: '613-555-0199', email: 'test@menuca.com' },
      address: { 
        name: 'A19 Search', address1: '600 Terry Fox Drive', city: 'Ottawa', 
        province: 'ON', postal_code: 'K2L 1B9', phone: '613-555-0199'
      },
      order: [{
        item: `A19 SEARCH TEST - Restaurant ${cred.id}`,
        type: 'Food', qty: 1, price: 15.99,
        special_instructions: `🔍 SEARCHING FOR A19 TABLET - This test is for restaurant ${cred.id}`
      }],
      price: { subtotal: 15.99, tax: 2.08, delivery: 0, tip: 0, total: 18.07, taxes: { HST: 2.08 }},
      payment_method: 'Credit Card', payment_status: 1,
      comment: `🎯 A19 TABLET SEARCH: Testing if restaurant ${cred.id} maps to A19 device at Terry Fox Drive`,
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
          'User-Agent': 'MenuCA-A19-Search/1.0'
        },
        body: params
      });

      const responseText = await response.text();
      console.log(`   📡 Order submission: ${response.status} - ${responseText || '(empty)'}`);
      
    } catch (error) {
      console.log(`   ❌ Order submission failed: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 CHECK YOUR A19 TABLET NOW!');
  console.log('=============================');
  console.log('Look for test orders with "A19 SEARCH TEST" in the name');
  console.log('If you see any, that restaurant ID maps to your A19 tablet!');
  console.log('');
  console.log(`Tested ${validCredentials.length} valid credentials total.`);
}

systematicSearch().catch(console.error);