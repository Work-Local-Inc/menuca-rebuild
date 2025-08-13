/**
 * 🎯 TEST JAMES DOVERCOURT RESTAURANT
 * 
 * User's tablet shows restaurant: "test James Dovercourt"
 * Let's try exact name matching
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testJamesDovercourt() {
  console.log('🎯 TESTING "test James Dovercourt" RESTAURANT');
  console.log('============================================');
  console.log('From tablet: Restaurant shows as "test James Dovercourt"');
  console.log('Device ID: A19');
  console.log('');

  // Try variations of James Dovercourt restaurant
  const RESTAURANT_VARIATIONS = [
    { id: 'testjamesdovercourt', name: 'Exact name match' },
    { id: 'james-dovercourt', name: 'Hyphenated' },
    { id: 'jamesdovercourt', name: 'No spaces' },
    { id: 'test-james', name: 'First part only' },
    { id: 'dovercourt', name: 'Address part' },
    { id: 'JD', name: 'Initials' },
    { id: 'TD', name: 'Test + Dovercourt' }
  ];

  for (const restaurant of RESTAURANT_VARIATIONS) {
    console.log(`🧪 Testing: ${restaurant.name} (${restaurant.id})`);
    
    try {
      // Generate likely rt_key for this restaurant ID
      const rt_key = `689a${restaurant.id}bef18a4`;
      
      const testOrder = {
        id: `JAMES_DOV_${Date.now()}`,
        restaurant_id: restaurant.id,
        device_id: 'A19',
        customer: {
          name: 'Claude James Dovercourt Test',
          phone: '613-555-0199'
        },
        address: {
          name: 'James Dovercourt Test',
          address1: '2047 Dovercourt Avenue',
          city: 'Ottawa',
          province: 'ON'
        },
        order: [{
          item: `🎯 JAMES DOVERCOURT TEST - ${restaurant.name}`,
          qty: 1,
          price: 28.99
        }],
        total: 28.99
      };

      const params = new URLSearchParams({
        key: rt_key,
        action: 'submit',
        order: JSON.stringify(testOrder),
        api_ver: '13',
        restaurant_id: restaurant.id
      });

      const response = await fetch('https://tablet.menu.ca/action.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
        },
        body: params
      });

      const responseText = await response.text();
      console.log(`   📡 ${response.status} - ${responseText || '(empty)'}`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('');
  console.log('📱 CHECK YOUR SAMSUNG TABLET');
  console.log('============================');
  console.log('Look for orders with "JAMES DOVERCOURT TEST" in the name');
  console.log('If any appear, we found the right restaurant ID!');
}

testJamesDovercourt().catch(console.error);