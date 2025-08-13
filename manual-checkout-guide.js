/**
 * 🔍 MANUAL CHECKOUT GUIDE
 * 
 * Let's see exactly what's on your page and guide you to click the right thing manually
 */
console.log('🔍 MANUAL CHECKOUT GUIDE');
console.log('========================');

function showAllClickableElements() {
    console.log('🔘 ALL CLICKABLE ELEMENTS ON PAGE:');
    console.log('==================================');
    
    const clickables = document.querySelectorAll('button, input[type="submit"], a[href], [onclick]');
    
    clickables.forEach((element, index) => {
        const text = element.textContent?.trim() || element.value || element.title || '';
        const href = element.href || '';
        const classes = element.className || '';
        const id = element.id || '';
        
        if (text || href) {
            console.log(`\n[${index + 1}] ${element.tagName.toLowerCase()}`);
            console.log(`    Text: "${text}"`);
            if (href) console.log(`    Link: ${href}`);
            if (classes) console.log(`    Classes: ${classes}`);
            if (id) console.log(`    ID: ${id}`);
            
            // Highlight potentially safe options
            const safeText = text.toLowerCase();
            if (safeText.includes('checkout') && !safeText.includes('deal') && !safeText.includes('coupon')) {
                console.log('    ⭐ POTENTIALLY SAFE CHECKOUT OPTION');
            }
            if (safeText.includes('place order') && !safeText.includes('deal')) {
                console.log('    ⭐ POTENTIALLY SAFE ORDER OPTION');
            }
            if (safeText.includes('continue') && !safeText.includes('deal')) {
                console.log('    ⭐ POTENTIALLY SAFE CONTINUE OPTION');
            }
        }
    });
    
    console.log('\n\n💡 MANUAL APPROACH:');
    console.log('===================');
    console.log('Look at the list above and manually click an option marked with ⭐');
    console.log('Avoid anything with "deal", "coupon", "promo" in the text or classes');
    console.log('Look for basic "Checkout", "Place Order", or "Continue" buttons');
    
    return clickables;
}

function showCurrentPageInfo() {
    console.log('📍 CURRENT PAGE INFO:');
    console.log('=====================');
    console.log('URL:', window.location.href);
    console.log('Title:', document.title);
    
    // Look for any visible error messages
    const errors = document.querySelectorAll('[class*="error"], .alert-danger, .text-danger, [style*="color: red"]');
    if (errors.length > 0) {
        console.log('\n❌ CURRENT ERROR MESSAGES:');
        errors.forEach((error, i) => {
            console.log(`${i + 1}. ${error.textContent.trim()}`);
        });
    }
    
    // Look for cart info
    const cartInfo = document.querySelectorAll('[class*="cart"], [class*="total"], [id*="cart"], [id*="total"]');
    console.log('\n🛒 CART/TOTAL ELEMENTS:', cartInfo.length);
}

// Run the analysis
showCurrentPageInfo();
const clickables = showAllClickableElements();

// Make elements easy to click manually
console.log('\n🎯 QUICK MANUAL CLICKING:');
console.log('========================');
console.log('To manually click any element from the list above, use:');
console.log('clickables[INDEX].click()   (where INDEX is the number from the list)');
console.log('Example: clickables[0].click() to click the first element');

// Store for manual use
window.clickables = Array.from(clickables);
window.manualClick = function(index) {
    if (clickables[index]) {
        console.log(`Clicking element ${index + 1}: ${clickables[index].textContent?.trim() || clickables[index].value || 'no text'}`);
        clickables[index].click();
    } else {
        console.log(`No element at index ${index}`);
    }
};

console.log('\n💡 You can also use: manualClick(INDEX) for easier clicking');