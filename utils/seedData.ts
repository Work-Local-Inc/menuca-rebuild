// Import real scraped Xtreme Pizza data
import { xtremeMenuData } from '../data/xtreme-pizza-complete';

export const seedPizzaRestaurantData = async (restaurantId: string) => {
  console.log('🍕 Loading REAL Xtreme Pizza data to ENTERPRISE BACKEND for restaurant:', restaurantId);
  
  try {
    // Convert scraped data to Supabase format
    const menuPayload = {
      restaurantId: restaurantId,
      tenantId: 'default-tenant', 
      name: "Xtreme Pizza Menu",
      description: "Real scraped menu from Xtreme Pizza Ottawa - 33 authentic items",
      categories: xtremeMenuData.categories.map((category, categoryIndex) => ({
        name: category.name,
        description: `Fresh ${category.name.toLowerCase()} selection`,
        display_order: categoryIndex + 1,
        is_active: true,
        items: category.items.map((item, itemIndex) => ({
          name: item.name,
          description: item.description || '',
          price: item.variants[0]?.price / 100 || 0, // Convert cents to dollars
          cost: (item.variants[0]?.price / 100 * 0.4) || 0, // 40% cost estimate
          variants: item.variants, // Keep original variants
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
            available_times: [{ start_time: '11:00', end_time: '23:00' }]
          },
          display_order: itemIndex + 1,
          is_active: true,
          is_featured: itemIndex < 3,
          preparation_time: category.name.toLowerCase().includes('pizza') ? 20 : 
                           category.name.toLowerCase().includes('salad') ? 8 : 12
        }))
      })),
      is_active: true,
      display_order: 1
    };

    // POST to REAL Supabase database via Next.js API
    const response = await fetch(`/api/menu-management/restaurant/${restaurantId}/menus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(menuPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Xtreme Pizza menu loaded to ENTERPRISE BACKEND:', result);
      return true; // Success
    } else {
      const error = await response.text();
      console.error('❌ Failed to load menu to enterprise backend:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to enterprise backend:', error);
    return false;
  }
};