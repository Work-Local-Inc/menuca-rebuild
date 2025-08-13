/**
 * 🎯 COMPLETE TABLET INTEGRATION - Session Continuity Approach
 * 
 * Based on previous session learnings:
 * - Manual orders work perfectly (Order #83022 printed)
 * - Cart state is in localStorage/sessionStorage 
 * - NEVER open new browser windows
 * - Maintain same session throughout entire flow
 * 
 * Goal: Bridge new platform orders → existing tablet system → printer
 */

const { chromium } = require('playwright');

class TabletIntegration {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cartLoaded = false;
  }

  /**
   * Initialize browser session - KEEP THIS OPEN
   */
  async initializeSession() {
    console.log('🚀 Initializing tablet session...');
    
    this.browser = await chromium.launch({ 
      headless: false, // Keep visible for debugging
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-web-security']
    });
    
    this.page = await this.browser.newPage({
      userAgent: 'Mozilla/5.0 (Linux; Android 4.4.4; Samsung SM-T510) AppleWebKit/537.36'
    });
    
    console.log('✅ Browser session initialized');
    return this.page;
  }

  /**
   * Load tablet.menu.ca and authenticate as O11
   */
  async authenticateTablet() {
    console.log('🔐 Authenticating as O11 tablet...');
    
    // Go to tablet login page
    await this.page.goto('https://tablet.menu.ca/app.php');
    
    // Wait for page to load
    await this.page.waitForTimeout(2000);
    
    // Check if we need to set authentication
    const needsAuth = await this.page.evaluate(() => {
      return !document.cookie.includes('rt_designator=O11');
    });
    
    if (needsAuth) {
      console.log('🍪 Setting O11 authentication cookies...');
      
      // Set O11 credentials as cookies
      await this.page.context().addCookies([
        {
          name: 'rt_designator',
          value: 'O11',
          domain: 'tablet.menu.ca',
          path: '/'
        },
        {
          name: 'rt_key', 
          value: '689a5531a6f31',
          domain: 'tablet.menu.ca',
          path: '/'
        }
      ]);
      
      // Reload page with authentication
      await this.page.reload();
      await this.page.waitForTimeout(3000);
    }
    
    console.log('✅ Authenticated as O11 - Test James - Dovercourt Pizza');
  }

  /**
   * Handle address popup that blocks menu interaction
   */
  async handleAddressPopup() {
    console.log('📍 Handling address popup...');
    
    try {
      // Wait for address popup and handle it
      await this.page.waitForSelector('[data-address-popup], .address-modal, #address-popup', 
        { timeout: 5000 });
      
      console.log('🏠 Address popup detected, filling...');
      
      // Fill address if needed
      const addressField = await this.page.$('input[name="address"], #address');
      if (addressField) {
        await addressField.fill('2047 Dovercourt Avenue, Ottawa, ON');
      }
      
      // Select pickup option (easier than delivery)
      const pickupButton = await this.page.$('button:has-text("Pickup"), [data-pickup], #pickup');
      if (pickupButton) {
        await pickupButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Close popup
      const closeButton = await this.page.$('button:has-text("Continue"), .close, [data-close]');
      if (closeButton) {
        await closeButton.click();
        await this.page.waitForTimeout(2000);
      }
      
      console.log('✅ Address popup handled');
      
    } catch (error) {
      console.log('📍 No address popup found, continuing...');
    }
  }

  /**
   * Add items to cart (manual collaboration step)
   */
  async collaborativeCartLoading() {
    console.log('🛒 COLLABORATIVE CART LOADING');
    console.log('===============================');
    console.log('🤝 Please manually add items to cart now:');
    console.log('1. Select menu items');
    console.log('2. Add to cart');
    console.log('3. Press ENTER in terminal when cart is loaded');
    console.log('');
    console.log('⏳ Waiting for you to finish cart loading...');
    
    // Wait for user input
    process.stdin.setRawMode(true);
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        console.log('✅ Cart loading completed by user');
        this.cartLoaded = true;
        resolve();
      });
    });
  }

  /**
   * Complete the checkout process
   */
  async completeCheckout() {
    if (!this.cartLoaded) {
      throw new Error('Cart not loaded. Run collaborativeCartLoading() first.');
    }
    
    console.log('💳 Completing checkout process...');
    
    // Navigate to checkout
    const checkoutButton = await this.page.$('a[href*="checkout"], button:has-text("Checkout"), #checkout');
    if (checkoutButton) {
      console.log('🔍 Found checkout button, clicking...');
      await checkoutButton.click();
      await this.page.waitForTimeout(3000);
    }
    
    // Wait for checkout page to load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Select cash payment (simplest option)
    const cashButton = await this.page.$('button:has-text("Cash"), [data-payment="cash"], #cash-payment');
    if (cashButton) {
      console.log('💵 Selecting cash payment...');
      await cashButton.click();
      await this.page.waitForTimeout(1000);
    }
    
    // Find and click place order button
    const placeOrderButton = await this.page.$('button:has-text("Place Order"), #place-order, [data-place-order]');
    if (placeOrderButton) {
      console.log('📤 Placing order...');
      
      // Listen for network responses during order placement
      this.page.on('response', response => {
        console.log(`📡 Network: ${response.status()} ${response.url()}`);
      });
      
      await placeOrderButton.click();
      await this.page.waitForTimeout(5000);
      
      console.log('🎉 Order placement attempted!');
      console.log('📱 Check your Samsung tablet for new order');
      
    } else {
      console.log('❌ Could not find place order button');
    }
  }

  /**
   * Complete integration flow
   */
  async runCompleteFlow() {
    try {
      // Step 1: Initialize session
      await this.initializeSession();
      
      // Step 2: Authenticate
      await this.authenticateTablet();
      
      // Step 3: Handle address popup
      await this.handleAddressPopup();
      
      // Step 4: Collaborative cart loading
      await this.collaborativeCartLoading();
      
      // Step 5: Complete checkout
      await this.completeCheckout();
      
      console.log('✅ Complete integration flow finished');
      console.log('📱 Check tablet for order!');
      
    } catch (error) {
      console.error('❌ Integration error:', error);
    }
  }

  /**
   * Inject external order data (from your new platform)
   */
  async injectExternalOrder(orderData) {
    console.log('🔄 Injecting external order into tablet system...');
    
    if (!this.page) {
      await this.initializeSession();
      await this.authenticateTablet();
    }
    
    // Inject order data into the page's localStorage/sessionStorage
    await this.page.evaluate((order) => {
      // Add to cart storage
      const cart = {
        items: order.items,
        customer: order.customer,
        address: order.address,
        total: order.total,
        timestamp: Date.now()
      };
      
      localStorage.setItem('menuCaCart', JSON.stringify(cart));
      sessionStorage.setItem('currentOrder', JSON.stringify(cart));
      
      console.log('Order injected into cart storage:', cart);
    }, orderData);
    
    // Now proceed to checkout with injected data
    await this.completeCheckout();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Export for use in other modules
module.exports = TabletIntegration;

// Run if called directly
if (require.main === module) {
  const integration = new TabletIntegration();
  
  integration.runCompleteFlow()
    .then(() => {
      console.log('🎉 Integration complete!');
    })
    .catch(console.error);
}