// Universal Menu Parser for all restaurant menu sites (Milano, Tony's, Xtreme, etc.)
// They all use the same ordering system with similar HTML/Markdown structure

interface MenuItem {
  name: string;
  description: string;
  prices: Array<{ size: string; price: number }>;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

interface ParsedMenu {
  restaurant: {
    name: string;
    cuisine: string;
    website: string;
  };
  categories: MenuCategory[];
}

export function parseUniversalMenu(markdown: string, url: string): ParsedMenu {
  const lines = markdown.split('\n');
  const categoriesMap = new Map<string, MenuItem[]>();
  let currentCategory = 'Menu Items';
  let restaurantName = 'Restaurant';
  
  // Extract restaurant name from content
  if (markdown.includes('Milano')) restaurantName = 'Milano Pizzeria';
  else if (markdown.includes("Tony's")) restaurantName = "Tony's Pizza";
  else if (markdown.includes('Xtreme')) restaurantName = 'Xtreme Pizza';
  
  // Determine cuisine type
  let cuisine = 'Pizza';
  if (markdown.includes('Poutine') && markdown.includes('Sous-Marin')) {
    cuisine = 'Pizza & Canadian';
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, table headers, and navigation elements
    if (!line || line.includes('| ---') || line.includes('[](#)') || 
        line.includes('Choisissez cet item') || line.includes('Choose this item')) {
      continue;
    }
    
    // Category detection - look for section headers
    if (isCategory(line)) {
      currentCategory = cleanCategoryName(line);
      continue;
    }
    
    // Item detection - look for item names followed by descriptions and prices
    if (isPotentialItem(line)) {
      const item = extractMenuItem(lines, i);
      if (item && item.prices.length > 0) {
        if (!categoriesMap.has(currentCategory)) {
          categoriesMap.set(currentCategory, []);
        }
        categoriesMap.get(currentCategory)!.push(item);
        
        // Skip lines we've already processed
        i += item.linesProcessed || 0;
      }
    }
  }
  
  // Convert map to array and filter out empty categories
  const categories: MenuCategory[] = [];
  categoriesMap.forEach((items, name) => {
    if (items.length > 0) {
      categories.push({ name, items });
    }
  });
  
  // Merge similar categories
  const mergedCategories = mergeSimilarCategories(categories);
  
  return {
    restaurant: {
      name: restaurantName,
      cuisine: cuisine,
      website: url
    },
    categories: mergedCategories
  };
}

function isCategory(line: string): boolean {
  // Categories are usually standalone lines without prices or table formatting
  if (line.includes('$') || line.includes('|') || line.length > 60) {
    return false;
  }
  
  // Common category keywords
  const categoryKeywords = [
    'Pizza', 'Poutine', 'Sandwich', 'Burger', 'Nachos', 'Pâtes', 'Pasta',
    'Dessert', 'Breuvage', 'Beverage', 'Drink', 'Accompagnement', 'Side',
    'Appetizer', 'Entrée', 'Wings', 'Salad', 'Combo', 'Special', 'Menu',
    'Submarine', 'Sub', 'Wrap', 'Vegan', 'Végé'
  ];
  
  return categoryKeywords.some(keyword => 
    line.toLowerCase().includes(keyword.toLowerCase())
  );
}

function cleanCategoryName(name: string): string {
  // Remove common prefixes
  name = name.replace(/^(Nos |Our |Les |The )/i, '');
  // Remove "Haut" (back to top) if present
  name = name.replace(/\s*Haut\s*$/i, '');
  return name.trim();
}

function isPotentialItem(line: string): boolean {
  // Items are usually non-empty lines without special formatting
  return line.length > 3 && 
         !line.includes('$') && 
         !line.includes('|') &&
         !line.includes('»') &&
         !line.toLowerCase().includes('choisissez') &&
         !line.toLowerCase().includes('choose') &&
         !line.startsWith('[') &&
         !line.startsWith('*') &&
         !line.includes('Haut') &&
         !line.includes('![') && // Skip images
         !line.includes('](') && // Skip links
         !line.includes('Loading') &&
         !line.includes('close.png') &&
         !line.includes('.gif') &&
         !line.includes('.png') &&
         !line.includes('---') &&
         line.trim() !== '*' &&
         line.trim() !== '* * *';
}

function extractMenuItem(lines: string[], startIndex: number): MenuItem & { linesProcessed?: number } | null {
  const itemName = lines[startIndex].trim();
  let description = '';
  const prices: Array<{ size: string; price: number }> = [];
  let linesProcessed = 0;
  
  // Look ahead for description and prices
  for (let j = 1; j <= 10 && startIndex + j < lines.length; j++) {
    const nextLine = lines[startIndex + j].trim();
    
    // Stop if we hit another potential item or category
    if (nextLine && !nextLine.includes('$') && !nextLine.includes('|') && 
        !nextLine.includes('»') && isPotentialItem(nextLine)) {
      break;
    }
    
    // Extract description (first non-price line after item name)
    if (!description && nextLine && !nextLine.includes('$') && 
        !nextLine.includes('|') && !nextLine.includes('»')) {
      description = nextLine;
      linesProcessed = j;
    }
    
    // Extract prices from table format: | » Size | $ Price | [Link] |
    if (nextLine.includes('$') && nextLine.includes('|')) {
                const priceRegex = /»\s*([^|]+?)\s*\|\s*\$\s*([\d.]+)/g;
          let match;
          while ((match = priceRegex.exec(nextLine)) !== null) {
            prices.push({
              size: match[1].trim(),
              price: parseFloat(match[2])
            });
          }
      linesProcessed = j;
    }
    
    // Also handle simple price format: | | $ Price | [Link] |
    if (nextLine.includes('$') && !nextLine.includes('»')) {
      const simpleMatch = nextLine.match(/\$\s*([\d.]+)/);
      if (simpleMatch) {
        prices.push({
          size: 'Regular',
          price: parseFloat(simpleMatch[1])
        });
        linesProcessed = j;
      }
    }
  }
  
  // Only return if we found prices
  if (prices.length > 0) {
    return {
      name: itemName,
      description: description || '',
      prices: prices,
      linesProcessed: linesProcessed
    };
  }
  
  return null;
}

function mergeSimilarCategories(categories: MenuCategory[]): MenuCategory[] {
  const merged = new Map<string, MenuItem[]>();
  
  // Define category mappings
  const categoryMappings: { [key: string]: string } = {
    'Pizza au fromage': 'Pizzas',
    'Pizza Pepperoni': 'Pizzas',
    'Pizza': 'Pizzas',
    'Menu Pizza': 'Pizzas',
    'Pizza Végé': 'Vegan Pizzas',
    'Pizza Végétalienne': 'Vegan Pizzas',
    'Poutine Classique': 'Poutines',
    'Poutine': 'Poutines',
    'Nos Poutines': 'Poutines',
    'Les Sandwiches': 'Sandwiches & Subs',
    'Sous-Marin': 'Sandwiches & Subs',
    'Sandwich': 'Sandwiches & Subs',
    'Burger': 'Burgers',
    'Nos Nachos': 'Nachos',
    'Nachos': 'Nachos',
    'Pâtes': 'Pasta',
    'Nos Pâtes': 'Pasta',
    'Pasta': 'Pasta',
    'Accompagnement': 'Sides & Appetizers',
    'Trempettes': 'Sides & Appetizers',
    'Wings': 'Wings',
    'Ailes': 'Wings',
    'Breuvage': 'Beverages',
    'Beverage': 'Beverages',
    'Drink': 'Beverages'
  };
  
  // Merge categories
  categories.forEach(category => {
    let targetCategory = category.name;
    
    // Check if this category should be merged
    Object.entries(categoryMappings).forEach(([pattern, target]) => {
      if (category.name.toLowerCase().includes(pattern.toLowerCase())) {
        targetCategory = target;
      }
    });
    
    if (!merged.has(targetCategory)) {
      merged.set(targetCategory, []);
    }
    merged.get(targetCategory)!.push(...category.items);
  });
  
  // Convert back to array
  const result: MenuCategory[] = [];
  merged.forEach((items, name) => {
    // Remove duplicates based on item name
    const uniqueItems = new Map<string, MenuItem>();
    items.forEach(item => {
      if (!uniqueItems.has(item.name)) {
        uniqueItems.set(item.name, item);
      }
    });
    
    result.push({
      name,
      items: Array.from(uniqueItems.values())
    });
  });
  
  return result;
}
