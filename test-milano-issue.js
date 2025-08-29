// Test what's happening with Milano's menu import

async function testMilanoIssue() {
  console.log('🔍 Testing Milano Pizza import issue...\n');
  
  // First, check if Milano's restaurant exists
  const supabaseUrl = 'https://nthpbtdjhhnwfxqsxbvy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aHBidGRqaGhud2Z4cXN4YnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzU4NzAsImV4cCI6MjA1MTUxMTg3MH0.ww4sI2Dz4cLcvSBH1dVGjFgoNPBwbIiCTzL5DJPRWDk';
  
  // Check for Milano's restaurant
  const response = await fetch(`${supabaseUrl}/rest/v1/restaurants?name=like.*Milano*&select=id,name,tenant_id`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  const restaurants = await response.json();
  console.log(`Found ${restaurants.length} Milano restaurant(s):`);
  restaurants.forEach(r => {
    console.log(`  - ${r.name} (${r.id})`);
  });
  
  if (restaurants.length > 0) {
    const restaurant = restaurants[restaurants.length - 1]; // Get the most recent
    console.log(`\n🔍 Checking menu items for ${restaurant.name}...`);
    
    // Check menu items
    const menuResponse = await fetch(`${supabaseUrl}/rest/v1/menu_items?restaurant_id=eq.${restaurant.id}&select=name,category,price`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const items = await menuResponse.json();
    console.log(`Found ${items.length} menu items`);
    
    if (items.length > 0) {
      // Group by category
      const categories = {};
      items.forEach(item => {
        const cat = item.category || 'Uncategorized';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
      });
      
      console.log('\n📊 Menu breakdown:');
      Object.entries(categories).forEach(([cat, catItems]) => {
        console.log(`  ${cat}: ${catItems.length} items`);
        // Show first item as example
        if (catItems[0]) {
          console.log(`    Example: ${catItems[0].name} - $${catItems[0].price}`);
        }
      });
    }
  }
  
  // Now test the menu API endpoint
  console.log('\n🔍 Testing menu API endpoint...');
  const menuId = '8465b37a-aa16-40ed-ad4c-0ebadf311e6f'; // From your logs
  
  const apiResponse = await fetch(`https://menuca-rebuild-pro.vercel.app/api/restaurants/${menuId}/menu`);
  console.log(`API Response: ${apiResponse.status} ${apiResponse.statusText}`);
  
  if (apiResponse.ok) {
    const data = await apiResponse.json();
    console.log(`Menu has ${data.categories?.length || 0} categories`);
  } else {
    console.log('❌ Menu API returned error');
    
    // Check if restaurant exists
    const restaurantCheck = await fetch(`https://menuca-rebuild-pro.vercel.app/api/restaurants/${menuId}`);
    console.log(`\nRestaurant API: ${restaurantCheck.status} ${restaurantCheck.statusText}`);
  }
}

testMilanoIssue();
