/**
 * 🎯 CAPTURE STRIPE DATA BEFORE REDIRECT
 * 
 * Since the order goes through Stripe, we need to intercept the Stripe calls
 * before the page redirects to the thank you page
 */
console.log('🎯 CAPTURING STRIPE DATA');
console.log('========================');

// Store original console.log to prevent loss
const originalLog = console.log;
const capturedData = [];

function logAndStore(message, data) {
    originalLog(message, data);
    capturedData.push({ timestamp: new Date(), message, data });
    
    // Store in localStorage so it survives page redirect
    localStorage.setItem('menuCaStripeCapture', JSON.stringify(capturedData));
}

// Monitor Stripe object if it exists
function monitorStripe() {
    if (window.Stripe) {
        logAndStore('✅ Stripe object found:', window.Stripe);
        
        // Try to intercept Stripe methods
        const originalConfirmPayment = window.Stripe.prototype.confirmPayment || function() {};
        const originalConfirmCardPayment = window.Stripe.prototype.confirmCardPayment || function() {};
        
        // Override Stripe payment confirmation methods
        if (window.Stripe.prototype.confirmPayment) {
            window.Stripe.prototype.confirmPayment = function(...args) {
                logAndStore('🔥 STRIPE CONFIRM PAYMENT:', args);
                return originalConfirmPayment.apply(this, arguments);
            };
        }
        
        if (window.Stripe.prototype.confirmCardPayment) {
            window.Stripe.prototype.confirmCardPayment = function(...args) {
                logAndStore('🔥 STRIPE CONFIRM CARD PAYMENT:', args);
                return originalConfirmCardPayment.apply(this, arguments);
            };
        }
    } else {
        logAndStore('❌ Stripe object not found yet, will keep checking...');
        setTimeout(monitorStripe, 500);
    }
}

// Intercept all network requests before redirect
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    logAndStore('🌐 FETCH REQUEST:', { url, options });
    
    // Log Stripe-related requests specifically
    if (url.includes('stripe.com') || url.includes('stripe')) {
        logAndStore('💳 STRIPE API CALL:', { url, options });
    }
    
    return originalFetch.apply(this, arguments).then(response => {
        logAndStore('📥 FETCH RESPONSE:', { url, status: response.status });
        return response;
    });
};

// Intercept form submissions
document.addEventListener('submit', function(event) {
    logAndStore('📝 FORM SUBMITTED:', {
        action: event.target.action,
        method: event.target.method,
        formData: new FormData(event.target)
    });
}, true);

// Monitor for page unload (before redirect)
window.addEventListener('beforeunload', function() {
    logAndStore('🚪 PAGE REDIRECTING - Final data capture');
    localStorage.setItem('menuCaStripeCapture', JSON.stringify(capturedData));
});

// Capture any existing Stripe data in DOM
function captureStripeElements() {
    const stripeElements = document.querySelectorAll('[class*="stripe"], [id*="stripe"], script[src*="stripe"]');
    if (stripeElements.length > 0) {
        logAndStore('🔍 FOUND STRIPE ELEMENTS:', stripeElements);
    }
    
    // Look for payment method data
    const paymentInputs = document.querySelectorAll('input[name*="payment"], input[name*="card"], input[name*="stripe"]');
    if (paymentInputs.length > 0) {
        logAndStore('💳 FOUND PAYMENT INPUTS:', paymentInputs);
    }
}

// Run initial capture
captureStripeElements();
monitorStripe();

// Function to retrieve captured data (run this on the thank you page)
function getCapturedData() {
    const stored = localStorage.getItem('menuCaStripeCapture');
    if (stored) {
        const data = JSON.parse(stored);
        console.log('📦 CAPTURED STRIPE DATA:', data);
        return data;
    } else {
        console.log('❌ No captured data found');
        return null;
    }
}

// Make available globally
window.getCapturedData = getCapturedData;
window.capturedStripeData = capturedData;

logAndStore('🚀 STRIPE MONITORING ACTIVE - Place your order now!');
logAndStore('💡 After redirect, run getCapturedData() to see what was captured');

// Check every 100ms for new Stripe activity
const stripeWatcher = setInterval(() => {
    if (window.Stripe || document.querySelector('script[src*="stripe"]')) {
        monitorStripe();
        captureStripeElements();
    }
}, 100);