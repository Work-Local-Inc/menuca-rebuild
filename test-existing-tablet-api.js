/**
 * 🎯 TEST EXISTING TABLET API
 * 
 * You already have a working API at /api/inject-tablet-order
 * Let's test it with a sample order
 */
console.log('🎯 TESTING EXISTING TABLET API');
console.log('==============================');

async function testTabletAPI() {
    console.log('📡 Calling /api/inject-tablet-order...');
    
    // Sample order data matching your API's expected format
    const testOrder = {
        id: `TEST_${Date.now()}`,
        restaurant_id: 'O33', // Using the O33 restaurant from your API
        customer: {
            name: 'Test Customer',
            phone: '555-0123',
            email: 'test@test.com'
        },
        address: {
            name: 'Test Address',
            address1: '123 Test St',
            city: 'Test City',
            province: 'ON',
            postal_code: 'K1A 0A6',
            phone: '555-0123'
        },
        items: [
            {
                name: 'Test Pizza',
                quantity: 1,
                price: 15.99,
                special_instructions: 'Test order from browser'
            }
        ],
        totals: {
            subtotal: 15.99,
            tax: 2.08,
            delivery: 3.00,
            total: 21.07
        },
        payment: {
            method: 'online',
            status: 'succeeded'
        },
        delivery_instructions: 'This is a test order from browser console'
    };
    
    try {
        const response = await fetch('/api/inject-tablet-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order: testOrder
            })
        });
        
        const result = await response.json();
        
        console.log('✅ API RESPONSE:', result);
        
        if (result.success) {
            console.log('🎉 SUCCESS! Order sent to tablet!');
            console.log('📱 CHECK YOUR SAMSUNG TABLET - ORDER SHOULD PRINT NOW!');
        } else {
            console.log('⚠️ API called but success unclear');
            console.log('📱 Check your tablet - order might still have been sent');
            console.log('Debug info:', result.debug_info);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ API call failed:', error);
        return { error: error.message };
    }
}

// Run the test
console.log('🚀 Running tablet API test...');
testTabletAPI().then(result => {
    console.log('🏁 Test completed:', result);
});

// Make function available for manual calling
window.testTabletAPI = testTabletAPI;

console.log('💡 Function available: testTabletAPI()');