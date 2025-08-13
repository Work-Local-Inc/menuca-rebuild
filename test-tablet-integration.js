/**
 * 🧪 PLAYWRIGHT TABLET INTEGRATION TEST
 * 
 * Direct API test without browser console issues
 * Run with: node test-tablet-integration.js
 */

const https = require('https');

async function testTabletIntegration() {
    console.log('🧪 TESTING TABLET INTEGRATION API');
    console.log('==================================');
    
    const testOrder = {
        id: 'TEST_' + Date.now(),
        customer: { 
            name: '*** TEST ORDER - NOT REAL ***',
            phone: '555-TEST',
            email: 'test@menuca.com'
        },
        address: {
            name: '*** TEST ORDER - NOT REAL ***',
            address1: '123 TEST Street',
            city: 'TEST CITY',
            province: 'ON',
            postal_code: 'T3ST 0T3',
            phone: '555-TEST'
        },
        items: [{
            name: 'Test Pizza',
            price: 15.99,
            quantity: 1,
            special_instructions: 'API test'
        }],
        totals: {
            subtotal: 15.99,
            tax: 2.08,
            delivery: 0,
            tip: 0,
            total: 18.07
        },
        payment: {
            method: 'Test',
            status: 'test'
        },
        delivery_instructions: 'API test - not real order',
        restaurant_id: 'A19'
    };
    
    console.log('📦 Test order data:', JSON.stringify(testOrder, null, 2));
    
    const postData = JSON.stringify({ order: testOrder });
    
    const options = {
        hostname: 'menuca-rebuild.vercel.app',
        port: 443,
        path: '/api/inject-tablet-order',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        console.log('📡 Making API call to:', `https://${options.hostname}${options.path}`);
        
        const req = https.request(options, (res) => {
            console.log('📊 Response status:', res.statusCode);
            console.log('📊 Response headers:', res.headers);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('✅ API Response:', JSON.stringify(result, null, 2));
                    
                    if (res.statusCode === 200) {
                        if (result.success) {
                            console.log('🎉 SUCCESS! Order sent to tablet system!');
                            console.log('📱 CHECK YOUR SAMSUNG TABLET FOR THE TEST ORDER');
                        } else {
                            console.log('⚠️ API call succeeded but result unclear');
                            console.log('📱 Still check your Samsung tablet - order might have printed');
                        }
                    } else {
                        console.log('❌ API call failed with status:', res.statusCode);
                        console.log('❌ Error details:', result);
                    }
                    
                    resolve(result);
                } catch (parseError) {
                    console.log('❌ Failed to parse JSON response:', data);
                    console.log('❌ Parse error:', parseError.message);
                    resolve({ error: 'Invalid JSON response', raw: data });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request failed:', error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// Run the test
console.log('🚀 Starting tablet integration test...');
testTabletIntegration()
    .then(result => {
        console.log('🏁 Test completed');
        console.log('📱 If test succeeded, check your Samsung tablet now!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed completely:', error);
        process.exit(1);
    });