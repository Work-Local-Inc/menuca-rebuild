/**
 * 🧪 TEST STRIPE ORDER FORMAT
 * 
 * Test if we can replicate the exact Stripe order format that triggers tablet printing
 * Using the real order data we found: Order #3754822, Ken Cuerrier, $59.08
 */
console.log('🧪 TESTING STRIPE ORDER FORMAT');
console.log('===============================');

async function testStripeOrderFormat() {
    console.log('📡 Testing with real Stripe order data...');
    
    // Use TEST data that mimics Stripe format but won't confuse live restaurants
    const stripeOrderData = {
        id: 'TEST_' + Date.now(), // Test order ID
        customer: {
            name: '*** TEST ORDER - NOT REAL ***', // Clear test indicator
            phone: '555-TEST',
            email: 'test@menuca.com'
        },
        address: {
            name: '*** TEST ORDER - NOT REAL ***',
            address1: '123 TEST Street - IGNORE THIS ORDER',
            address2: '',
            city: 'TEST CITY',
            province: 'ON',
            postal_code: 'T3ST 0T3',
            phone: '555-TEST'
        },
        items: [
            {
                id: 'test_item_1',
                name: 'Test Pizza Large',
                price: 35.99,
                quantity: 1,
                special_instructions: 'Extra cheese'
            },
            {
                id: 'test_item_2', 
                name: 'Test Wings 10pc',
                price: 23.09,
                quantity: 1,
                special_instructions: ''
            }
        ],
        totals: {
            subtotal: 52.28, // Calculate to match $59.08 total
            tax: 6.80,
            delivery: 0,
            tip: 0,
            total: 59.08 // EXACT amount from Stripe
        },
        payment: {
            method: 'Credit Card',
            status: 'succeeded',
            transaction_id: 'pi_3RvNelKjTadFqIQL1KPUGdYe' // Real Stripe payment intent
        },
        delivery_instructions: 'Test order - replicating Stripe format',
        restaurant_id: 'P41' // Use P41 restaurant that we have credentials for
    };

    console.log('📦 Order formatted for tablet:', stripeOrderData);
    
    try {
        // Call our existing tablet injection API
        const response = await fetch('/api/inject-tablet-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order: stripeOrderData })
        });

        const result = await response.json();
        
        console.log('✅ API RESPONSE:', result);
        
        if (result.success) {
            console.log('🎉 SUCCESS! Stripe order format test passed!');
            console.log('📱 CHECK YOUR SAMSUNG TABLET - Order #3754822 should print now!');
            console.log(`Restaurant: ${result.restaurant_id}`);
            console.log(`Order ID: ${result.order_id}`);
            console.log('💡 This confirms our theory - we can replicate Stripe orders!');
        } else {
            console.log('⚠️ API completed but success unclear:', result.message);
            console.log('🔍 Debug info:', result.debug_info);
            console.log('📱 Still check your Samsung tablet - order might have gone through');
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ API call failed:', error);
        return { error: error.message };
    }
}

// Run the test automatically
console.log('🚀 Running Stripe order format test...');
testStripeOrderFormat().then(result => {
    console.log('🏁 Test completed. Result:', result);
    
    if (result.success) {
        console.log('✅ THEORY CONFIRMED! We can replicate Stripe orders.');
        console.log('🚀 Ready to build full Stripe integration!');
    } else if (result.error) {
        console.log('❌ Test failed - need to debug format/authentication');
    } else {
        console.log('⚠️ Unclear result - check Samsung tablet manually');
    }
});

// Make function available for manual calling
window.testStripeOrderFormat = testStripeOrderFormat;

console.log('💡 Function available: testStripeOrderFormat()');