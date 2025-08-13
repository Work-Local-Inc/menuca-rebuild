/**
 * 🎯 TEST PRINTER MAPPING INTEGRATION
 * 
 * BREAKTHROUGH: Printer now mapped to restaurant in admin!
 * Theory: Orders route through printer serial numbers, not restaurant IDs
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testPrinterMapping() {
  console.log('🖨️ TESTING PRINTER MAPPING INTEGRATION');
  console.log('=====================================');
  console.log('Printer Serial: G10H22000898');
  console.log('SIM Serial: 893027204030307');
  console.log('Mapped to: Test James - Dovercourt Pizza - 2047 Dovercourt Avenue');
  console.log('Theory: Orders now route through printer mapping!');
  console.log('');

  // Test with printer serial as identifier
  const PRINTER_BASED_TESTS = [
    {
      id: 'G10H22000898',
      key: '689aG10H22000898',
      description: 'Printer serial as restaurant ID'
    },
    {
      id: 'G10H',
      key: '689ag10hbef18a4', 
      description: 'Printer serial prefix pattern'
    },
    {
      id: '893027204030307',
      key: '689a893027204030307',
      description: 'SIM serial as identifier'
    },
    {
      id: 'G10H22000898',
      key: '689a555g10h',
      description: 'Short printer pattern'
    }
  ];

  for (const test of PRINTER_BASED_TESTS) {
    console.log(`🧪 Testing ${test.description}: ${test.id}`);
    console.log(`   rt_key: ${test.key}`);
    
    try {
      // Test credentials with printer-based IDs
      const params = new URLSearchParams({
        key: test.key,
        sw_ver: 'MenuCA-Printer-Test',
        api_ver: '13',
        printer_serial: 'G10H22000898',
        sim_serial: '893027204030307'
      });

      const response = await fetch('https://tablet.menu.ca/get_orders.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MenuCA-Printer-Test/1.0'
        },
        body: params
      });

      const responseText = await response.text();
      console.log(`   📡 Response: ${response.status} - ${responseText}`);
      
      if (response.status === 200) {
        console.log('   ✅ Valid printer-based credentials!');
        
        // Send test order with printer mapping
        const printerOrder = {
          id: `PRINTER_MAPPED_${Date.now()}`,
          restaurant_id: test.id,
          printer_serial: 'G10H22000898',
          sim_serial: '893027204030307',
          delivery_type: 1,
          customer: { 
            name: 'Claude Printer Test', 
            phone: '613-555-0199', 
            email: 'claude@menuca.com' 
          },
          address: { 
            name: 'Printer Mapping Test', 
            address1: '2047 Dovercourt Avenue', 
            address2: '', 
            city: 'Ottawa', 
            province: 'ON', 
            postal_code: 'K2A-0X2', 
            phone: '613-555-0199'
          },
          order: [{
            item: `🖨️ PRINTER MAPPING TEST - ${test.description}`,
            type: 'Food', 
            qty: 1, 
            price: 26.99,
            special_instructions: 'PRINTER MAPPING TEST: Testing if mapped printer receives orders now!'
          }],
          price: { 
            subtotal: 26.99, 
            tax: 3.51, 
            delivery: 3.99, 
            tip: 5.00, 
            total: 39.49, 
            taxes: { HST: 3.51 }
          },
          payment_method: 'Credit Card', 
          payment_status: 1,
          comment: `🎯 PRINTER MAPPING TEST: Testing printer serial G10H22000898 mapped to restaurant`,
          delivery_time: Math.floor(Date.now() / 1000) + (40 * 60),
          time_created: Math.floor(Date.now() / 1000),
          status: 0, 
          ver: 2
        };

        console.log(`   📤 Sending printer mapping test order...`);
        
        const orderParams = new URLSearchParams({
          key: test.key,
          action: 'submit',
          order: JSON.stringify(printerOrder),
          api_ver: '13',
          restaurant_id: test.id,
          printer_serial: 'G10H22000898',
          sim_serial: '893027204030307'
        });

        const orderResponse = await fetch('https://tablet.menu.ca/action.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MenuCA-Printer-Test/1.0'
          },
          body: orderParams
        });

        const orderText = await orderResponse.text();
        console.log(`   📋 PRINTER ORDER: ${orderResponse.status} - ${orderText || '(empty)'}`);
        
        if (orderResponse.ok) {
          console.log('   🎉 PRINTER MAPPING ORDER SUBMITTED!');
        }
      } else {
        console.log('   ❌ Invalid printer credentials');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('📱 CRITICAL CHECK - PRINTER MAPPING ACTIVE');
  console.log('=========================================');
  console.log('You just updated printer mapping in admin!');
  console.log('Printer G10H22000898 → Test James - Dovercourt Pizza');
  console.log('');
  console.log('CHECK YOUR SAMSUNG A9 TABLET NOW FOR:');
  console.log('=====================================');
  console.log('Orders: "PRINTER MAPPING TEST" ($39.49 each)');
  console.log('Customer: Claude Printer Test');
  console.log('Address: 2047 Dovercourt Avenue');
  console.log('');
  console.log('🖨️ These should trigger your NETUM G10H22000898 printer!');
  console.log('');
  console.log('🎯 If you see orders now, the printer mapping was the key!');
}

testPrinterMapping().catch(console.error);