/**
 * 🍪 COOKIE AUTHENTICATION TEST
 * 
 * BREAKTHROUGH: APK uses cookies, not API keys!
 * The tablet loads tablet.menu.ca/app.php and stores cookies for auth
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCookieAuth() {
  console.log('🍪 TESTING COOKIE AUTHENTICATION');
  console.log('================================');
  console.log('APK loads tablet.menu.ca/app.php and uses cookies for auth');
  console.log('Let\'s simulate the exact tablet authentication flow...');
  console.log('');

  // Step 1: Load the main app page to establish session
  console.log('📱 STEP 1: Loading tablet.menu.ca/app.php (like APK does)');
  try {
    const appResponse = await fetch('https://tablet.menu.ca/app.php', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
      }
    });

    console.log(`   📡 App page: ${appResponse.status}`);
    
    // Extract cookies from response
    const cookies = appResponse.headers.get('set-cookie');
    console.log(`   🍪 Cookies: ${cookies || 'None'}`);
    
    const appText = await appResponse.text();
    console.log(`   📄 Page content: ${appText.length} characters`);
    
    if (appText.includes('login') || appText.includes('auth')) {
      console.log('   🔐 Page requires authentication - need to login first');
      
      // Step 2: Try to find login form or authentication method
      console.log('');
      console.log('📱 STEP 2: Looking for authentication mechanism...');
      
      // Check if there's a login endpoint
      const loginTest = await fetch('https://tablet.menu.ca/login.php', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
        }
      });
      
      console.log(`   📡 Login page: ${loginTest.status}`);
      
      if (loginTest.ok) {
        const loginText = await loginTest.text();
        console.log(`   📄 Login page: ${loginText.length} characters`);
        
        // Look for rt_key or device_id authentication
        if (loginText.includes('rt_key') || loginText.includes('device')) {
          console.log('   🔑 Found authentication mechanism!');
          
          // Step 3: Authenticate with A19 credentials
          console.log('');
          console.log('📱 STEP 3: Authenticating with A19 tablet credentials...');
          
          const authData = new URLSearchParams({
            device_id: 'A19',
            rt_key: '689a19bef18a4', // Our best A19 credential
            action: 'login'
          });
          
          const authResponse = await fetch('https://tablet.menu.ca/login.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
            },
            body: authData
          });
          
          console.log(`   📡 Auth response: ${authResponse.status}`);
          const authCookies = authResponse.headers.get('set-cookie');
          console.log(`   🍪 Auth cookies: ${authCookies || 'None'}`);
          
          if (authResponse.ok && authCookies) {
            console.log('   ✅ AUTHENTICATION SUCCESSFUL!');
            
            // Step 4: Use authenticated cookies to submit order
            console.log('');
            console.log('📱 STEP 4: Submitting order with authenticated session...');
            
            const testOrder = {
              id: `COOKIE_AUTH_${Date.now()}`,
              restaurant_id: 'A19',
              device_id: 'A19',
              delivery_type: 1,
              customer: {
                name: 'Claude Cookie Auth Test',
                phone: '613-555-0199',
                email: 'claude@menuca.com'
              },
              address: {
                name: 'Cookie Auth Test',
                address1: '2047 Dovercourt Avenue',
                city: 'Ottawa',
                province: 'ON',
                postal_code: 'K2A-0X2',
                phone: '613-555-0199'
              },
              order: [{
                item: '🍪 COOKIE AUTHENTICATION TEST - A19 Tablet',
                type: 'Food',
                qty: 1,
                price: 31.99,
                special_instructions: 'BREAKTHROUGH: Using proper cookie authentication flow!'
              }],
              price: {
                subtotal: 31.99,
                tax: 4.16,
                delivery: 4.99,
                tip: 6.00,
                total: 47.14
              },
              payment_method: 'Credit Card',
              payment_status: 1,
              comment: '🎯 COOKIE AUTH TEST: This should work with proper session cookies!',
              delivery_time: Math.floor(Date.now() / 1000) + (45 * 60),
              time_created: Math.floor(Date.now() / 1000),
              status: 0,
              ver: 2
            };

            const orderParams = new URLSearchParams({
              action: 'submit',
              order: JSON.stringify(testOrder)
            });

            const orderResponse = await fetch('https://tablet.menu.ca/action.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': authCookies,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
              },
              body: orderParams
            });

            const orderText = await orderResponse.text();
            console.log(`   📋 COOKIE ORDER: ${orderResponse.status} - ${orderText || '(empty)'}`);
            
            if (orderResponse.ok) {
              console.log('   🎉 COOKIE AUTHENTICATED ORDER SUBMITTED!');
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Cookie auth error: ${error.message}`);
  }

  console.log('');
  console.log('🔍 COOKIE AUTHENTICATION ANALYSIS');
  console.log('=================================');
  console.log('The APK is just a WebView that:');
  console.log('1. Loads tablet.menu.ca/app.php');
  console.log('2. Manages authentication through cookies');
  console.log('3. No direct API calls - everything through web interface');
  console.log('');
  console.log('💡 This explains why our API calls get HTTP 200 but no orders!');
  console.log('We need to authenticate through the web interface first.');
}

testCookieAuth().catch(console.error);