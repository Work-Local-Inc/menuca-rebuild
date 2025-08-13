/**
 * 🕵️ TRACE YOUR TEST ORDER PAYMENT FLOW
 * 
 * Let's figure out where your successful order payment actually went
 * Run this in browser console while on the legacy system
 */

console.log('🕵️ TRACING PAYMENT FLOW FOR YOUR TEST ORDER');
console.log('=============================================');

// Check what payment scripts are loaded
console.log('💳 PAYMENT SCRIPTS LOADED:');
const scripts = Array.from(document.getElementsByTagName('script'));
const paymentScripts = scripts.filter(script => 
  script.src && (
    script.src.includes('stripe') ||
    script.src.includes('square') ||
    script.src.includes('paypal') ||
    script.src.includes('payment') ||
    script.src.includes('checkout')
  )
);

paymentScripts.forEach(script => {
  console.log(`📜 ${script.src}`);
});

// Check for payment forms
console.log('\n💰 PAYMENT FORMS FOUND:');
const forms = Array.from(document.getElementsByTagName('form'));
const paymentForms = forms.filter(form => 
  form.action.includes('payment') ||
  form.action.includes('checkout') ||
  form.action.includes('stripe') ||
  form.action.includes('process')
);

paymentForms.forEach(form => {
  console.log(`📋 Form action: ${form.action}`);
  console.log(`📋 Form method: ${form.method}`);
  
  // Check form inputs for payment fields
  const inputs = Array.from(form.getElementsByTagName('input'));
  const paymentInputs = inputs.filter(input => 
    input.name && (
      input.name.includes('payment') ||
      input.name.includes('card') ||
      input.name.includes('stripe') ||
      input.name.includes('token')
    )
  );
  
  paymentInputs.forEach(input => {
    console.log(`   🔑 Input: ${input.name} (${input.type})`);
  });
});

// Check for Stripe publishable keys
console.log('\n🔑 CHECKING FOR STRIPE KEYS:');
if (window.Stripe) {
  console.log('✅ Stripe.js loaded');
  
  // Check for any Stripe elements or payment intents
  const stripeElements = document.querySelectorAll('[data-stripe], [id*="stripe"], [class*="stripe"]');
  stripeElements.forEach(el => {
    console.log(`🎨 Stripe element: ${el.tagName} ${el.id || el.className}`);
  });
} else {
  console.log('❌ Stripe.js not found');
}

// Check page source for payment processor clues
console.log('\n🔍 SEARCHING PAGE SOURCE FOR PAYMENT CLUES:');
const pageHTML = document.documentElement.innerHTML;

const paymentClues = [
  'pk_test_', 'pk_live_',  // Stripe keys
  'sq0idp-', 'sq0csp-',    // Square keys  
  'client-id=',            // PayPal
  'data-client-token',     // Braintree
  'merchantId',            // Various processors
  'api.stripe.com',        // Stripe API
  'connect.squareup.com',  // Square
  'paypal.com/sdk',        // PayPal
];

paymentClues.forEach(clue => {
  if (pageHTML.includes(clue)) {
    console.log(`🎯 Found: ${clue}`);
    
    // Try to extract the actual key/value
    const regex = new RegExp(`${clue}[^"'\\s]*`, 'g');
    const matches = pageHTML.match(regex);
    if (matches) {
      matches.slice(0, 3).forEach(match => { // Show first 3 matches
        console.log(`   📝 ${match}`);
      });
    }
  }
});

// Check local storage and session storage
console.log('\n💾 CHECKING BROWSER STORAGE:');
try {
  const localKeys = Object.keys(localStorage).filter(key => 
    key.toLowerCase().includes('payment') ||
    key.toLowerCase().includes('stripe') ||
    key.toLowerCase().includes('order')
  );
  localKeys.forEach(key => {
    console.log(`🗄️ LocalStorage: ${key} = ${localStorage.getItem(key)?.substring(0, 100)}...`);
  });
  
  const sessionKeys = Object.keys(sessionStorage).filter(key => 
    key.toLowerCase().includes('payment') ||
    key.toLowerCase().includes('stripe') ||
    key.toLowerCase().includes('order')
  );
  sessionKeys.forEach(key => {
    console.log(`📄 SessionStorage: ${key} = ${sessionStorage.getItem(key)?.substring(0, 100)}...`);
  });
} catch (e) {
  console.log('❌ Storage access denied');
}

console.log('\n🎯 NEXT STEPS:');
console.log('==============');
console.log('1. Copy all the output above');
console.log('2. If you see Stripe keys, they might be for a different account');
console.log('3. If you see other payment processors, that explains the missing Stripe logs');
console.log('4. The payment form action URL will show us where payments actually go');
console.log('\nRun this script on the legacy system checkout page!');