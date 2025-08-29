// Manually import Milano's menu to fix the issue

async function fixMilanoMenu() {
  console.log('🔧 Fixing Milano\'s menu import...\n');
  
  const restaurantId = '8465b37a-aa16-40ed-ad4c-0ebadf311e6f';
  const url = 'https://gatineau.milanopizzeria.ca/?p=menu';
  
  console.log('📍 Restaurant: Milano\'s Gatineau');
  console.log('📍 ID:', restaurantId);
  console.log('📍 Menu URL:', url);
  
  try {
    console.log('\n🔄 Calling menu import API...');
    const response = await fetch('https://menuca-rebuild-pro.vercel.app/api/admin/import-legacy-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        restaurant_id: restaurantId,
        restaurant_name: 'Milano\'s Gatineau'
      })
    });
    
    console.log(`\n📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Import successful!');
      console.log(`   Categories: ${data.categories}`);
      console.log(`   Items: ${data.items}`);
      console.log(`   Failed: ${data.items_failed || 0}`);
      
      if (data.preview) {
        console.log('\n📁 Categories:');
        data.preview.forEach(cat => {
          console.log(`   ${cat.name}: ${cat.items} items`);
        });
      }
      
      console.log('\n✅ Milano\'s menu is now fixed!');
      console.log(`🔗 View at: https://menuca-rebuild-pro.vercel.app/menu/${restaurantId}`);
    } else {
      const errorText = await response.text();
      console.log('❌ Import failed!');
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run immediately
fixMilanoMenu();
