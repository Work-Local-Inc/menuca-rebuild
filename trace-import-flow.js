// Trace the entire import flow to see what's actually happening
const https = require('https');

async function traceImport() {
  console.log('🔍 Testing the complete import flow...\n');
  
  // Step 1: Create a test restaurant via onboarding
  const profile = {
    name: "Debug Test " + Date.now(),
    cuisine_type: "Italian", 
    phone: "555-0123",
    email: "test@example.com",
    address: "123 Test St",
    city: "Ottawa",
    state: "ON"
  };
  
  const onboardData = JSON.stringify({
    profile,
    legacy_url: "https://order.tonys-pizza.ca/?p=menu"
  });
  
  console.log('1️⃣ Creating restaurant via onboarding...');
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'menuca-rebuild-pro.vercel.app',
      path: '/api/restaurants/onboard',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': onboardData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const result = JSON.parse(data);
          console.log('\nResult:', JSON.stringify(result, null, 2));
          
          if (result.restaurant?.id) {
            console.log('\n✅ Restaurant created:', result.restaurant.id);
            console.log('Menu import result:', result.menu_import);
            
            // Now check if modifiers were created
            setTimeout(() => {
              checkModifiers(result.restaurant.id);
            }, 5000);
          }
        } catch (e) {
          console.log('Response:', data);
        }
      });
    });
    
    req.write(onboardData);
    req.end();
  });
}

async function checkModifiers(restaurantId) {
  console.log('\n2️⃣ Checking if modifiers were created...');
  
  // Check the menu API to see if items have modifiers
  https.get(`https://menuca-rebuild-pro.vercel.app/api/restaurants/${restaurantId}/menu`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const menu = JSON.parse(data);
        const itemsWithModifiers = menu.categories?.flatMap(c => c.items || [])
          .filter(item => item.hasModifiers || (item.modifierGroups && item.modifierGroups.length > 0));
        
        console.log('\nTotal items:', menu.categories?.flatMap(c => c.items || []).length || 0);
        console.log('Items with modifiers:', itemsWithModifiers?.length || 0);
        
        if (itemsWithModifiers && itemsWithModifiers.length > 0) {
          console.log('\n✅ MODIFIERS FOUND! Example:', itemsWithModifiers[0]);
        } else {
          console.log('\n❌ NO MODIFIERS FOUND');
        }
      } catch (e) {
        console.log('Error parsing menu:', e);
      }
    });
  });
}

traceImport();
