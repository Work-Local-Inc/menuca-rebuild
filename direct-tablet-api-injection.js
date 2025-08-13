/**
 * 🎯 DIRECT TABLET API INJECTION
 * 
 * Based on memory bank discovery: decision_MENUECA_API_ENDPOINTS_DISCOVERY_2025-08-11T18-00-00.json
 * This bypasses the frontend completely and sends orders directly to tablet.menu.ca
 */
console.log('🎯 DIRECT TABLET API INJECTION');
console.log('===============================');

// From memory bank - discovered API endpoints and authentication
const TABLET_API = {
    baseUrl: 'https://tablet.menu.ca',
    endpoints: {
        submitOrder: '/action.php',
        getOrders: '/get_orders.php',
        updateConfig: '/update_config.php'
    },
    authentication: {
        // These are the actual keys found in memory bank
        rt_key: '689a3cd4216f2', // Restaurant-specific API key
        rt_designator: 'O33',     // Restaurant identifier
        rt_api_version: '13'      // Current API version
    }
};

// Function to inject order directly to tablet system
async function injectOrderToTablet(orderData) {
    console.log('📡 Injecting order directly to tablet.menu.ca API...');
    
    const orderPayload = {
        key: TABLET_API.authentication.rt_key,
        order: orderData.orderId || Date.now(), // Use timestamp as order ID if not provided
        action: 'submit', // Action for order submission
        // Add the complete order data
        customer_name: orderData.customerName || 'Web Customer',
        customer_phone: orderData.customerPhone || '',
        items: JSON.stringify(orderData.items || []),
        total: orderData.total || 0,
        payment_method: orderData.paymentMethod || 'online',
        order_type: orderData.orderType || 'delivery',
        timestamp: new Date().toISOString()
    };
    
    try {
        // Make direct API call to tablet.menu.ca
        const response = await fetch(`${TABLET_API.baseUrl}${TABLET_API.endpoints.submitOrder}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MenuCA-Integration/1.0'
            },
            body: new URLSearchParams(orderPayload)
        });
        
        const result = await response.text();
        console.log('✅ API Response:', result);
        
        if (response.ok) {
            console.log('🎉 ORDER SUCCESSFULLY INJECTED TO TABLET SYSTEM!');
            console.log('📱 Check your Samsung tablet - order should print now');
            return { success: true, response: result };
        } else {
            console.log('❌ API call failed:', response.status, result);
            return { success: false, error: result };
        }
        
    } catch (error) {
        console.log('❌ Network error:', error.message);
        return { success: false, error: error.message };
    }
}

// Test with sample order data (replace with real cart data)
function testOrderInjection() {
    const testOrder = {
        orderId: `WEB_${Date.now()}`,
        customerName: 'Test Customer',
        customerPhone: '555-0123',
        items: [
            {
                name: 'Test Pizza',
                quantity: 1,
                price: 15.99,
                modifications: []
            }
        ],
        total: 15.99,
        paymentMethod: 'online',
        orderType: 'delivery'
    };
    
    console.log('🧪 Testing with sample order...');
    return injectOrderToTablet(testOrder);
}

// Function to get current cart data from page (if available)
function extractCartData() {
    console.log('🛒 Extracting cart data from current page...');
    
    // Try to find cart items on current page
    const cartItems = [];
    const itemElements = document.querySelectorAll('[data-item], .cart-item, .order-item');
    
    itemElements.forEach(item => {
        const name = item.querySelector('[data-name], .item-name')?.textContent?.trim();
        const price = item.querySelector('[data-price], .item-price')?.textContent?.trim();
        const quantity = item.querySelector('[data-quantity], .item-quantity')?.textContent?.trim();
        
        if (name && price) {
            cartItems.push({
                name,
                price: parseFloat(price.replace(/[^0-9.]/g, '')) || 0,
                quantity: parseInt(quantity) || 1
            });
        }
    });
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
        orderId: `WEB_${Date.now()}`,
        customerName: 'Web Customer',
        items: cartItems,
        total: total,
        paymentMethod: 'online',
        orderType: 'delivery'
    };
}

// Main execution
console.log('🚀 READY TO INJECT ORDER TO TABLET');
console.log('===================================');
console.log('This will send the order directly to tablet.menu.ca API');
console.log('Your Samsung tablet should receive and print it automatically');

// Make functions available for manual calling
window.injectOrderToTablet = injectOrderToTablet;
window.testOrderInjection = testOrderInjection;
window.extractCartData = extractCartData;

// Auto-run with current cart data
const currentCart = extractCartData();
if (currentCart.items.length > 0) {
    console.log('📦 Found cart data, injecting order...');
    injectOrderToTablet(currentCart).then(result => {
        if (result.success) {
            console.log('✅ SUCCESS! Order should appear on tablet');
        } else {
            console.log('❌ Failed. Try testOrderInjection() for debugging');
        }
    });
} else {
    console.log('🛒 No cart data found. Use testOrderInjection() to test with sample data');
}

console.log('\n💡 Manual functions available:');
console.log('- testOrderInjection() - Test with sample order');
console.log('- extractCartData() - Get current page cart data'); 
console.log('- injectOrderToTablet(orderData) - Inject custom order');