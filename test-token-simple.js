// Simple test for Browserless token
const https = require('https');

// Copy your FULL token from Vercel here
const BROWSERLESS_TOKEN = 'YOUR_FULL_TOKEN_HERE';

console.log('Testing Browserless token...\n');

const data = JSON.stringify({
  url: 'https://example.com'
});

const options = {
  hostname: 'chrome.browserless.io',
  port: 443,
  path: `/content?token=${BROWSERLESS_TOKEN}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}\n`);
  
  if (res.statusCode === 403) {
    console.log('❌ ERROR: Token is invalid or rejected');
    console.log('Please check:');
    console.log('1. Token is copied correctly from Vercel');
    console.log('2. Token has no extra spaces or characters');
    console.log('3. Token is still valid in your Browserless account');
  } else if (res.statusCode === 200) {
    console.log('✅ SUCCESS: Token is valid and working!');
  }
  
  let responseBody = '';
  res.on('data', (chunk) => responseBody += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('\nResponse:', responseBody);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(data);
req.end();
