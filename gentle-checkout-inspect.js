/**
 * 🔍 GENTLE CHECKOUT INSPECTION
 * 
 * Non-destructive script to see what's happening without breaking the page
 */
console.log('🔍 GENTLE CHECKOUT INSPECTION');
console.log('==============================');

// Just inspect - don't modify anything
function inspectCheckout() {
    console.log('📋 CURRENT PAGE STATE:');
    console.log('URL:', window.location.href);
    console.log('Title:', document.title);
    
    // Look for error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .alert, .warning, [role="alert"]');
    if (errorElements.length > 0) {
        console.log('❌ ERROR MESSAGES FOUND:');
        errorElements.forEach((el, i) => {
            console.log(`Error ${i + 1}:`, el.textContent.trim());
            console.log('Element:', el);
        });
    }
    
    // Look for coupon-related fields
    const couponElements = document.querySelectorAll('[name*="coupon"], [id*="coupon"], [class*="coupon"]');
    if (couponElements.length > 0) {
        console.log('🎟️ COUPON ELEMENTS FOUND:');
        couponElements.forEach((el, i) => {
            console.log(`Coupon ${i + 1}:`, el.tagName, el.type || 'no-type', el.value || 'no-value');
        });
    }
    
    // Look for forms
    const forms = document.querySelectorAll('form');
    console.log(`📝 FORMS FOUND: ${forms.length}`);
    forms.forEach((form, i) => {
        console.log(`Form ${i + 1}:`, form.action, form.method);
    });
    
    // Look for buttons
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    console.log(`🔘 BUTTONS FOUND: ${buttons.length}`);
    buttons.forEach((btn, i) => {
        if (btn.textContent.toLowerCase().includes('place') || 
            btn.textContent.toLowerCase().includes('order') ||
            btn.textContent.toLowerCase().includes('checkout') ||
            btn.value && btn.value.toLowerCase().includes('order')) {
            console.log(`Button ${i + 1}:`, btn.textContent || btn.value, btn.disabled ? 'DISABLED' : 'ENABLED');
        }
    });
    
    return {
        url: window.location.href,
        errors: Array.from(errorElements).map(el => el.textContent.trim()),
        coupons: Array.from(couponElements).map(el => ({
            tag: el.tagName,
            type: el.type,
            value: el.value,
            name: el.name
        })),
        forms: forms.length,
        buttons: Array.from(buttons).length
    };
}

// Run the inspection
const state = inspectCheckout();

// Provide simple manual options
console.log('\n🛠️ MANUAL OPTIONS:');
console.log('If you see a working checkout button, try clicking it manually');
console.log('Or tell me what errors you see and I\'ll create a targeted fix');

// Make inspection function available for re-running
window.menuCaInspect = inspectCheckout;
console.log('\n💡 TIP: Run menuCaInspect() anytime to re-check the page state');