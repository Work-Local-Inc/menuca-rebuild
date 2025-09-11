// Quick test to see if modifiers are actually in the database
const fetch = require('node-fetch');

async function checkModifiers() {
  // Check a known restaurant that should have modifiers
  const res = await fetch('https://menuca-rebuild-pro.vercel.app/menu/443a4fee-53d3-4aa9-8266-ecfb2840291d');
  const html = await res.text();
  
  console.log('Checking for modifier indicators in menu...');
  console.log('Has "hasModifiers": ', html.includes('hasModifiers'));
  console.log('Has "true" after hasModifiers: ', html.includes('hasModifiers":true'));
  console.log('Has "Size" modifier: ', html.includes('Size'));
  console.log('Has "Crust" modifier: ', html.includes('Crust'));
  console.log('Has "Toppings" modifier: ', html.includes('Toppings'));
}

checkModifiers();
