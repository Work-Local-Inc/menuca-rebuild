// SIMPLE SCRAPER - NO BULLSHIT - JUST GET THE MENU

interface Price {
  size: string;
  price: number;
}

interface MenuItem {
  name: string;
  description: string;
  prices: Price[];
  index?: number;
  htmlPosition?: number;
}

interface Category {
  name: string;
  items: MenuItem[];
}

export function scrapeXtremePizzaMenu(html: string) {
  const categories: Category[] = [];
  
  // The menu has category headers like "Appetizers", "Pizza", etc.
  // Find them by looking for the pattern in the HTML
  const categoryRegex = /<h3[^>]*>([^<]+)<\/h3>|<div[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)</g;
  
  // Also look for the jump menu which lists all categories
  const jumpMenuMatch = html.match(/Jump to course --([^|]+)\|/);
  let categoryNames: string[] = [];
  
  if (jumpMenuMatch) {
    // Extract category names from the jump menu
    categoryNames = jumpMenuMatch[1]
      .split(/(?=[A-Z])/)  // Split on capital letters
      .map(c => c.trim())
      .filter(c => c && c.length > 2);
    
    console.log('Found categories from jump menu:', categoryNames);
  }
  
  // If no categories found in jump menu, use defaults
  if (categoryNames.length === 0) {
    categoryNames = ['Appetizers', 'Pizza', 'Wings', 'Poutine', 'Pasta', 'Subs', 'Salads', 'Beverages'];
  }
  
  // Find all menu items - they're in divs with "alternate_1" or "alternate_2" class
  const itemBlocks = html.match(/<div class="alternate_[12]"[\s\S]*?<\/form>/g) || [];
  
  console.log(`Found ${itemBlocks.length} menu item blocks in HTML`);
  
  // Extract all items first
  const allItems: MenuItem[] = [];
  let currentIndex = 0;
  
  itemBlocks.forEach(block => {
    // Extract item name - it's in a <p style="font-weight: bold">
    const nameMatch = block.match(/<p[^>]*font-weight:\s*bold[^>]*>([^<]+)</);
    const name = nameMatch ? nameMatch[1].trim() : '';
    
    // Skip if no name
    if (!name) return;
    
    // Extract description - next paragraph after name
    const descMatch = block.match(/<p[^>]*line-height[^>]*>([^<]+)</);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract ALL prices from the block
    const prices: Price[] = [];
    const priceMatches = Array.from(block.matchAll(/<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>\s*\$\s*([\d.]+)/g));
    
    for (const match of priceMatches) {
      const size = match[1].trim() || 'Regular';
      const price = parseFloat(match[2]);
      if (price > 0) {
        prices.push({ size, price });
      }
    }
    
    if (prices.length > 0) {
      allItems.push({ 
        name, 
        description, 
        prices,
        index: currentIndex++,
        htmlPosition: html.indexOf(block)
      });
    }
  });
  
  console.log(`Extracted ${allItems.length} items with prices`);
  
  // Now organize items into categories
  // Since the HTML doesn't clearly separate categories, we'll group by item type
  const appetizers = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('platter') || n.includes('bread') || n.includes('sticks') || 
           n.includes('nachos') || n.includes('fries') || n.includes('cheese') ||
           n.includes('jalapeno') || n.includes('slammer');
  });
  
  const pizzas = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('pizza') && !n.includes('deal');
  });
  
  const wings = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('wing') || n.includes('boneless');
  });
  
  const poutines = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('poutine');
  });
  
  const pasta = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('pasta') || n.includes('spaghetti') || n.includes('lasagna') || n.includes('alfredo');
  });
  
  const subs = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('sub') || n.includes('sandwich') || n.includes('wrap') || 
           n.includes('donair') || n.includes('shawarma') || n.includes('club');
  });
  
  const salads = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('salad');
  });
  
  const beverages = allItems.filter(item => {
    const n = item.name.toLowerCase();
    return n.includes('drink') || n.includes('coke') || n.includes('pepsi') || 
           n.includes('sprite') || n.includes('water') || n.includes('juice');
  });
  
  // Add categories with items
  if (appetizers.length > 0) categories.push({ name: 'Appetizers', items: appetizers });
  if (pizzas.length > 0) categories.push({ name: 'Pizza', items: pizzas });
  if (wings.length > 0) categories.push({ name: 'Wings', items: wings });
  if (poutines.length > 0) categories.push({ name: 'Poutine', items: poutines });
  if (pasta.length > 0) categories.push({ name: 'Pasta', items: pasta });
  if (subs.length > 0) categories.push({ name: 'Subs & Sandwiches', items: subs });
  if (salads.length > 0) categories.push({ name: 'Salads', items: salads });
  if (beverages.length > 0) categories.push({ name: 'Beverages', items: beverages });
  
  // Find uncategorized items
  const categorizedItems = new Set([
    ...appetizers, ...pizzas, ...wings, ...poutines, 
    ...pasta, ...subs, ...salads, ...beverages
  ].map(i => i.name));
  
  const other = allItems.filter(item => !categorizedItems.has(item.name));
  if (other.length > 0) {
    categories.push({ name: 'Other Items', items: other });
  }
  
  return {
    totalItems: allItems.length,
    categories
  };
}
