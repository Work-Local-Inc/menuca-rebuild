/**
 * 🧪 TEST API CONNECTIVITY
 * 
 * Simple test to verify our API endpoints are working before testing tablet integration
 */
console.log('🧪 TESTING API CONNECTIVITY');
console.log('============================');

async function testAPIConnectivity() {
    console.log('📡 Testing basic API connectivity...');
    
    const testOrderData = {
        id: 'TEST_' + Date.now(),
        customer: {
            name: '*** API TEST - NOT REAL ***',
            phone: '555-TEST',
            email: 'test@menuca.com'
        },
        address: {
            name: '*** API TEST - NOT REAL ***',
            address1: '123 TEST Street - API TEST ONLY',
            city: 'TEST CITY',
            province: 'ON',
            postal_code: 'T3ST 0T3',
            phone: '555-TEST'
        },
        items: [
            {
                id: 'test_item_1',
                name: 'Test Item - API Connectivity',
                price: 10.99,
                quantity: 1,
                special_instructions: 'API connectivity test'
            }
        ],
        totals: {
            subtotal: 10.99,
            tax: 1.43,
            delivery: 0,
            tip: 0,
            total: 12.42
        },
        payment: {
            method: 'Test',
            status: 'test',
            transaction_id: 'test_api_connectivity'
        },
        delivery_instructions: 'API connectivity test - not a real order',
        restaurant_id: 'TEST'
    };

    console.log('📦 Test order data:', testOrderData);
    
    try {
        console.log('🔗 Calling /api/test-tablet-integration...');
        
        const response = await fetch('/api/test-tablet-integration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order: testOrderData })
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Response not OK. Status:', response.status);
            console.log('❌ Error response:', errorText);
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
        }

        const result = await response.json();
        
        console.log('✅ API RESPONSE:', result);
        
        if (result.success) {
            console.log('🎉 API CONNECTIVITY SUCCESS!');
            console.log(`📝 Order ID: ${result.order_id}`);
            console.log(`🏪 Restaurant: ${result.restaurant_id}`);
            console.log('✅ Next step: Test actual tablet integration');
        } else {
            console.log('⚠️ API responded but indicated failure:', result.message);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ API call failed completely:', error);
        console.error('❌ Error details:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the test automatically
console.log('🚀 Running API connectivity test...');
testAPIConnectivity().then(result => {
    console.log('🏁 API connectivity test completed');
    
    if (result.success) {
        console.log('✅ API WORKING! Ready to test tablet integration.');
    } else {
        console.log('❌ API connectivity failed:', result.error);
        console.log('🔧 Need to fix API endpoint before testing tablet integration');
    }
});

// Make function available for manual calling
window.testAPIConnectivity = testAPIConnectivity;

console.log('💡 Function available: testAPIConnectivity()');