/**
 * 🎯 TEST EXACT SUCCESS FLOW - REPLICATE MANUAL ORDER
 * 
 * This replicates exactly what happens when your manual orders succeed
 * Based on order-success.tsx lines 588-594
 */
console.log('🎯 TESTING EXACT SUCCESS FLOW');
console.log('=============================');

async function testExactSuccessFlow() {
    console.log('📡 Calling /api/inject-tablet-order (same as successful manual orders)...');
    
    // Create order data exactly like order-success.tsx does (lines 543-580)
    const orderData = {
        orderNumber: 'TEST' + Date.now().toString().slice(-6),
        paymentIntentId: 'pi_test_' + Date.now(),
        total: 31.31,
        items: [
            { name: 'Large Pizza Special', quantity: 1, price: 22.99 },
            { name: 'Wings (10pc)', quantity: 1, price: 8.32 }
        ],
        timestamp: new Date().toISOString()
    };

    // Format exactly like order-success.tsx does (lines 543-580)
    const tabletOrder = {
        id: orderData.orderNumber,
        customer: {
            name: 'MenuCA Customer',
            phone: '555-0123',
            email: 'customer@menuca.com'
        },
        address: {
            name: 'MenuCA Customer',
            address1: '123 Customer Street',
            address2: '',
            city: 'Ottawa',
            province: 'ON',
            postal_code: 'K1A 0A6',
            phone: '555-0123'
        },
        items: orderData.items.map(item => ({
            id: item.name.toLowerCase().replace(/\s+/g, '_'),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            special_instructions: ''
        })),
        totals: {
            subtotal: orderData.total / 1.13 / 1.1,
            tax: (orderData.total / 1.13 / 1.1) * 0.13,
            delivery: 2.99,
            tip: 0,
            total: orderData.total
        },
        payment: {
            method: 'Credit Card',
            status: 'succeeded',
            transaction_id: orderData.paymentIntentId
        },
        delivery_instructions: 'Test order from browser console',
        restaurant_id: 'P41' // Using P41 restaurant from your API
    };

    console.log('📦 Order data formatted for tablet:', tabletOrder);
    
    try {
        // Make EXACT same API call as order-success.tsx (lines 588-594)
        const response = await fetch('/api/inject-tablet-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order: tabletOrder })
        });

        const result = await response.json();
        
        console.log('✅ API RESPONSE:', result);
        
        if (result.success) {
            console.log('🎉 SUCCESS! Order sent to tablet system!');
            console.log('📱 CHECK YOUR SAMSUNG TABLET - ORDER SHOULD PRINT NOW!');
            console.log(`Restaurant: ${result.restaurant_id}`);
            console.log(`Order ID: ${result.order_id}`);
        } else {
            console.log('⚠️ API completed but success unclear:', result.message);
            console.log('📱 Check your Samsung tablet anyway - order might still be there');
            console.log('Debug info:', result.debug_info);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ API call failed:', error);
        return { error: error.message };
    }
}

// Run the test automatically
console.log('🚀 Running exact success flow test...');
testExactSuccessFlow().then(result => {
    console.log('🏁 Test completed. Result:', result);
    
    if (result.success) {
        console.log('🎯 SUCCESS! This proves your tablet integration works.');
        console.log('💡 Your Samsung tablet should have received this order');
    } else if (result.error) {
        console.log('❌ API call failed completely');
    } else {
        console.log('⚠️ API responded but unclear if successful');
        console.log('Check your Samsung tablet to see if order appeared');
    }
});

// Make function available for manual calling
window.testExactSuccessFlow = testExactSuccessFlow;

console.log('💡 Function available: testExactSuccessFlow()');