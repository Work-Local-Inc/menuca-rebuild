// Simplified Milano Pizza parser that actually works
interface MenuItem {
  name: string;
  description: string;
  prices: Array<{ size: string; price: number }>;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export function parseMilanoMenu(markdown: string): MenuCategory[] {
  const lines = markdown.split('\n');
  const categories: MenuCategory[] = [];
  let currentCategory: MenuCategory | null = null;
  let currentItem: MenuItem | null = null;
  let inPriceTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and table separators
    if (!line || line === '|' || line.startsWith('| ---')) continue;
    
    // Category detection - standalone lines that are category headers
    if (isCategoryHeader(line) && !inPriceTable) {
      if (currentCategory && currentCategory.items.length > 0) {
        categories.push(currentCategory);
      }
      currentCategory = {
        name: line,
        items: []
      };
      currentItem = null;
      continue;
    }
    
    // Item name detection - comes after category, before description
    if (currentCategory && !inPriceTable && isItemName(line, lines, i)) {
      // Save previous item if exists
      if (currentItem && currentItem.prices.length > 0) {
        currentCategory.items.push(currentItem);
      }
      
      currentItem = {
        name: line,
        description: '',
        prices: []
      };
      continue;
    }
    
    // Description - comes after item name
    if (currentItem && !inPriceTable && line.length > 20 && !line.includes('$')) {
      currentItem.description = line;
      continue;
    }
    
    // Price table detection
    if (line.includes('» ') && line.includes('$')) {
      inPriceTable = true;
      const price = extractPriceFromTableRow(line);
      if (price && currentItem) {
        currentItem.prices.push(price);
      }
    } else if (inPriceTable && !line.includes('$')) {
      inPriceTable = false;
    }
  }
  
  // Don't forget the last ones
  if (currentItem && currentItem.prices.length > 0 && currentCategory) {
    currentCategory.items.push(currentItem);
  }
  if (currentCategory && currentCategory.items.length > 0) {
    categories.push(currentCategory);
  }
  
  return categories;
}

function isCategoryHeader(line: string): boolean {
  const categories = [
    'Menu Pizza', 'Nos Pizza', 'Pizza',
    'Nos Poutines', 'Poutine',
    'Les Sandwiches', 'Sandwich', 'Sous-Marin',
    'Nos Nachos', 'Nachos',
    'Nos Pâtes', 'Pâtes',
    'Dessert', 'Breuvage',
    'Accompagnement', 'Trempettes',
    'Spécial', 'Offres'
  ];
  
  return categories.some(cat => line.includes(cat)) && line.length < 50;
}

function isItemName(line: string, lines: string[], index: number): boolean {
  // Item names are usually followed by a description or price table
  if (line.length < 5 || line.length > 100) return false;
  
  // Look ahead for prices
  for (let j = index + 1; j < Math.min(index + 5, lines.length); j++) {
    if (lines[j].includes('$')) return true;
  }
  
  return false;
}

function extractPriceFromTableRow(line: string): { size: string, price: number } | null {
  // Extract from format: | » Petit | $ 13.99 | ...
  const match = line.match(/»\s*([^|]+)\s*\|\s*\$\s*([\d.]+)/);
  if (match) {
    return {
      size: match[1].trim(),
      price: parseFloat(match[2])
    };
  }
  
  // Also try simple price format
  const simpleMatch = line.match(/\$\s*([\d.]+)/);
  if (simpleMatch) {
    return {
      size: 'Regular',
      price: parseFloat(simpleMatch[1])
    };
  }
  
  return null;
}
