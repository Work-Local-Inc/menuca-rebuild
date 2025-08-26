// Milano Pizza parser - SIMPLE VERSION THAT ACTUALLY WORKS
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
  const categoriesMap = new Map<string, MenuItem[]>();
  let currentCategory = 'Menu Items';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty and table header lines
    if (!line || line.includes('| ---')) continue;
    
    // Simple category detection
    if (line.length < 50 && line.length > 3 && 
        !line.includes('$') && !line.includes('|') && !line.includes('[') &&
        (line.includes('Pizza') || line.includes('Poutine') || line.includes('Sandwich') ||
         line.includes('Nachos') || line.includes('Pâtes') || line.includes('Dessert') ||
         line.includes('Breuvage') || line.includes('Accompagnement') || line.includes('Menu') ||
         line.includes('Spécial') || line.includes('Offres'))) {
      currentCategory = line;
      continue;
    }
    
    // Find items - non-price lines that have prices in next few lines
    if (!line.includes('$') && !line.includes('|') && line.length > 5 && 
        !line.toLowerCase().includes('choisissez') && !line.includes('[')) {
      
      // Look for prices in next 5 lines
      const prices: Array<{ size: string; price: number }> = [];
      let foundPrice = false;
      let description = '';
      
      for (let j = 1; j <= 5; j++) {
        const checkLine = lines[i + j]?.trim() || '';
        
        // Description is usually the first non-empty line after item name
        if (j === 1 && checkLine && !checkLine.includes('$') && !checkLine.includes('|')) {
          description = checkLine;
        }
        
        // Look for price tables
        if (checkLine.includes('$') && checkLine.includes('|')) {
          // Extract all prices from table row
          const priceMatches = checkLine.matchAll(/»\s*([^|]+?)\s*\|\s*\$\s*([\d.]+)/g);
          for (const match of priceMatches) {
            prices.push({
              size: match[1].trim(),
              price: parseFloat(match[2])
            });
            foundPrice = true;
          }
        }
        // Also handle simple price format
        else if (checkLine.includes('$')) {
          const simpleMatch = checkLine.match(/\$\s*([\d.]+)/);
          if (simpleMatch) {
            prices.push({
              size: 'Regular',
              price: parseFloat(simpleMatch[1])
            });
            foundPrice = true;
          }
        }
      }
      
      if (foundPrice && prices.length > 0) {
        const item: MenuItem = {
          name: line,
          description: description,
          prices: prices
        };
        
        if (!categoriesMap.has(currentCategory)) {
          categoriesMap.set(currentCategory, []);
        }
        categoriesMap.get(currentCategory)!.push(item);
      }
    }
  }
  
  // Convert map to array
  const categories: MenuCategory[] = [];
  for (const [name, items] of categoriesMap) {
    if (items.length > 0) {
      categories.push({ name, items });
    }
  }
  
  return categories;
}