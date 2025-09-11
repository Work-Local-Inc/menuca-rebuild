const https = require('https');

async function testModifierAgent() {
  console.log('🔍 Testing modifier agent endpoint...\n');
  
  // Test 1: Check if endpoint is accessible
  const testData = {
    url: 'https://order.tonys-pizza.ca/?p=menu',
    restaurant_id: 'test-' + Date.now()
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'menuca-rebuild-pro.vercel.app',
    port: 443,
    path: '/api/agents/create-run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
      'x-internal-secret': ''
    },
    timeout: 30000
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Status Message: ${res.statusMessage}`);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\nResponse Body:');
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          
          if (parsed.success === false) {
            console.log('\n❌ Agent failed with error:', parsed.error);
            console.log('Message:', parsed.message);
          }
        } catch (e) {
          console.log(data);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
      reject(e);
    });
    
    req.on('timeout', () => {
      console.error('Request timeout after 30 seconds');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    console.log('Sending request to:', options.hostname + options.path);
    console.log('Request body:', postData);
    console.log('\n');
    
    req.write(postData);
    req.end();
  });
}

testModifierAgent().catch(console.error);
