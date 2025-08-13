/**
 * 🔍 FIND THE CORRECT BACKEND PATH
 * 
 * User is right - system works for 100 clients, we just need correct path
 * Let's systematically check v1 vs v2 backend endpoints
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function findCorrectBackend() {
  console.log('🔍 SYSTEMATIC BACKEND PATH DISCOVERY');
  console.log('===================================');
  console.log('Goal: Find the working backend path that 100 clients use');
  console.log('');

  // Test different backend versions and paths
  const BACKEND_PATHS = [
    // V1 vs V2 paths
    'https://tablet.menu.ca/v1/action.php',
    'https://tablet.menu.ca/v2/action.php',
    'https://tablet.menu.ca/api/v1/action.php',
    'https://tablet.menu.ca/api/v2/action.php',
    
    // Different domain variations
    'https://api.menu.ca/tablet/action.php',
    'https://backend.menu.ca/action.php',
    'https://tablet-api.menu.ca/action.php',
    
    // Aggregator paths (since we know this works)
    'https://aggregator-admin.menu.ca/api/orders',
    'https://aggregator-admin.menu.ca/tablet/submit',
    'https://aggregator-landing.menu.ca/api/orders',
    
    // Admin backend paths
    'https://menuadmin.menu.ca/api/orders',
    'https://admin.menu.ca/tablet/orders'
  ];

  for (const path of BACKEND_PATHS) {
    console.log(`🧪 Testing: ${path}`);
    
    try {
      // Test with O11 credentials (if those are real tablet creds)
      const testParams = new URLSearchParams({
        key: '689a5531a6f31',
        restaurant_id: 'O11',
        action: 'test_connection',
        api_ver: '13'
      });

      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
        },
        body: testParams
      });

      const responseText = await response.text();
      console.log(`   📡 ${response.status} - ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
      
      if (response.status !== 404 && responseText && responseText !== '{}') {
        console.log(`   ✅ POTENTIAL WORKING BACKEND!`);
        
        // If we found a working backend, test order submission
        const orderTest = {
          id: `BACKEND_TEST_${Date.now()}`,
          restaurant_id: 'O11',
          customer: { name: 'Backend Test', phone: '613-555-0199' },
          order: [{ item: 'Backend Discovery Test', qty: 1, price: 25.99 }],
          total: 25.99
        };

        const orderParams = new URLSearchParams({
          key: '689a5531a6f31',
          action: 'submit',
          order: JSON.stringify(orderTest),
          api_ver: '13'
        });

        const orderResponse = await fetch(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
          },
          body: orderParams
        });

        const orderText = await orderResponse.text();
        console.log(`   📋 ORDER TEST: ${orderResponse.status} - ${orderText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  console.log('🔍 CREDENTIAL VERIFICATION');
  console.log('==========================');
  console.log('Need to confirm: Are O11/689a5531a6f31 YOUR tablet credentials?');
  console.log('Or were those from a different browser session?');
  console.log('');
  console.log('📱 NEXT STEPS:');
  console.log('1. Confirm source of O11 credentials');  
  console.log('2. Get actual tablet credentials if different');
  console.log('3. Test working backend paths with correct credentials');
}

findCorrectBackend().catch(console.error);