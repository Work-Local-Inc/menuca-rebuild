// Simple HTML menu parser for Xtreme Pizza style menus

interface ParsedMenuItem {
  name: string;
  description: string;
  prices: Array<{ size: string; price: number }>;
}

interface ParsedCategory {
  name: string;
  items: ParsedMenuItem[];
}

export function parseMenuFromHTML(html: string): { categories: ParsedCategory[] } {
  const categories: ParsedCategory[] = [];
  let currentCategory = 'Menu Items';
  
  // Extract all menu item blocks
  // Looking for divs with item name in bold and price table
  const itemRegex = /<p[^>]*style="[^"]*font-weight:\s*bold[^"]*"[^>]*>\s*([^<]+?)\s*<span/gi;
  const matches = Array.from(html.matchAll(itemRegex));
  
  console.log(`Found ${matches.length} potential menu items in HTML`);
  
  // For each match, extract the full item block
  matches.forEach((match, index) => {
    const itemName = match[1].trim();
    const startPos = match.index || 0;
    
    // Find the description (next <p> tag after the name)
    const descRegex = new RegExp(`${escapeRegex(itemName)}[\\s\\S]*?<p[^>]*style="[^"]*line-height[^>]*>([^<]+)</p>`, 'i');
    const descMatch = html.match(descRegex);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Find prices in the table that follows
    // Look for pattern: <td style="width: 20%"> $ XX.XX </td>
    const endPos = html.indexOf('</form>', startPos);
    const itemBlock = html.substring(startPos, endPos > startPos ? endPos : startPos + 2000);
    
    const prices: Array<{ size: string; price: number }> = [];
    
    // Extract prices with sizes (if they exist)
    const priceRowRegex = /<tr[^>]*>[\s\S]*?(?:<td[^>]*>([^<]*)<\/td>)?[\s\S]*?<td[^>]*>\s*\$\s*([\d.]+)\s*<\/td>/gi;
    let priceMatch;
    while ((priceMatch = priceRowRegex.exec(itemBlock)) !== null) {
      const size = priceMatch[1] ? priceMatch[1].trim() : 'Regular';
      const price = parseFloat(priceMatch[2]);
      if (price > 0) {
        prices.push({ size, price });
      }
    }
    
    // Only add items with valid prices
    if (prices.length > 0 && itemName && !itemName.includes('Jump to course')) {
      // Try to determine category from item name or position
      const category = determineCategory(itemName, description);
      
      // Find or create category
      let categoryObj = categories.find(c => c.name === category);
      if (!categoryObj) {
        categoryObj = { name: category, items: [] };
        categories.push(categoryObj);
      }
      
      categoryObj.items.push({
        name: itemName,
        description: description,
        prices: prices
      });
    }
  });
  
  return { categories };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function determineCategory(itemName: string, description: string): string {
  const name = itemName.toLowerCase();
  const desc = description.toLowerCase();
  
  // Pizza detection
  if (name.includes('pizza') || desc.includes('pizza')) {
    return 'Pizza';
  }
  
  // Appetizers
  if (name.includes('platter') || name.includes('sticks') || name.includes('bread') || 
      name.includes('nachos') || name.includes('fries')) {
    return 'Appetizers';
  }
  
  // Wings
  if (name.includes('wing') || name.includes('boneless')) {
    return 'Wings';
  }
  
  // Poutine
  if (name.includes('poutine')) {
    return 'Poutine';
  }
  
  // Subs/Sandwiches
  if (name.includes('sub') || name.includes('sandwich') || name.includes('wrap') ||
      name.includes('donair') || name.includes('shawarma')) {
    return 'Subs & Sandwiches';
  }
  
  // Pasta
  if (name.includes('pasta') || name.includes('spaghetti') || name.includes('lasagna') ||
      name.includes('alfredo')) {
    return 'Pasta';
  }
  
  // Salads
  if (name.includes('salad')) {
    return 'Salads';
  }
  
  // Desserts
  if (name.includes('cake') || name.includes('ice cream') || desc.includes('dessert')) {
    return 'Desserts';
  }
  
  // Drinks
  if (name.includes('drink') || name.includes('beverage') || name.includes('coke') ||
      name.includes('pepsi') || name.includes('water')) {
    return 'Beverages';
  }
  
  // Default
  return 'Menu Items';
}
