// Test Browserless token directly
const https = require('https');

// Your token from Vercel (first few chars visible in your screenshot)
const token = '2TiY2SIoQuMuoy7...'; // You'll need to get the full token from Vercel

async function testBrowserlessToken() {
  console.log('🔍 Testing Browserless token...\n');
  
  // Test 1: Simple content endpoint
  console.log('1️⃣ Testing /content endpoint...');
  const contentData = JSON.stringify({
    url: 'https://example.com',
    gotoOptions: { waitUntil: 'networkidle' }
  });
  
  await makeRequest('/content', contentData);
  
  // Test 2: Function endpoint (what your app uses)
  console.log('\n2️⃣ Testing /function endpoint...');
  const functionData = JSON.stringify({
    code: `async ({ page }) => { 
      await page.goto('https://example.com'); 
      return { title: await page.title() }; 
    }`,
    context: {}
  });
  
  await makeRequest('/function', functionData);
}

async function makeRequest(endpoint, data) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'chrome.browserless.io',
      port: 443,
      path: `${endpoint}?token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 403) {
          console.log('❌ 403 Forbidden - Token is invalid or not authorized for this endpoint');
        } else if (res.statusCode === 200) {
          console.log('✅ Success! Token is valid');
        } else {
          console.log('Response:', responseData.substring(0, 200));
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e.message);
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// NOTE: Replace the token variable above with your full token from Vercel
console.log('⚠️  NOTE: You need to replace the token in this file with your full token from Vercel\n');

testBrowserlessToken();
