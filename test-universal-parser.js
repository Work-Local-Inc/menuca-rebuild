const fs = require('fs');

// Read the universal parser (we'll copy the logic here for testing)
const content = fs.readFileSync('scraped-menu.md', 'utf8');

// Simplified version of the universal parser for testing
function parseUniversalMenu(markdown, url) {
  const lines = markdown.split('\n');
  const categoriesMap = new Map();
  let currentCategory = 'Menu Items';
  let restaurantName = 'Milano Pizzeria';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and junk
    if (!line || line.includes('| ---') || line.includes('[](#)') || 
        line.includes('Choisissez cet item')) {
      continue;
    }
    
    // Simple category detection
    if (line.length < 50 && !line.includes('$') && !line.includes('|') &&
        (line.includes('Pizza') || line.includes('Poutine') || line.includes('Sandwich') ||
         line.includes('Nachos') || line.includes('Pâtes') || line.includes('Dessert') ||
         line.includes('Breuvage') || line.includes('Accompagnement'))) {
      currentCategory = line.replace('Haut', '').trim();
      continue;
    }
    
    // Item detection
    if (line.length > 3 && !line.includes('$') && !line.includes('|') && 
        !line.includes('»') && !line.toLowerCase().includes('choisissez')) {
      
      let description = '';
      const prices = [];
      let foundPrice = false;
      
      // Look for prices in next lines
      for (let j = 1; j <= 10 && i + j < lines.length; j++) {
        const nextLine = lines[i + j].trim();
        
        // Get description
        if (!description && nextLine && !nextLine.includes('$') && 
            !nextLine.includes('|') && !nextLine.includes('»')) {
          description = nextLine;
        }
        
        // Price in table format
        if (nextLine.includes('$') && nextLine.includes('|')) {
          const matches = [...nextLine.matchAll(/»\s*([^|]+?)\s*\|\s*\$\s*([\d.]+)/g)];
          for (const match of matches) {
            prices.push({
              size: match[1].trim(),
              price: parseFloat(match[2])
            });
            foundPrice = true;
          }
        }
        
        // Simple price format
        if (nextLine.includes('$') && !nextLine.includes('»')) {
          const match = nextLine.match(/\$\s*([\d.]+)/);
          if (match) {
            prices.push({
              size: 'Regular',
              price: parseFloat(match[1])
            });
            foundPrice = true;
          }
        }
        
        if (foundPrice) break;
      }
      
      if (prices.length > 0) {
        if (!categoriesMap.has(currentCategory)) {
          categoriesMap.set(currentCategory, []);
        }
        categoriesMap.get(currentCategory).push({
          name: line,
          description: description,
          prices: prices
        });
      }
    }
  }
  
  return {
    restaurant: { name: restaurantName, cuisine: 'Pizza & Canadian', website: url },
    categories: Array.from(categoriesMap.entries()).map(([name, items]) => ({ name, items }))
  };
}

console.log('🍕 UNIVERSAL MENU PARSER TEST\n');
const result = parseUniversalMenu(content, 'https://gatineau.milanopizzeria.ca/?p=menu');

console.log(`Restaurant: ${result.restaurant.name}`);
console.log(`Cuisine: ${result.restaurant.cuisine}\n`);

let totalItems = 0;
console.log('📂 Categories:');
result.categories.forEach(cat => {
  console.log(`  ${cat.name}: ${cat.items.length} items`);
  totalItems += cat.items.length;
});

console.log(`\n✅ Total items found: ${totalItems}`);

console.log('\n🔍 Sample items with prices:');
result.categories.slice(0, 3).forEach(cat => {
  console.log(`\n${cat.name}:`);
  cat.items.slice(0, 3).forEach(item => {
    const priceStr = item.prices.map(p => `${p.size}: $${p.price}`).join(', ');
    console.log(`  - ${item.name} (${priceStr})`);
    if (item.description) {
      console.log(`    "${item.description}"`);
    }
  });
});
