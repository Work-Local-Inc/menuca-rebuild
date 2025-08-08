// Import real scraped Xtreme Pizza data
import { xtremeMenuData } from '../data/xtreme-pizza-complete';

export const seedPizzaRestaurantData = (restaurantId: string) => {
  console.log('seedPizzaRestaurantData called with restaurantId:', restaurantId);
  const now = Date.now();
  
  // Convert scraped data to MenuCA format
  const categories = xtremeMenuData.categories.map((category, categoryIndex) => ({
    id: `category-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${now}`,
    name: category.name,
    description: `Fresh ${category.name.toLowerCase()} selection`,
    display_order: categoryIndex + 1,
    is_active: true,
    items: category.items.map((item, itemIndex) => ({
      id: `item-${item.id}-${now + itemIndex}`,
      categoryId: `category-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${now}`,
      name: item.name,
      description: item.description || '',
      price: item.variants[0]?.price / 100 || 0, // Use first variant price as base price
      cost: (item.variants[0]?.price / 100 * 0.4) || 0, // Estimated cost at 40%
      images: [],
      options: item.variants.map((variant, variantIndex) => ({
        id: `option-${variant.size.toLowerCase()}-${now + itemIndex + variantIndex}`,
        name: variant.size,
        price_adjustment: (variant.price - item.variants[0].price) / 100, // Price difference from base
        is_default: variantIndex === 0
      })),
      variants: item.variants, // Keep original variants for compatibility
      nutritional_info: {},
      allergens: category.name.toLowerCase().includes('pizza') ? ["gluten", "dairy"] : [],
      tags: [
        ...(item.description.toLowerCase().includes('spicy') || item.description.toLowerCase().includes('hot') ? ['spicy'] : []),
        ...(category.name.toLowerCase().includes('pizza') ? ['pizza'] : []),
        ...(item.name.toLowerCase().includes('chicken') ? ['chicken'] : []),
        ...(item.name.toLowerCase().includes('vegetarian') || item.name.toLowerCase().includes('veggie') ? ['vegetarian'] : [])
      ],
      availability: {
        is_available: true,
        available_days: [1, 2, 3, 4, 5, 6, 7],
        available_times: [{ start_time: '11:00', end_time: '23:00' }],
        stock_quantity: null,
        out_of_stock_message: ''
      },
      display_order: itemIndex + 1,
      is_active: true,
      is_featured: itemIndex < 3, // Mark first 3 items in each category as featured
      preparation_time: category.name.toLowerCase().includes('pizza') ? 20 : 
                       category.name.toLowerCase().includes('salad') ? 8 : 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }));

  const pizzaMenu = {
    id: `menu-xtreme-pizza-${now}`,
    restaurantId: restaurantId,
    tenantId: 'default-tenant',
    name: "Xtreme Pizza Menu",
    description: "Real scraped menu from Xtreme Pizza Ottawa - 33 authentic items",
    categories: categories,
    is_active: true,
    display_order: 1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'seed-data'
  };

  // Store the seeded menu data
  const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
  const menuExists = existingMenus.some((menu: any) => menu.name === "Xtreme Pizza Menu");
  
  if (!menuExists) {
    // Remove any old Mario's Pizza Menu data
    const cleanedMenus = existingMenus.filter((menu: any) => menu.name !== "Mario's Pizza Menu");
    cleanedMenus.push(pizzaMenu);
    localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(cleanedMenus));
    console.log('Xtreme Pizza menu data saved with', categories.length, 'categories and', 
                categories.reduce((total, cat) => total + cat.items.length, 0), 'items');
    return true; // Data was added
  }
  
  return false; // Data already exists
};