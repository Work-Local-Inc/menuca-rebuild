/**
 * 🎯 A19 DIRECT LOGIN TEST
 * 
 * BREAKTHROUGH: System uses rt_designator cookies!
 * Let's try to force login as A19 tablet
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testA19Login() {
  console.log('🎯 TESTING A19 DIRECT LOGIN');
  console.log('==========================');
  console.log('Goal: Force authentication as A19 tablet');
  console.log('');

  // Try to force A19 credentials
  const A19_TESTS = [
    {
      method: 'Direct cookie set',
      cookies: 'rt_designator=A19; rt_key=689aa19bef18a4'
    },
    {
      method: 'Login form with A19',
      loginData: {
        device_id: 'A19',
        rt_designator: 'A19',
        rt_key: '689aa19bef18a4',
        action: 'login'
      }
    },
    {
      method: 'URL parameter auth',
      url: 'https://tablet.menu.ca/app.php?rt_designator=A19&rt_key=689aa19bef18a4'
    }
  ];

  for (const test of A19_TESTS) {
    console.log(`🧪 Testing: ${test.method}`);
    
    try {
      let response;
      
      if (test.cookies) {
        // Test with direct cookie setting
        response = await fetch('https://tablet.menu.ca/app.php', {
          method: 'GET',
          headers: {
            'Cookie': test.cookies,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
          }
        });
      } else if (test.loginData) {
        // Test with login form POST
        const formData = new URLSearchParams(test.loginData);
        response = await fetch('https://tablet.menu.ca/app.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
          },
          body: formData
        });
      } else if (test.url) {
        // Test with URL parameters
        response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
          }
        });
      }

      const responseText = await response.text();
      const responseCookies = response.headers.get('set-cookie');
      
      console.log(`   📡 Response: ${response.status}`);
      console.log(`   🍪 Cookies: ${responseCookies || 'None'}`);
      console.log(`   📄 Content: ${responseText.length} chars`);
      
      if (responseCookies && responseCookies.includes('rt_designator=A19')) {
        console.log('   🎉 SUCCESS: Got A19 authentication!');
        
        // Now try to submit order with A19 session
        console.log('   📤 Submitting test order with A19 session...');
        
        const testOrder = {
          id: `A19_LOGIN_${Date.now()}`,
          restaurant_id: 'A19',
          device_id: 'A19',
          delivery_type: 1,
          customer: {
            name: 'Claude A19 Login Test',
            phone: '613-555-0199',
            email: 'claude@menuca.com'
          },
          address: {
            name: 'A19 Login Test',
            address1: '2047 Dovercourt Avenue',
            city: 'Ottawa',
            province: 'ON',
            postal_code: 'K2A-0X2',
            phone: '613-555-0199'
          },
          order: [{
            item: '🎯 A19 LOGIN SUCCESS - Direct Authentication',
            type: 'Food',
            qty: 1,
            price: 33.99,
            special_instructions: 'BREAKTHROUGH: Successfully logged in as A19 tablet!'
          }],
          price: {
            subtotal: 33.99,
            tax: 4.42,
            delivery: 4.99,
            tip: 6.50,
            total: 49.90
          },
          payment_method: 'Credit Card',
          payment_status: 1,
          comment: '🚀 A19 AUTHENTICATED ORDER: This should appear on your tablet!',
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
            'Cookie': responseCookies,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
          },
          body: orderParams
        });

        const orderText = await orderResponse.text();
        console.log(`   📋 A19 ORDER: ${orderResponse.status} - ${orderText || '(empty)'}`);
        
        if (orderResponse.ok) {
          console.log('   🎉 A19 AUTHENTICATED ORDER SUBMITTED!');
        }
        
        break; // Success, no need to try other methods
      } else {
        console.log(`   ❌ No A19 authentication`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('📱 CRITICAL CHECK TIME');
  console.log('=====================');
  console.log('If A19 authentication worked, check your Samsung tablet for:');
  console.log('Order: "A19 LOGIN SUCCESS - Direct Authentication" ($49.90)');
  console.log('Customer: Claude A19 Login Test');
  console.log('Address: 2047 Dovercourt Avenue');
  console.log('');
  console.log('🤞 This should be the breakthrough we need!');
}

testA19Login().catch(console.error);