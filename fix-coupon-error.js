/**
 * 🎯 FIX COUPON ERROR SCRIPT
 * 
 * Copy and paste this into browser console to handle coupon validation error
 */

console.log('🔧 FIXING COUPON ERROR');
console.log('======================');

// Function to clear any coupon fields
function clearCoupons() {
  console.log('🎫 Clearing coupon fields...');
  
  const couponSelectors = [
    'input[name*="coupon"]',
    'input[id*="coupon"]',
    'input[placeholder*="coupon"]',
    '#coupon',
    '.coupon-input',
    '[data-coupon]'
  ];
  
  let cleared = 0;
  couponSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el.value) {
        console.log(`🗑️ Clearing coupon field: ${el.value}`);
        el.value = '';
        el.dispatchEvent(new Event('change', { bubbles: true }));
        cleared++;
      }
    });
  });
  
  console.log(`✅ Cleared ${cleared} coupon fields`);
}

// Function to remove coupon from form data
function removeCouponFromForm() {
  console.log('📋 Removing coupon from form submission...');
  
  // Find all forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const couponInputs = form.querySelectorAll('input[name*="coupon"], input[id*="coupon"]');
    couponInputs.forEach(input => {
      input.value = '';
      input.disabled = true;
      console.log(`🚫 Disabled coupon input: ${input.name || input.id}`);
    });
  });
}

// Function to bypass coupon validation
function bypassCouponValidation() {
  console.log('⚡ Bypassing coupon validation...');
  
  // Try to find and remove coupon error messages
  const errorSelectors = [
    '.error:contains("coupon")',
    '.error:contains("invalid")',
    '.alert-danger',
    '.error-message',
    '[data-error*="coupon"]'
  ];
  
  errorSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.textContent.toLowerCase().includes('coupon')) {
          el.style.display = 'none';
          console.log('🙈 Hidden coupon error message');
        }
      });
    } catch (e) {
      // Continue
    }
  });
  
  // Override form validation if possible
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const originalSubmit = form.submit;
    form.submit = function() {
      // Remove coupon data before submit
      const formData = new FormData(form);
      for (let [key, value] of formData.entries()) {
        if (key.toLowerCase().includes('coupon')) {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) input.remove();
          console.log(`🗑️ Removed coupon field: ${key}`);
        }
      }
      return originalSubmit.call(this);
    };
  });
}

// Function to retry order placement
function retryOrderPlacement() {
  console.log('🔄 Retrying order placement...');
  
  setTimeout(() => {
    const orderButtons = [
      'button:contains("Place Order")',
      'button:contains("Submit")',
      'button:contains("Complete")',
      'input[type="submit"]',
      'button[type="submit"]'
    ];
    
    for (const selector of orderButtons) {
      try {
        let element;
        if (selector.includes(':contains')) {
          // Use jQuery style search
          element = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.toLowerCase().includes('place') ||
            btn.textContent.toLowerCase().includes('submit') ||
            btn.textContent.toLowerCase().includes('complete')
          );
        } else {
          element = document.querySelector(selector);
        }
        
        if (element && element.offsetParent !== null) {
          console.log(`📤 Retrying with button: ${element.textContent}`);
          element.click();
          console.log('🎉 ORDER RETRY CLICKED!');
          return true;
        }
      } catch (e) {
        // Continue
      }
    }
    
    console.log('❌ Could not find order button for retry');
    return false;
  }, 1000);
}

// Main fix function
function fixCouponAndRetry() {
  console.log('🚀 Starting coupon fix...');
  
  // Step 1: Clear all coupon fields
  clearCoupons();
  
  // Step 2: Remove coupon from forms
  removeCouponFromForm();
  
  // Step 3: Bypass validation
  bypassCouponValidation();
  
  // Step 4: Wait and retry order
  console.log('⏳ Waiting 2 seconds before retry...');
  setTimeout(retryOrderPlacement, 2000);
}

// Auto-run the fix
fixCouponAndRetry();

// Make available globally
window.fixCouponAndRetry = fixCouponAndRetry;

console.log('💡 Manual retry available: fixCouponAndRetry()');