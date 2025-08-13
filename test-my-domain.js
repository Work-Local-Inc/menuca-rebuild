/**
 * 🎯 TEST "my_domain" CREDENTIALS
 * 
 * We found restaurant uses domain "my_domain.menu.ca" - maybe credentials are based on this!
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMyDomainCredentials() {
  console.log('🔍 TESTING "my_domain" BASED CREDENTIALS');
  console.log('=====================================');
  console.log('Restaurant: test stefan');
  console.log('Domain: my_domain.menu.ca'); 
  console.log('Address: 600 terry fox drive');
  console.log('');

  // Test if the domain itself is used for API calls
  const DOMAIN_URLS = [
    'https://my_domain.menu.ca/app.php',
    'https://my_domain.menu.ca/get_orders.php',
    'https://my_domain.menu.ca/action.php',
    'https://my_domain.menu.ca/api/orders'
  ];

  for (const url of DOMAIN_URLS) {
    console.log(`📡 Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'MenuCA-MyDomain-Test/1.0' }
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.status !== 404) {
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 200)}...`);
        
        if (response.ok && text.includes('rt_')) {
          console.log('   🎉 FOUND rt_ REFERENCES!');
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Maybe the A19 tablet connects to my_domain.menu.ca instead of tablet.menu.ca
  console.log('🧪 TESTING ORDER SUBMISSION TO my_domain.menu.ca');
  console.log('===============================================');
  
  const testOrder = {
    id: `MY_DOMAIN_TEST_${Date.now()}`,
    restaurant_id: 'A19',
    customer: { name: 'Claude Domain Test', phone: '613-555-0199' },
    items: [{ name: 'MY_DOMAIN TEST ORDER', price: 15.99, quantity: 1 }],
    delivery_address: '600 terry fox drive'
  };

  try {
    const response = await fetch('https://my_domain.menu.ca/action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MenuCA-MyDomain-Test/1.0'
      },
      body: JSON.stringify(testOrder)
    });

    console.log(`📋 Order submission: ${response.status}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}...`);
    
  } catch (error) {
    console.log(`❌ Order submission failed: ${error.message}`);
  }

  console.log('\n📱 CHECK YOUR A19 TABLET FOR "MY_DOMAIN TEST ORDER"!');
}

testMyDomainCredentials().catch(console.error);