// Milano Pizza parser - handles their specific table-based menu format
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
  let collectingDescription = false;
  
  // Milano categories we're looking for
  const categoryNames = [
    'Spécial Lundi & Mardi',
    'Prix de Groupe', 
    'Spécial 2 Pizzas',
    'Pizza et Poutine',
    'Pizzas et Accompagnements',
    'Offres Duo',
    'Accompagnement',
    'Trempettes',
    'Poutine',
    'Nos Poutines Végétaliennes',
    'Les Sandwiches',
    'Nos Nachos',
    'Menu Pizza',
    'Nos Pizza Végétalienne',
    'Nos Pâtes',
    'Dessert',
    'Breuvage'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim() || '';
    const prevLine = lines[i - 1]?.trim() || '';
    
    // Skip empty lines and junk
    if (!line || line === '|' || line.includes('| ---') || line.includes('[Haut]')) {
      continue;
    }
    
    // Category detection
    if (categoryNames.includes(line) && prevLine === '') {
      // Save previous data
      if (currentItem && currentItem.prices.length > 0 && currentCategory) {
        currentCategory.items.push(currentItem);
      }
      if (currentCategory && currentCategory.items.length > 0) {
        categories.push(currentCategory);
      }
      
      currentCategory = {
        name: line,
        items: []
      };
      currentItem = null;
      collectingDescription = false;
      continue;
    }
    
    // Item name detection - look for patterns in Milano menu
    if (currentCategory && !line.includes('$') && !line.includes('|') && 
        prevLine === '' && nextLine !== '' && line.length > 3 && line.length < 100) {
      
      // Check if this looks like an item name
      const looksLikeItem = !line.toLowerCase().includes('choisissez') &&
                           !line.startsWith('»') &&
                           !line.match(/^\d/) &&
                           !categoryNames.includes(line);
      
      if (looksLikeItem) {
        // Save previous item
        if (currentItem && currentItem.prices.length > 0) {
          currentCategory.items.push(currentItem);
        }
        
        currentItem = {
          name: line,
          description: '',
          prices: []
        };
        collectingDescription = true;
        continue;
      }
    }
    
    // Description collection
    if (currentItem && collectingDescription && !line.includes('$') && !line.includes('|')) {
      currentItem.description = line;
      collectingDescription = false;
      continue;
    }
    
    // Price extraction from table rows
    if (currentItem && line.includes('$') && line.includes('|')) {
      const parts = line.split('|');
      for (const part of parts) {
        if (part.includes('»') && part.includes('$')) {
          const sizeMatch = part.match(/»\s*([^$]+)/);
          const priceMatch = part.match(/\$\s*([\d.]+)/);
          if (sizeMatch && priceMatch) {
            currentItem.prices.push({
              size: sizeMatch[1].trim(),
              price: parseFloat(priceMatch[1])
            });
          }
        }
      }
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