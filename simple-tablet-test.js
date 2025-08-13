/**
 * 🧪 SIMPLE TABLET TEST - RELIABLE VERSION
 * 
 * Copy/paste this entire script into browser console
 * Should work without returning "undefined"
 */

// Test function that handles promises properly
function testTabletNow() {
    console.log('🧪 Starting tablet integration test...');
    
    const testOrder = { 
        id: 'TEST_' + Date.now(), 
        customer: { name: '*** TEST ORDER - NOT REAL ***' }, 
        restaurant_id: 'P41' 
    };
    
    console.log('📦 Test order:', testOrder);
    
    fetch('/api/inject-tablet-order', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ order: testOrder }) 
    })
    .then(response => {
        console.log('📊 Response status:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('✅ API Result:', result);
        
        if (result.success) {
            console.log('🎉 SUCCESS! Check your Samsung tablet now!');
        } else if (result.error) {
            console.log('❌ ERROR:', result.error);
        } else {
            console.log('⚠️ Unclear result - check tablet manually');
        }
        
        return result;
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        return { error: error.message };
    });
    
    return 'Test started - check console for results';
}

// Run the test immediately
console.log('🚀 Running tablet test now...');
testTabletNow();