/**
 * 🔍 DEBUG CHECKOUT ERROR
 * 
 * Let's see exactly what's happening and force the order through
 */

console.log('🔍 DEBUGGING CHECKOUT ERROR');
console.log('===========================');

// Step 1: Inspect the current page state
function inspectPageState() {
  console.log('📊 PAGE STATE ANALYSIS');
  console.log('Current URL:', window.location.href);
  console.log('Page title:', document.title);
  
  // Find all error messages
  const errorElements = document.querySelectorAll('.error, .alert, .warning, [class*="error"], [class*="alert"]');
  console.log(`🚨 Found ${errorElements.length} error elements:`);
  errorElements.forEach((el, i) => {
    console.log(`  ${i+1}. "${el.textContent.trim()}" (class: ${el.className})`);
  });
  
  // Find all forms
  const forms = document.querySelectorAll('form');
  console.log(`📋 Found ${forms.length} forms:`);
  forms.forEach((form, i) => {
    console.log(`  Form ${i+1}:`, {
      action: form.action,
      method: form.method,
      inputs: form.querySelectorAll('input').length
    });
  });
  
  // Find all input fields
  const inputs = document.querySelectorAll('input');
  console.log(`📝 Found ${inputs.length} input fields:`);
  inputs.forEach((input, i) => {
    if (input.name || input.id) {
      console.log(`  ${i+1}. ${input.name || input.id}: "${input.value}" (type: ${input.type})`);
    }
  });
}

// Step 2: Force clear everything that might cause validation
function forceCleanForm() {
  console.log('🧹 FORCE CLEANING FORM');
  
  // Remove all hidden fields that might contain coupon data
  const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
  hiddenInputs.forEach(input => {
    if (input.name && (
      input.name.toLowerCase().includes('coupon') ||
      input.name.toLowerCase().includes('promo') ||
      input.name.toLowerCase().includes('discount')
    )) {
      console.log(`🗑️ Removing hidden field: ${input.name} = ${input.value}`);
      input.remove();
    }
  });
  
  // Clear all text inputs
  const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
  textInputs.forEach(input => {
    if (input.name && input.name.toLowerCase().includes('coupon')) {
      console.log(`🧽 Clearing text input: ${input.name}`);
      input.value = '';
      input.setAttribute('value', '');
    }
  });
  
  // Remove validation attributes
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    input.removeAttribute('required');
    input.removeAttribute('pattern');
    input.removeAttribute('min');
    input.removeAttribute('max');
  });
  
  console.log('✅ Form cleaning complete');
}

// Step 3: Bypass all validation and force submit
function forceSubmitOrder() {
  console.log('⚡ FORCING ORDER SUBMISSION');
  
  // Method 1: Find and submit form directly
  const forms = document.querySelectorAll('form');
  if (forms.length > 0) {
    const form = forms[0]; // Use first form
    console.log('📋 Attempting direct form submission...');
    
    // Override validation
    form.noValidate = true;
    
    // Try to submit
    try {
      form.submit();
      console.log('✅ Form submitted directly!');
      return true;
    } catch (e) {
      console.log('❌ Direct submit failed:', e.message);
    }
  }
  
  // Method 2: Click submit button with force
  const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
  submitButtons.forEach((btn, i) => {
    console.log(`🔘 Trying submit button ${i+1}: "${btn.textContent || btn.value}"`);
    try {
      // Remove any click event listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Force click
      newBtn.click();
      console.log('✅ Forced button click!');
    } catch (e) {
      console.log(`❌ Button click failed: ${e.message}`);
    }
  });
  
  // Method 3: Look for AJAX submission
  console.log('🌐 Looking for AJAX submission...');
  
  // Try to trigger any onclick handlers manually
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach((btn, i) => {
    if (btn.onclick || btn.getAttribute('onclick')) {
      console.log(`🎯 Trying button with onclick: "${btn.textContent.trim()}"`);
      try {
        if (btn.onclick) {
          btn.onclick();
        } else if (btn.getAttribute('onclick')) {
          eval(btn.getAttribute('onclick'));
        }
      } catch (e) {
        console.log(`❌ Onclick failed: ${e.message}`);
      }
    }
  });
}

// Step 4: Monitor network requests
function monitorNetworkRequests() {
  console.log('📡 MONITORING NETWORK REQUESTS');
  
  // Override fetch to log requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('📤 FETCH:', args[0], args[1]?.method || 'GET');
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📥 RESPONSE:', response.status, response.url);
        return response;
      });
  };
  
  // Override XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalSend = xhr.send;
    xhr.send = function(data) {
      console.log('📤 XHR:', xhr._method || 'GET', xhr._url);
      if (data) console.log('📦 XHR Data:', data);
      return originalSend.call(this, data);
    };
    const originalOpen = xhr.open;
    xhr.open = function(method, url) {
      xhr._method = method;
      xhr._url = url;
      return originalOpen.apply(this, arguments);
    };
    return xhr;
  };
}

// Main debug and force function
function debugAndForceOrder() {
  console.log('🚀 STARTING DEBUG AND FORCE');
  
  // Step 1: Analyze what we're dealing with
  inspectPageState();
  
  // Step 2: Clean everything
  forceCleanForm();
  
  // Step 3: Monitor network
  monitorNetworkRequests();
  
  // Step 4: Force submission
  setTimeout(() => {
    forceSubmitOrder();
  }, 1000);
  
  // Step 5: If nothing works, show manual options
  setTimeout(() => {
    console.log('🤔 If order still not submitted, try these manual steps:');
    console.log('1. Look for any visible error messages on page');
    console.log('2. Try clicking order button manually');
    console.log('3. Check Network tab in DevTools for failed requests');
    
    // Show all clickable elements
    const clickable = document.querySelectorAll('button, a, input[type="submit"], [onclick]');
    console.log('🔘 All clickable elements:');
    clickable.forEach((el, i) => {
      console.log(`  ${i+1}. "${el.textContent?.trim() || el.value || el.tagName}" (${el.tagName})`);
    });
  }, 3000);
}

// Auto-run
debugAndForceOrder();

// Make available for manual retry
window.debugAndForceOrder = debugAndForceOrder;
window.forceSubmitOrder = forceSubmitOrder;

console.log('💡 Manual functions available:');
console.log('  debugAndForceOrder() - Full debug and force');
console.log('  forceSubmitOrder() - Just force submission');