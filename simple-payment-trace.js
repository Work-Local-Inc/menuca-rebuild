// 🕵️ SIMPLE PAYMENT TRACER - No undefined issues
console.log('🕵️ TRACING PAYMENT FLOW');

// Check for Stripe
if (document.documentElement.innerHTML.includes('stripe')) {
    console.log('✅ Found: stripe');
}

// Check for payment forms
document.querySelectorAll('form').forEach(form => {
    if (form.action.includes('payment') || form.action.includes('checkout')) {
        console.log('📋 Payment form:', form.action);
    }
});

// Check scripts
document.querySelectorAll('script[src]').forEach(script => {
    if (script.src.includes('stripe') || script.src.includes('payment')) {
        console.log('📜 Payment script:', script.src);
    }
});

// Search for Stripe keys
const html = document.documentElement.innerHTML;
if (html.includes('pk_test_')) {
    console.log('🔑 Found Stripe test key in page');
}
if (html.includes('pk_live_')) {
    console.log('🔑 Found Stripe live key in page');
}

console.log('✅ Trace complete - check output above');