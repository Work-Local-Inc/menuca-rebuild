/**
 * 🔧 FIX PRINTING:FALSE ISSUE
 * 
 * BREAKTHROUGH: User spotted "printing":false in RTConfig
 * This explains why orders don't appear - tablet thinks printing is disabled!
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fixPrintingFalse() {
  console.log('🔧 FIXING PRINTING:FALSE CONFIGURATION');
  console.log('====================================');
  console.log('Problem: RTConfig shows "printing":false');
  console.log('Theory: Tablet won\'t show orders if printing disabled');
  console.log('');

  // Test enabling printing for O11 tablet
  const enablePrintingTests = [
    {
      method: 'Enable printing via action.php',
      endpoint: 'https://tablet.menu.ca/action.php',
      params: {
        key: '689a5531a6f31',
        action: 'enable_printing',
        printing: 'true'
      }
    },
    {
      method: 'Update config via config.php',
      endpoint: 'https://tablet.menu.ca/config.php',
      params: {
        key: '689a5531a6f31',
        rt_designator: 'O11',
        printing: 'true',
        config_edit: 'true'
      }
    },
    {
      method: 'Set printer status',
      endpoint: 'https://tablet.menu.ca/action.php',
      params: {
        key: '689a5531a6f31',
        action: 'set_printer',
        printer_status: 'enabled',
        printer_connected: 'true'
      }
    }
  ];

  for (const test of enablePrintingTests) {
    console.log(`🧪 Testing: ${test.method}`);
    
    try {
      const params = new URLSearchParams(test.params);
      
      const response = await fetch(test.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': 'rt_designator=O11; rt_key=689a5531a6f31',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
        },
        body: params
      });

      const responseText = await response.text();
      console.log(`   📡 ${response.status} - ${responseText || '(empty)'}`);
      
      if (responseText.includes('success') || responseText.includes('enabled') || responseText.includes('true')) {
        console.log('   🎉 PRINTING ENABLED!');
        
        // Now test if RTConfig shows printing:true
        const configCheck = await fetch('https://tablet.menu.ca/app.php', {
          method: 'GET',
          headers: {
            'Cookie': 'rt_designator=O11; rt_key=689a5531a6f31',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
          }
        });
        
        const configText = await configCheck.text();
        if (configText.includes('"printing":true')) {
          console.log('   ✅ SUCCESS: RTConfig now shows printing:true!');
          break;
        } else if (configText.includes('"printing":false')) {
          console.log('   ⚠️  RTConfig still shows printing:false');
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('🧪 TEST ORDER WITH PRINTING ENABLED');
  console.log('===================================');
  
  // Send test order now that printing should be enabled
  const testOrder = {
    id: `PRINTING_FIX_${Date.now()}`,
    restaurant_id: 'O11',
    device_id: 'O11',
    delivery_type: 1,
    customer: {
      name: 'Claude Printing Fix Test',
      phone: '613-555-0199',
      email: 'claude@menuca.com'
    },
    address: {
      name: 'Printing Fix Test',
      address1: '2047 Dovercourt Avenue',
      city: 'Ottawa',
      province: 'ON',
      postal_code: 'K2A-0X2',
      phone: '613-555-0199'
    },
    order: [{
      item: '🖨️ PRINTING ENABLED SUCCESS - Should appear now!',
      type: 'Food',
      qty: 1,
      price: 27.99,
      special_instructions: 'BREAKTHROUGH: Fixed printing:false issue!'
    }],
    price: {
      subtotal: 27.99,
      tax: 3.64,
      delivery: 4.99,
      tip: 5.50,
      total: 42.12
    },
    payment_method: 'Credit Card',
    payment_status: 1,
    comment: '🎉 PRINTING ENABLED: This order should appear on your tablet!',
    delivery_time: Math.floor(Date.now() / 1000) + (45 * 60),
    time_created: Math.floor(Date.now() / 1000),
    status: 0,
    ver: 2
  };

  try {
    const orderParams = new URLSearchParams({
      key: '689a5531a6f31',
      action: 'submit',
      order: JSON.stringify(testOrder),
      api_ver: '13',
      restaurant_id: 'O11'
    });

    const orderResponse = await fetch('https://tablet.menu.ca/action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'rt_designator=O11; rt_key=689a5531a6f31',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]'
      },
      body: orderParams
    });

    const orderText = await orderResponse.text();
    console.log(`📋 PRINTING ENABLED ORDER: ${orderResponse.status} - ${orderText || '(empty)'}`);
    
  } catch (error) {
    console.log(`❌ Order test error: ${error.message}`);
  }

  console.log('');
  console.log('📱 CRITICAL TABLET CHECK!');
  console.log('========================');
  console.log('✅ If printing was successfully enabled, your tablet should now show:');
  console.log('Order: "PRINTING ENABLED SUCCESS - Should appear now!" ($42.12)');
  console.log('Customer: Claude Printing Fix Test');
  console.log('');
  console.log('🎯 This addresses the printing:false issue you spotted!');
  console.log('If this works, we solved the root cause!');
}

fixPrintingFalse().catch(console.error);