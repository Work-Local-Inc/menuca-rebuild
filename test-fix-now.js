// Test the fix immediately

async function testFix() {
  console.log('🔧 Testing Milano menu import with fix...\n');
  
  const restaurantId = '8465b37a-aa16-40ed-ad4c-0ebadf311e6f';
  const url = 'https://gatineau.milanopizzeria.ca/?p=menu';
  
  const response = await fetch('https://menuca-rebuild-pro.vercel.app/api/admin/import-legacy-menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: url,
      restaurant_id: restaurantId,
      restaurant_name: 'Milano\'s Gatineau'
    })
  });
  
  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Success: ${data.success}`);
  console.log(`Items created: ${data.items}`);
  console.log(`Items failed: ${data.items_failed || 0}`);
  
  if (data.items_failed > 0 && data.failure_summary) {
    console.log('\n❌ Failures:');
    data.failure_summary.errors.forEach(err => {
      console.log(`  "${err.error}": ${err.count} items`);
    });
  }
}

// Wait for deployment
console.log('⏳ Waiting 30 seconds for deployment...');
setTimeout(testFix, 30000);
