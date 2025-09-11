// Direct test of your Browserless token from Vercel
const https = require('https');

// Get your FULL token from Vercel env vars
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN || 'YOUR_TOKEN_HERE';

console.log('Testing Browserless token...');
console.log('Token starts with:', BROWSERLESS_TOKEN.substring(0, 10) + '...');

const testData = JSON.stringify({ url: 'https://example.com' });

const options = {
  hostname: 'chrome.browserless.io',
  port: 443,
  path: `/content?token=${BROWSERLESS_TOKEN}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

const req = https.request(options, (res) => {
  console.log('\nStatus:', res.statusCode);
  
  if (res.statusCode === 403) {
    console.log('\n❌ BROWSERLESS TOKEN IS BEING REJECTED');
    console.log('\nTO FIX:');
    console.log('1. Go to https://www.browserless.io/account');
    console.log('2. Copy your API token (NOT the account ID)');
    console.log('3. Update BROWSERLESS_TOKEN in Vercel');
    console.log('4. Make sure there are NO spaces before or after the token');
    console.log('\nOR:');
    console.log('1. Remove BROWSERLESS_TOKEN from Vercel entirely');
    console.log('2. The app will use Playwright fallback instead');
  } else if (res.statusCode === 200) {
    console.log('✅ Token is valid!');
  }
  
  res.on('data', () => {});
  res.on('end', () => {});
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(testData);
req.end();
