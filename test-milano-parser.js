const fs = require('fs');

// Read the scraped content
const content = fs.readFileSync('scraped-menu.md', 'utf8');

function isPotentialCategoryHeader(line) {
  const categoryPatterns = [
    /^Spécial/i,
    /Pizza/i,
    /Poutine/i,
    /Sandwich/i,
    /Nachos/i,
    /Pâtes/i,
    /Dessert/i,
    /Breuvage/i,
    /Accompagnement/i,
    /Trempettes/i,
    /^Menu/i,
    /^Offres/i
  ];
  
  if (line.length > 50 || line.length < 3) return false;
  return categoryPatterns.some(pattern => pattern.test(line));
}

function extractPriceFromLine(line) {
  const priceMatch = line.match(/\$\s*(\d+\.?\d*)/);
  return priceMatch ? parseFloat(priceMatch[1]) : 0;
}

function extractMenuCategories(content) {
  const categories = [];
  const lines = content.split('\n');
  let currentCategory = null;
  let currentItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line || line.startsWith('|') || line.startsWith('-')) continue;
    
    if (isPotentialCategoryHeader(line)) {
      if (currentCategory && currentItems.length > 0) {
        categories.push({
          name: currentCategory,
          items: [...currentItems]
        });
      }
      
      currentCategory = line;
      currentItems = [];
      console.log(`📂 Found category: ${line}`);
      continue;
    }
    
    if (currentCategory) {
      // Look for prices in next few lines
      let foundPrice = 0;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const price = extractPriceFromLine(lines[j]);
        if (price > 0) {
          foundPrice = price;
          break;
        }
      }
      
      if (foundPrice > 0 && line.length > 5 && !line.includes('$')) {
        currentItems.push({
          name: line,
          price: foundPrice
        });
        console.log(`  🍕 ${line} - $${foundPrice}`);
      }
    }
  }
  
  if (currentCategory && currentItems.length > 0) {
    categories.push({
      name: currentCategory,
      items: currentItems
    });
  }
  
  return categories;
}

console.log('🔍 Testing Milano Pizza parser...');
const result = extractMenuCategories(content);

console.log('\n📊 RESULTS:');
console.log(`Categories found: ${result.length}`);
let totalItems = 0;
result.forEach(cat => {
  console.log(`${cat.name}: ${cat.items.length} items`);
  totalItems += cat.items.length;
});
console.log(`Total items: ${totalItems}`);
