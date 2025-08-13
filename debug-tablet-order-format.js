/**
 * Debug tablet order format and API responses
 * Test different order formats to find what works
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Working O11 credentials
const O11_CREDENTIALS = {
  rt_key: '689a5531a6f31',
  rt_designator: 'O11'
};

async function debugOrderFormat() {
  console.log('🔍 DEBUGGING TABLET ORDER FORMAT');
  console.log('================================');
  console.log(`Using O11 credentials: ${O11_CREDENTIALS.rt_key}`);
  console.log('');

  // Test 1: Simple order format
  console.log('📋 Test 1: Simple Order Format');
  console.log('------------------------------');
  
  const simpleOrder = {
    customer_name: 'Debug Test',
    phone: '613-555-0001',
    total: 25.99,
    items: ['Test Pizza - $25.99']
  };

  await testOrderSubmission('simple', simpleOrder);

  // Test 2: Format matching APK decompilation findings
  console.log('\n📋 Test 2: APK Format (from memory bank)');
  console.log('----------------------------------------');
  
  const apkOrder = {
    id: Date.now().toString(),
    restaurant_id: 'O11',
    delivery_type: 1,
    customer: {
      name: 'APK Format Test',
      phone: '613-555-0002'
    },
    order: [{
      item: 'APK Format Pizza',
      price: 19.99,
      qty: 1
    }],
    total: 19.99
  };

  await testOrderSubmission('apk_format', apkOrder);

  // Test 3: Minimal order format
  console.log('\n📋 Test 3: Minimal Format');
  console.log('-------------------------');
  
  const minimalOrder = {
    action: 'new_order',
    customer: 'Minimal Test',
    total: 15.99
  };

  await testOrderSubmission('minimal', minimalOrder);

  // Test 4: Try different API actions
  console.log('\n📋 Test 4: Different Actions');
  console.log('----------------------------');
  
  const actions = ['submit', 'new', 'create', 'add', 'order'];
  
  for (const action of actions) {
    console.log(`🎬 Testing action: ${action}`);
    
    try {
      const response = await fetch('https://tablet.menu.ca/action.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; Samsung SM-T510) AppleWebKit/537.36'
        },
        body: new URLSearchParams({
          key: O11_CREDENTIALS.rt_key,
          action: action,
          order: 'test_' + Date.now(),
          customer_name: `Test ${action}`,
          total: 10.99
        })
      });

      const text = await response.text();
      console.log(`   📝 ${action}: ${response.status} - ${text || '(empty)'}`);
      
      if (text && text.trim() && text !== '{}') {
        console.log(`   🎉 ${action} returned content: ${text}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${action}: ${error.message}`);
    }
  }

  // Test 5: Check what's in order queue
  console.log('\n📋 Test 5: Order Queue Debug');
  console.log('-----------------------------');
  
  try {
    const queueResponse = await fetch('https://tablet.menu.ca/get_orders.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; Samsung SM-T510) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        key: O11_CREDENTIALS.rt_key,
        sw_ver: '2.0',
        api_ver: '13'
      })
    });

    const queueText = await queueResponse.text();
    console.log(`📥 Queue status: ${queueResponse.status}`);
    console.log(`📋 Queue content: ${queueText || '(empty)'}`);
    
    if (queueText && queueText.trim() && queueText !== '{}') {
      console.log('🎉 FOUND ORDERS IN QUEUE!');
      console.log('📱 Check your Samsung tablet - orders should be there!');
    } else {
      console.log('📭 Queue is empty - orders may not be submitting correctly');
    }
    
  } catch (error) {
    console.log(`❌ Queue check error: ${error.message}`);
  }
}

async function testOrderSubmission(testName, orderData) {
  try {
    const response = await fetch('https://tablet.menu.ca/action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; Samsung SM-T510) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        key: O11_CREDENTIALS.rt_key,
        action: 'submit',
        order: JSON.stringify(orderData),
        api_ver: '13'
      })
    });

    const text = await response.text();
    console.log(`📝 ${testName}: ${response.status} - ${text || '(empty)'}`);
    
    if (text && text.trim() && text !== '{}' && !text.includes('error')) {
      console.log(`🎉 ${testName} may have worked! Response: ${text}`);
    }
    
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
  }
}

// Run debug
debugOrderFormat().catch(console.error);