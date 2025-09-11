// Test the onboarding flow directly
async function testOnboarding() {
  console.log('🚀 Testing full onboarding flow...\n');
  
  const profile = {
    name: "Test Tony's Pizza " + Date.now(),
    cuisine_type: "Italian",
    phone: "613-555-0123",
    email: "test@example.com",
    address: "123 Test St",
    city: "Ottawa",
    state: "ON",
    description: "Test restaurant"
  };
  
  const legacy_url = "https://order.tonys-pizza.ca/?p=menu";
  
  try {
    console.log('📍 Calling onboard endpoint...');
    const response = await fetch('https://menuca-rebuild-pro.vercel.app/api/restaurants/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile, legacy_url })
    });
    
    console.log('Status:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('\n📦 Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Restaurant created:', result.restaurant.id);
      console.log('Menu import result:', result.menu_import);
    } else {
      console.log('\n❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testOnboarding();
