// Test Tony's Pizza to see the actual error

async function testTonysError() {
  console.log('🔍 Testing Tony\'s Pizza import to see the 500 error...\n');
  
  const url = 'https://order.tonys-pizza.ca/?p=menu';
  
  try {
    const response = await fetch('https://menuca-rebuild-pro.vercel.app/api/admin/import-legacy-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        restaurant_id: 'temp-preview',
        restaurant_name: 'Tony\'s Pizza Test'
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('Error response:', text);
    } else {
      const data = await response.json();
      console.log('Success:', data);
    }
  } catch (error) {
    console.log('Request error:', error);
  }
}

testTonysError();
