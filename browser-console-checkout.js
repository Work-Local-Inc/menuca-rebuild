/**
 * 🎯 BROWSER CONSOLE CHECKOUT SCRIPT
 * 
 * Copy and paste this into your browser console (F12 → Console tab)
 * This will complete the checkout process in your loaded cart
 */

console.log('🚀 MENUCA TABLET CHECKOUT AUTOMATION');
console.log('====================================');

// Function to find and click checkout button
function findCheckoutButton() {
  console.log('🔍 Looking for checkout button...');
  
  const selectors = [
    'a[href*="checkout"]',
    'button:contains("Checkout")',
    'button:contains("Check Out")', 
    '#checkout',
    '.checkout-btn',
    '[data-checkout]',
    'button[onclick*="checkout"]',
    'input[value*="checkout" i]'
  ];
  
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Found checkout button: ${selector}`);
        element.click();
        return true;
      }
    } catch (e) {
      // Continue trying
    }
  }
  
  // Try jQuery if available
  if (window.jQuery || window.$) {
    const $ = window.jQuery || window.$;
    const jqButton = $('button:contains("Checkout"), a:contains("Checkout")').first();
    if (jqButton.length) {
      console.log('✅ Found checkout button with jQuery');
      jqButton.click();
      return true;
    }
  }
  
  return false;
}

// Function to complete order placement
function placeOrder() {
  console.log('📤 Looking for place order button...');
  
  const orderSelectors = [
    'button:contains("Place Order")',
    'button:contains("Submit Order")',
    'button:contains("Complete Order")',
    'button:contains("Confirm")',
    '#place-order',
    '[data-place-order]',
    'input[type="submit"]',
    'button[type="submit"]'
  ];
  
  for (const selector of orderSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) { // Check if visible
        console.log(`✅ Found place order button: ${selector}`);
        
        // Listen for network requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          console.log('📡 Fetch request:', args[0]);
          return originalFetch.apply(this, args);
        };
        
        // Click the button
        element.click();
        console.log('🎉 ORDER PLACEMENT CLICKED!');
        console.log('📱 Check your Samsung tablet for new order!');
        return true;
      }
    } catch (e) {
      // Continue trying
    }
  }
  
  // Try jQuery approach
  if (window.jQuery || window.$) {
    const $ = window.jQuery || window.$;
    const jqOrder = $('button:contains("Place"), button:contains("Submit"), button:contains("Complete")').first();
    if (jqOrder.length) {
      console.log('✅ Found order button with jQuery');
      jqOrder.click();
      console.log('🎉 ORDER PLACEMENT CLICKED!');
      return true;
    }
  }
  
  return false;
}

// Main execution
function runCheckout() {
  console.log('🛒 Checking cart status...');
  
  // Check if we're already on checkout page
  const currentUrl = window.location.href;
  console.log('📍 Current URL:', currentUrl);
  
  if (currentUrl.includes('checkout')) {
    console.log('✅ Already on checkout page');
    setTimeout(() => placeOrder(), 2000);
  } else {
    console.log('🔄 Need to navigate to checkout...');
    if (findCheckoutButton()) {
      setTimeout(() => placeOrder(), 3000);
    } else {
      console.log('❌ Could not find checkout button');
      console.log('🔍 Available buttons:');
      const buttons = Array.from(document.querySelectorAll('button, a')).map(el => ({
        text: el.textContent.trim(),
        href: el.href,
        id: el.id,
        class: el.className
      })).filter(btn => btn.text);
      console.table(buttons);
    }
  }
}

// Auto-run the checkout
runCheckout();

// Also provide manual functions
window.menuCaCheckout = runCheckout;
window.menuCaPlaceOrder = placeOrder;

console.log('💡 Manual controls available:');
console.log('   menuCaCheckout() - Find and click checkout');
console.log('   menuCaPlaceOrder() - Find and click place order');