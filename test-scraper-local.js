const fs = require('fs');

// Test the parser with the actual scraped data
const content = fs.readFileSync('scraped-menu.md', 'utf8');

// SUPER SIMPLE PARSER - just find all the fucking items
function parseMenuSimple(markdown) {
  const lines = markdown.split('\n');
  const items = [];
  const categories = new Map();
  
  let currentCategory = 'Uncategorized';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim() || '';
    const nextNextLine = lines[i + 2]?.trim() || '';
    
    // Skip empty and table lines
    if (!line || line.includes('| ---')) continue;
    
    // Simple category detection - standalone lines that look like categories
    if (line.length < 50 && line.length > 3 && 
        !line.includes('$') && !line.includes('|') && !line.includes('[') &&
        (line.includes('Pizza') || line.includes('Poutine') || line.includes('Sandwich') ||
         line.includes('Nachos') || line.includes('Pâtes') || line.includes('Dessert') ||
         line.includes('Breuvage') || line.includes('Accompagnement') || line.includes('Menu'))) {
      currentCategory = line;
      continue;
    }
    
    // Find items - look for price patterns in next few lines
    if (!line.includes('$') && !line.includes('|') && line.length > 5) {
      // Check next 5 lines for a price
      let foundPrice = false;
      let lowestPrice = 999;
      
      for (let j = 1; j <= 5; j++) {
        const checkLine = lines[i + j]?.trim() || '';
        if (checkLine.includes('$')) {
          const priceMatch = checkLine.match(/\$\s*(\d+\.?\d*)/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1]);
            if (price < lowestPrice) {
              lowestPrice = price;
            }
            foundPrice = true;
          }
        }
      }
      
      if (foundPrice && lowestPrice < 999) {
        const item = {
          name: line,
          category: currentCategory,
          price: lowestPrice,
          description: nextLine.includes('$') ? '' : nextLine
        };
        
        items.push(item);
        
        if (!categories.has(currentCategory)) {
          categories.set(currentCategory, []);
        }
        categories.get(currentCategory).push(item);
      }
    }
  }
  
  return { items, categories };
}

console.log('🍕 SIMPLE MILANO SCRAPER TEST\n');
const result = parseMenuSimple(content);

console.log(`✅ Found ${result.items.length} total items\n`);

console.log('📂 Categories:');
for (const [category, items] of result.categories) {
  console.log(`  ${category}: ${items.length} items`);
}

console.log('\n🔍 Sample items:');
result.items.slice(0, 10).forEach(item => {
  console.log(`  - ${item.name} ($${item.price})`);
});

console.log('\n🍕 Pizza items:');
result.items.filter(i => i.category.includes('Pizza')).slice(0, 10).forEach(item => {
  console.log(`  - ${item.name} ($${item.price})`);
});
