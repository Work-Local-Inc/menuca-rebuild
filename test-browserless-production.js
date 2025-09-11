// Test if Browserless is actually broken or if it's something else
const https = require('https');

async function testBrowserlessProduction() {
  console.log('Testing Browserless from production environment...\n');
  
  // First, let's get the token from production
  const envResponse = await fetch('https://menuca-rebuild-pro.vercel.app/api/env-health');
  const envData = await envResponse.json();
  console.log('Environment check:', envData);
  
  // Test a simple Browserless request
  const testUrl = 'https://order.tonys-pizza.ca/?p=menu';
  
  // Test the exact same request that the production code makes
  const response = await fetch('https://menuca-rebuild-pro.vercel.app/api/agents/create-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': ''
    },
    body: JSON.stringify({
      url: testUrl,
      restaurant_id: 'test-' + Date.now()
    })
  });
  
  console.log('\nAPI Response Status:', response.status);
  const result = await response.json();
  console.log('API Response:', JSON.stringify(result, null, 2));
  
  // Now let's check the database for recent successful modifier imports
  console.log('\n--- Checking for recent successful modifier imports ---');
}

testBrowserlessProduction().catch(console.error);
