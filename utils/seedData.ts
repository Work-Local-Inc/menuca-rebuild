export const seedPizzaRestaurantData = (restaurantId: string) => {
  console.log('seedPizzaRestaurantData called with restaurantId:', restaurantId);
  const now = Date.now();
  
  const pizzaMenu = {
    id: `menu-pizza-${now}`,
    restaurantId: restaurantId,
    tenantId: 'default-tenant',
    name: "Mario's Pizza Menu",
    description: "Authentic Italian pizza made with fresh ingredients",
    categories: [
      {
        id: `category-appetizers-${now}`,
        name: "Appetizers",
        description: "Start your meal with our delicious appetizers",
        display_order: 1,
        is_active: true,
        items: [
          {
            id: `item-garlic-bread-${now + 1}`,
            categoryId: `category-appetizers-${now}`,
            name: "Garlic Bread",
            description: "Fresh baked bread with garlic butter and herbs",
            price: 6.99,
            cost: 2.50,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["gluten", "dairy"],
            tags: ["vegetarian", "popular"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 1,
            is_active: true,
            is_featured: false,
            preparation_time: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `item-buffalo-wings-${now + 2}`,
            categoryId: `category-appetizers-${now}`,
            name: "Buffalo Wings",
            description: "Crispy chicken wings tossed in spicy buffalo sauce",
            price: 12.99,
            cost: 5.50,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["dairy"],
            tags: ["spicy", "popular"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 2,
            is_active: true,
            is_featured: true,
            preparation_time: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: `category-pizzas-${now}`,
        name: "Signature Pizzas",
        description: "Our famous handcrafted pizzas with premium toppings",
        display_order: 2,
        is_active: true,
        items: [
          {
            id: `item-margherita-${now + 10}`,
            categoryId: `category-pizzas-${now}`,
            name: "Margherita Pizza",
            description: "Classic pizza with fresh mozzarella, basil, and tomato sauce",
            price: 16.99,
            cost: 6.50,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["gluten", "dairy"],
            tags: ["vegetarian", "classic", "popular"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 1,
            is_active: true,
            is_featured: true,
            preparation_time: 18,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `item-pepperoni-${now + 11}`,
            categoryId: `category-pizzas-${now}`,
            name: "Pepperoni Supreme",
            description: "Loaded with premium pepperoni and extra mozzarella cheese",
            price: 19.99,
            cost: 7.80,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["gluten", "dairy"],
            tags: ["meat-lovers", "popular"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 2,
            is_active: true,
            is_featured: true,
            preparation_time: 20,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `item-bbq-chicken-${now + 12}`,
            categoryId: `category-pizzas-${now}`,
            name: "BBQ Chicken",
            description: "Grilled chicken, red onions, cilantro, and tangy BBQ sauce",
            price: 21.99,
            cost: 8.50,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["gluten", "dairy"],
            tags: ["chicken", "bbq", "popular"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 3,
            is_active: true,
            is_featured: true,
            preparation_time: 20,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: `category-desserts-${now}`,
        name: "Sweet Endings",
        description: "Delicious desserts to complete your meal",
        display_order: 3,
        is_active: true,
        items: [
          {
            id: `item-tiramisu-${now + 20}`,
            categoryId: `category-desserts-${now}`,
            name: "Tiramisu",
            description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
            price: 7.99,
            cost: 3.20,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["dairy", "gluten", "eggs"],
            tags: ["classic", "coffee"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 1,
            is_active: true,
            is_featured: true,
            preparation_time: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }
    ],
    is_active: true,
    display_order: 1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'seed-data'
  };

  // Store the seeded menu data
  const existingMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
  const menuExists = existingMenus.some((menu: any) => menu.name === "Mario's Pizza Menu");
  
  if (!menuExists) {
    existingMenus.push(pizzaMenu);
    localStorage.setItem(`menus_${restaurantId}`, JSON.stringify(existingMenus));
    console.log('Pizza menu data saved:', pizzaMenu);
    return true; // Data was added
  }
  
  return false; // Data already exists
};