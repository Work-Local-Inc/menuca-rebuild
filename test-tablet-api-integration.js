/**
 * Test script to integrate with tablet.menu.ca API
 * Based on reverse engineering discoveries from APK decompilation
 */

const axios = require('axios');

// Known API endpoints from memory bank discovery
const TABLET_BASE_URL = 'https://tablet.menu.ca';

// Example credentials from memory bank (need real ones from restaurant)
const TEST_CREDENTIALS = {
  rt_key: '689a3cd4216f2', // Example key from memory bank
  rt_designator: 'O33',     // Restaurant designator
  rt_api_version: '13'      // Current API version
};

/**
 * Test authentication with tablet.menu.ca
 */
async function testAuthentication() {
  console.log('🔑 Testing tablet.menu.ca authentication...');
  
  try {
    const response = await axios.post(`${TABLET_BASE_URL}/get_orders.php`, {
      key: TEST_CREDENTIALS.rt_key,
      sw_ver: TEST_CREDENTIALS.rt_api_version,
      api_ver: TEST_CREDENTIALS.rt_api_version
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });
    
    console.log('✅ Authentication response:', response.status);
    console.log('📝 Response data:', response.data);
    return true;
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.status || error.message);
    console.log('📝 Error details:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Send test order to tablet system
 */
async function sendTestOrder() {
  console.log('📱 Sending test order to tablet.menu.ca...');
  
  const testOrder = {
    customer_name: 'Test Customer',
    phone: '555-0123',
    address: '123 Test Street',
    items: [
      {
        name: 'Test Pizza',
        price: 15.99,
        quantity: 1,
        modifiers: []
      }
    ],
    total: 15.99,
    payment_method: 'test',
    order_type: 'delivery'
  };
  
  try {
    const response = await axios.post(`${TABLET_BASE_URL}/action.php`, {
      key: TEST_CREDENTIALS.rt_key,
      order: Date.now().toString(), // Use timestamp as order ID
      action: 'submit', // Likely action name
      order_data: JSON.stringify(testOrder)
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });
    
    console.log('✅ Order submitted:', response.status);
    console.log('📝 Response:', response.data);
    return true;
    
  } catch (error) {
    console.log('❌ Order submission failed:', error.response?.status || error.message);
    console.log('📝 Error details:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Check if server is reachable
 */
async function checkServerStatus() {
  console.log('🌐 Checking tablet.menu.ca server status...');
  
  try {
    const response = await axios.get(TABLET_BASE_URL, { timeout: 5000 });
    console.log('✅ Server is reachable:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Server unreachable:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Starting tablet.menu.ca API integration test...\n');
  
  // Step 1: Check server status
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    console.log('🛑 Cannot proceed - server is not reachable');
    return;
  }
  
  console.log('');
  
  // Step 2: Test authentication
  const authOk = await testAuthentication();
  if (!authOk) {
    console.log('🛑 Cannot proceed - authentication failed');
    console.log('💡 Need to obtain valid rt_key from restaurant');
    return;
  }
  
  console.log('');
  
  // Step 3: Send test order
  const orderOk = await sendTestOrder();
  if (orderOk) {
    console.log('🎉 Success! Order should appear on restaurant tablet');
    console.log('📱 Check your Samsung tablet app for the new order');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAuthentication,
  sendTestOrder,
  checkServerStatus,
  TABLET_BASE_URL,
  TEST_CREDENTIALS
};