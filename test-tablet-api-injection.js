/**
 * Test Order Injection into Live tablet.menu.ca System
 * 
 * This script tests API connectivity and attempts to inject a test order
 * into the existing tablet.menu.ca system used by 100 restaurants.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test authentication credentials (discovered from reverse engineering)
const TEST_CREDENTIALS = {
    rt_key: "689a3cd4216f2",      // Example key from analysis
    rt_designator: "O33",          // Example restaurant ID
    rt_api_version: "13"           // Current API version
};

const BASE_URL = "https://tablet.menu.ca";

/**
 * Test API endpoint connectivity
 */
async function testAPIConnectivity() {
    console.log('🔍 TESTING API CONNECTIVITY');
    console.log('============================');
    
    const endpoints = [
        '/action.php',
        '/get_orders.php', 
        '/get_history.php',
        '/update_config.php',
        '/diagnostics.php'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'MenuCA-Integration-Test/1.0'
                },
                body: new URLSearchParams({
                    key: TEST_CREDENTIALS.rt_key,
                    test: 'connectivity'
                })
            });
            
            console.log(`${endpoint}: ${response.status} ${response.statusText}`);
            
            // Try to read response body
            const body = await response.text();
            console.log(`  Response: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
            
        } catch (error) {
            console.log(`${endpoint}: ERROR - ${error.message}`);
        }
        
        console.log('');
    }
}

/**
 * Test authentication with discovered credentials
 */
async function testAuthentication() {
    console.log('🔑 TESTING AUTHENTICATION');
    console.log('=========================');
    
    try {
        const response = await fetch(`${BASE_URL}/get_orders.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MenuCA-Integration-Test/1.0'
            },
            body: new URLSearchParams({
                key: TEST_CREDENTIALS.rt_key,
                sw_ver: 'MenuCA-Integration-1.0',
                api_ver: TEST_CREDENTIALS.rt_api_version
            })
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        const body = await response.text();
        console.log(`Response Body:`);
        console.log(body);
        
        // Try to parse as JSON
        try {
            const json = JSON.parse(body);
            console.log('\\n📊 Parsed JSON Response:');
            console.log(JSON.stringify(json, null, 2));
            
            // Analyze response structure
            if (json.error) {
                console.log('❌ Authentication Error:', json.error);
            } else {
                console.log('✅ Authentication appears successful!');
                if (json.orders) {
                    console.log(`📋 Found ${json.orders.length} existing orders`);
                }
            }
            
        } catch (parseError) {
            console.log('⚠️  Response is not JSON format');
        }
        
    } catch (error) {
        console.log('❌ Authentication test failed:', error.message);
    }
}

/**
 * Attempt test order injection
 */
async function testOrderInjection() {
    console.log('\\n🎯 TESTING ORDER INJECTION');
    console.log('============================');
    
    // Create a test order in expected format (structure TBD)
    const testOrder = {
        id: `TEST_ORDER_${Date.now()}`,
        customer: {
            name: "MenuCA Integration Test",
            phone: "555-0123",
            address: "123 Test Street, Test City, ON K1A 0A6"
        },
        items: [
            {
                id: "test_item_1",
                name: "Test Pizza",
                price: 15.99,
                quantity: 1,
                options: {}
            }
        ],
        total: 15.99,
        timestamp: new Date().toISOString()
    };
    
    try {
        console.log('📝 Test Order Data:');
        console.log(JSON.stringify(testOrder, null, 2));
        
        const response = await fetch(`${BASE_URL}/action.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MenuCA-Integration-Test/1.0'
            },
            body: new URLSearchParams({
                key: TEST_CREDENTIALS.rt_key,
                action: 'submit',  // Guessing action type
                order: JSON.stringify(testOrder),
                api_ver: TEST_CREDENTIALS.rt_api_version
            })
        });
        
        console.log(`\\n📡 Order Injection Response: ${response.status} ${response.statusText}`);
        
        const body = await response.text();
        console.log('Response Body:');
        console.log(body);
        
        // Try to parse response
        try {
            const json = JSON.parse(body);
            console.log('\\n📊 Parsed Response:');
            console.log(JSON.stringify(json, null, 2));
            
            if (json.success || json.ok) {
                console.log('\\n🎉 ORDER INJECTION SUCCESSFUL!');
                console.log('Order should now appear on restaurant tablet!');
            } else if (json.error) {
                console.log('\\n❌ Order injection failed:', json.error);
            }
            
        } catch (parseError) {
            console.log('⚠️  Response is not JSON format');
            
            // Check for common error patterns
            if (body.includes('authentication') || body.includes('unauthorized')) {
                console.log('🔑 Authentication issue detected');
            } else if (body.includes('format') || body.includes('invalid')) {
                console.log('📝 Order format issue detected');
            }
        }
        
    } catch (error) {
        console.log('❌ Order injection test failed:', error.message);
    }
}

/**
 * Test different action types to understand API
 */
async function testActionTypes() {
    console.log('\\n🔄 TESTING DIFFERENT ACTION TYPES');
    console.log('===================================');
    
    const actionTypes = ['test', 'ping', 'status', 'submit', 'create', 'add'];
    
    for (const action of actionTypes) {
        try {
            console.log(`\\nTesting action: "${action}"`);
            
            const response = await fetch(`${BASE_URL}/action.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'MenuCA-Integration-Test/1.0'
                },
                body: new URLSearchParams({
                    key: TEST_CREDENTIALS.rt_key,
                    action: action,
                    order: 'test_order_data',
                    api_ver: TEST_CREDENTIALS.rt_api_version
                })
            });
            
            const body = await response.text();
            console.log(`  ${response.status}: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
            
        } catch (error) {
            console.log(`  ERROR: ${error.message}`);
        }
    }
}

/**
 * Main test execution
 */
async function runTests() {
    console.log('🧪 MENUECA TABLET API INTEGRATION TESTING');
    console.log('==========================================');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Test Key: ${TEST_CREDENTIALS.rt_key}`);
    console.log(`Restaurant: ${TEST_CREDENTIALS.rt_designator}`);
    console.log('');
    
    try {
        // Test 1: Basic connectivity
        await testAPIConnectivity();
        
        // Test 2: Authentication
        await testAuthentication();
        
        // Test 3: Order injection
        await testOrderInjection();
        
        // Test 4: Action types
        await testActionTypes();
        
        console.log('\\n🏁 TESTING COMPLETE');
        console.log('====================');
        console.log('Review the results above to understand:');
        console.log('1. Which endpoints are accessible');
        console.log('2. Whether authentication credentials work');
        console.log('3. What order format is expected');
        console.log('4. Which action types are supported');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Export functions for use in other scripts
module.exports = {
    testAPIConnectivity,
    testAuthentication, 
    testOrderInjection,
    testActionTypes,
    runTests,
    TEST_CREDENTIALS,
    BASE_URL
};

// Run tests if script is executed directly
if (require.main === module) {
    runTests().then(() => {
        console.log('\\n✅ All tests completed');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}