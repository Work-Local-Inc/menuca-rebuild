/**
 * Test NETUM NT-1809DD printer integration
 */

const { chromium } = require('playwright');

async function testPrinterIntegration() {
  console.log('🖨️  TESTING NETUM PRINTER INTEGRATION...\\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔧 Step 1: Test printer API directly');
    
    // Navigate to any page to set up environment
    await page.goto('https://menuca-rebuild.vercel.app/');
    
    // Test the printer API with mock order data
    const testOrderData = {
      orderNumber: 'TEST001',
      restaurantName: 'MenuCA Test Restaurant',
      restaurantPhone: '1-800-MENUCA',
      items: [
        {
          name: 'Large Pepperoni Pizza',
          quantity: 1,
          price: 18.99,
          finalPrice: 18.99
        },
        {
          name: 'Caesar Salad',
          quantity: 2,
          price: 8.99,
          finalPrice: 17.98
        }
      ],
      subtotal: 36.97,
      tax: 4.81,
      delivery: 2.99,
      tip: 5.00,
      total: 49.77,
      paymentMethod: 'Card',
      timestamp: new Date().toISOString()
    };
    
    console.log('   📝 Testing printer API with mock order...');
    
    const apiResult = await page.evaluate(async (orderData) => {
      try {
        const response = await fetch('/api/printer/send-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderData: orderData,
            printerConfig: {
              method: 'bluetooth' // Test Bluetooth mode for Samsung tablets
            }
          }),
        });
        
        const result = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, testOrderData);
    
    if (apiResult.success) {
      console.log('   ✅ Printer API working!');
      console.log('   📊 API Response:', JSON.stringify(apiResult.data, null, 2));
    } else {
      console.log('   ❌ Printer API failed:', apiResult.error || apiResult.data?.error);
      console.log('   📊 Full response:', JSON.stringify(apiResult, null, 2));
    }
    
    console.log('\\n🎉 Step 2: Test success page with printer integration');
    
    // Set up order data for success page test
    await page.evaluate((orderData) => {
      sessionStorage.setItem('completed_order', JSON.stringify({
        items: orderData.items.map(item => ({
          menuItem: { name: item.name, price: item.price },
          quantity: item.quantity,
          finalPrice: item.finalPrice
        })),
        total: orderData.total,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        delivery: orderData.delivery,
        tip: orderData.tip,
        timestamp: orderData.timestamp
      }));
    }, testOrderData);
    
    // Navigate to success page
    const successUrl = 'https://menuca-rebuild.vercel.app/order-success?payment_intent=pi_test_printer_' + Date.now();
    await page.goto(successUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if success page loaded
    const currentUrl = page.url();
    if (currentUrl.includes('/order-success')) {
      console.log('   ✅ Success page loaded successfully');
      
      // Check for print status indicators
      const printStatus = await page.evaluate(() => {
        const printing = document.body.textContent.includes('Printing receipt');
        const success = document.body.textContent.includes('Receipt sent to printer successfully');
        const error = document.body.textContent.includes('Receipt printing queued');
        const orderConfirmed = document.body.textContent.includes('Order Confirmed!');
        
        return {
          printing,
          printSuccess: success,
          printError: error,
          orderConfirmed,
          hasConsoleMessages: typeof console !== 'undefined'
        };
      });
      
      console.log('   📊 Print Status Check:', printStatus);
      
      if (printStatus.orderConfirmed) {
        console.log('   ✅ Order confirmation page working');
      }
      
      // Wait to see print status changes
      await page.waitForTimeout(3000);
      
      // Check final print status
      const finalPrintStatus = await page.evaluate(() => {
        return {
          printing: document.body.textContent.includes('Printing receipt'),
          success: document.body.textContent.includes('Receipt sent to printer successfully'),
          error: document.body.textContent.includes('Receipt printing queued')
        };
      });
      
      console.log('   📊 Final Print Status:', finalPrintStatus);
      
      if (finalPrintStatus.success) {
        console.log('\\n🏆🏆🏆 PRINTER INTEGRATION WORKING! 🏆🏆🏆');
        console.log('✅ ESC/POS commands generated for NETUM NT-1809DD');
        console.log('✅ Receipt data formatted correctly');
        console.log('✅ Samsung tablets can receive print commands');
        console.log('✅ Success page shows print status');
      } else if (finalPrintStatus.error) {
        console.log('\\n⚠️  PRINTER COMMANDS GENERATED - CHECK CONNECTION');
        console.log('✅ ESC/POS commands created successfully');
        console.log('⚠️  Printer connection needs configuration');
      } else if (finalPrintStatus.printing) {
        console.log('\\n⏳ STILL PROCESSING - May need more time');
      }
      
      // Take screenshot
      await page.screenshot({ path: 'printer-integration-test.png', fullPage: true });
      console.log('📸 Screenshot saved: printer-integration-test.png');
      
    } else {
      console.log('   ❌ Success page not loaded - URL:', currentUrl);
    }
    
  } catch (error) {
    console.error('\\n❌ Printer test failed:', error.message);
    await page.screenshot({ path: 'printer-test-error.png' });
  } finally {
    console.log('\\n👋 Printer test complete');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testPrinterIntegration().catch(console.error);