const fs = require('fs');

// Read the scraped Milano menu
const content = fs.readFileSync('scraped-menu.md', 'utf8');

// Simplified parser that actually works for Milano format
function parseMilanoMenuFixed(markdown) {
  const lines = markdown.split('\n');
  const categories = [];
  let currentCategory = null;
  let currentItem = null;
  let collectingDescription = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim() || '';
    
    // Skip empty lines
    if (!line) continue;
    
    // Skip table headers and separators
    if (line.includes('| ---') || line.includes('[Haut]')) continue;
    
    // Category detection - lines that are category names
    if (isCategoryName(line) && !line.includes('$') && !line.includes('|')) {
      // Save previous category if it has items
      if (currentCategory && currentCategory.items.length > 0) {
        categories.push(currentCategory);
      }
      
      currentCategory = {
        name: line,
        items: []
      };
      currentItem = null;
      collectingDescription = false;
      console.log(`\n📁 Category: ${line}`);
      continue;
    }
    
    // Item detection - lines that are item names (followed by description or price)
    if (currentCategory && !line.includes('$') && !line.includes('|') && 
        line.length > 3 && line.length < 100 &&
        !collectingDescription && isLikelyItemName(line, nextLine)) {
      
      // Save previous item
      if (currentItem && currentItem.price > 0) {
        currentCategory.items.push(currentItem);
      }
      
      currentItem = {
        name: line,
        description: '',
        price: 0
      };
      collectingDescription = true;
      console.log(`  🍕 Item: ${line}`);
      continue;
    }
    
    // Description - line after item name
    if (currentItem && collectingDescription && !line.includes('$') && !line.includes('|')) {
      currentItem.description = line;
      collectingDescription = false;
      continue;
    }
    
    // Price extraction from table rows
    if (line.includes('$') && line.includes('|')) {
      const priceMatch = line.match(/\$\s*(\d+\.?\d*)/);
      if (priceMatch && currentItem) {
        const price = parseFloat(priceMatch[1]);
        if (currentItem.price === 0 || price < currentItem.price) {
          currentItem.price = price; // Take the lowest price
        }
      }
    }
  }
  
  // Don't forget the last ones
  if (currentItem && currentItem.price > 0 && currentCategory) {
    currentCategory.items.push(currentItem);
  }
  if (currentCategory && currentCategory.items.length > 0) {
    categories.push(currentCategory);
  }
  
  return categories;
}

function isCategoryName(line) {
  const patterns = [
    'Spécial', 'Pizza', 'Poutine', 'Sandwich', 'Nachos', 
    'Pâtes', 'Dessert', 'Breuvage', 'Accompagnement',
    'Menu', 'Offres', 'Trempettes', 'Végétalienne'
  ];
  
  return patterns.some(p => line.includes(p)) && line.length < 50;
}

function isLikelyItemName(line, nextLine) {
  // Item names are usually followed by descriptions or eventually prices
  if (line.startsWith('»') || line.startsWith('-')) return false;
  if (line.toLowerCase().includes('choisissez')) return false;
  
  // Check if it looks like a proper item name
  return line.length > 5 && !line.match(/^\d/);
}

console.log('🔍 Testing improved Milano parser...\n');
const result = parseMilanoMenuFixed(content);

console.log('\n📊 RESULTS:');
console.log(`Categories: ${result.length}`);
let totalItems = 0;
result.forEach(cat => {
  console.log(`  ${cat.name}: ${cat.items.length} items`);
  totalItems += cat.items.length;
});
console.log(`\nTotal items: ${totalItems}`);
