/**
 * 🎯 SKIP DEALS - DIRECT CHECKOUT
 * 
 * Avoid all promotional/deal elements and go straight to basic order placement
 */
console.log('🎯 SKIPPING DEALS - DIRECT CHECKOUT');
console.log('===================================');

function directCheckoutOnly() {
    console.log('🚫 Avoiding all deal/coupon/promotional elements...');
    
    // Method 1: Look for basic checkout button that doesn't trigger deals
    const checkoutButtons = document.querySelectorAll('button, input[type="submit"], a');
    let basicCheckoutButton = null;
    
    for (let btn of checkoutButtons) {
        const text = (btn.textContent || btn.value || '').toLowerCase();
        const classes = btn.className.toLowerCase();
        
        // Look for checkout button that's NOT related to deals/coupons
        if (text.includes('checkout') || text.includes('place order')) {
            // Skip if it's related to deals/coupons/promotions
            if (!text.includes('deal') && !text.includes('coupon') && !text.includes('promo') &&
                !classes.includes('deal') && !classes.includes('coupon') && !classes.includes('promo')) {
                basicCheckoutButton = btn;
                console.log('✅ Found basic checkout button:', text);
                break;
            }
        }
    }
    
    if (basicCheckoutButton) {
        console.log('🔘 Clicking basic checkout button...');
        basicCheckoutButton.click();
        return true;
    }
    
    // Method 2: Look for cart total and proceed button near it
    const cartTotalElements = document.querySelectorAll('[class*="total"], [id*="total"]');
    for (let totalEl of cartTotalElements) {
        // Look for buttons near the total
        const nearbyButtons = totalEl.parentElement?.querySelectorAll('button') || [];
        for (let btn of nearbyButtons) {
            const text = (btn.textContent || '').toLowerCase();
            if (text.includes('checkout') || text.includes('continue') || text.includes('proceed')) {
                console.log('✅ Found button near cart total:', text);
                console.log('🔘 Clicking...');
                btn.click();
                return true;
            }
        }
    }
    
    // Method 3: Direct form submission without triggering validation
    const forms = document.querySelectorAll('form');
    for (let form of forms) {
        // Skip forms that look like they're for deals/coupons
        const formHTML = form.innerHTML.toLowerCase();
        if (!formHTML.includes('coupon') && !formHTML.includes('deal') && !formHTML.includes('promo')) {
            console.log('✅ Found basic form, attempting direct submission...');
            try {
                form.submit();
                return true;
            } catch (e) {
                console.log('Form submit failed:', e.message);
            }
        }
    }
    
    console.log('❌ Could not find basic checkout path');
    return false;
}

// Method 4: If we're already on checkout page, find Place Order button
function placeOrderDirect() {
    console.log('🎯 Looking for Place Order button...');
    
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    for (let btn of buttons) {
        const text = (btn.textContent || btn.value || '').toLowerCase();
        
        // Look specifically for place order, avoiding deal-related buttons
        if (text.includes('place order') || text.includes('complete order')) {
            const classes = btn.className.toLowerCase();
            if (!classes.includes('deal') && !classes.includes('coupon') && !classes.includes('promo')) {
                console.log('✅ Found Place Order button:', text);
                console.log('🔘 Clicking to place order...');
                btn.click();
                return true;
            }
        }
    }
    
    console.log('❌ Could not find basic Place Order button');
    return false;
}

// Run the appropriate function based on current page
const currentUrl = window.location.href.toLowerCase();
if (currentUrl.includes('checkout')) {
    console.log('📍 Already on checkout page, looking for Place Order...');
    placeOrderDirect();
} else {
    console.log('📍 Looking for basic checkout button...');
    directCheckoutOnly();
    
    // If we navigated to checkout, wait a moment then try to place order
    setTimeout(() => {
        if (window.location.href.toLowerCase().includes('checkout')) {
            console.log('📍 Now on checkout page, placing order...');
            placeOrderDirect();
        }
    }, 2000);
}

console.log('💡 This script avoids all promotional/deal elements that trigger validation errors');