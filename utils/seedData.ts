export const seedPizzaRestaurantData = (restaurantId: string) => {
  const pizzaMenu = {
    id: `menu-pizza-${Date.now()}`,
    restaurantId: restaurantId,
    tenantId: 'default-tenant',
    name: "Mario's Pizza Menu",
    description: "Authentic Italian pizza made with fresh ingredients",
    categories: [
      {
        id: `category-appetizers-${Date.now()}`,
        name: "Appetizers",
        description: "Start your meal with our delicious appetizers",
        display_order: 1,
        is_active: true,
        items: [
          {
            id: `item-garlic-bread-${Date.now()}`,
            categoryId: `category-appetizers-${Date.now()}`,
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
            id: `item-buffalo-wings-${Date.now() + 1}`,
            categoryId: `category-appetizers-${Date.now()}`,
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
          },
          {
            id: `item-mozzarella-sticks-${Date.now() + 2}`,
            categoryId: `category-appetizers-${Date.now()}`,
            name: "Mozzarella Sticks",
            description: "Golden fried mozzarella served with marinara sauce",
            price: 8.99,
            cost: 3.20,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["dairy", "gluten"],
            tags: ["vegetarian", "kids-favorite"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 3,
            is_active: true,
            is_featured: false,
            preparation_time: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: `category-pizzas-${Date.now() + 10}`,
        name: "Signature Pizzas",
        description: "Our famous handcrafted pizzas with premium toppings",
        display_order: 2,
        is_active: true,
        items: [
          {
            id: `item-margherita-${Date.now() + 10}`,
            categoryId: `category-pizzas-${Date.now() + 10}`,
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
            id: `item-pepperoni-${Date.now() + 11}`,
            categoryId: `category-pizzas-${Date.now() + 10}`,
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
            id: `item-meat-lovers-${Date.now() + 12}`,
            categoryId: `category-pizzas-${Date.now() + 10}`,
            name: "Meat Lovers",
            description: "Pepperoni, sausage, ham, bacon, and ground beef",
            price: 24.99,
            cost: 10.20,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["gluten", "dairy"],
            tags: ["meat-lovers", "hearty"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 3,
            is_active: true,
            is_featured: false,
            preparation_time: 22,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `item-veggie-deluxe-${Date.now() + 13}`,
            categoryId: `category-pizzas-${Date.now() + 10}`,
            name: "Veggie Deluxe",
            description: "Bell peppers, mushrooms, onions, olives, and fresh tomatoes",
            price: 18.99,
            cost: 7.20,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["gluten", "dairy"],
            tags: ["vegetarian", "healthy"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 4,
            is_active: true,
            is_featured: false,
            preparation_time: 18,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `item-bbq-chicken-${Date.now() + 14}`,
            categoryId: `category-pizzas-${Date.now() + 10}`,
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
            display_order: 5,
            is_active: true,
            is_featured: true,
            preparation_time: 20,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: `category-salads-${Date.now() + 20}`,
        name: "Fresh Salads",
        description: "Crisp salads made with the freshest ingredients",
        display_order: 3,
        is_active: true,
        items: [
          {
            id: `item-caesar-salad-${Date.now() + 20}`,
            categoryId: `category-salads-${Date.now() + 20}`,
            name: "Caesar Salad",
            description: "Romaine lettuce, parmesan cheese, croutons, and Caesar dressing",
            price: 11.99,
            cost: 4.50,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["dairy", "gluten"],
            tags: ["vegetarian", "classic"],
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
            id: `item-italian-salad-${Date.now() + 21}`,
            categoryId: `category-salads-${Date.now() + 20}`,
            name: "Italian Garden Salad",
            description: "Mixed greens, tomatoes, olives, peppers, and Italian dressing",
            price: 10.99,
            cost: 4.20,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: [],
            tags: ["vegetarian", "healthy", "gluten-free"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 2,
            is_active: true,
            is_featured: false,
            preparation_time: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: `category-desserts-${Date.now() + 30}`,
        name: "Sweet Endings",
        description: "Delicious desserts to complete your meal",
        display_order: 4,
        is_active: true,
        items: [
          {
            id: `item-tiramisu-${Date.now() + 30}`,
            categoryId: `category-desserts-${Date.now() + 30}`,
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
          },
          {
            id: `item-gelato-${Date.now() + 31}`,
            categoryId: `category-desserts-${Date.now() + 30}`,
            name: "Gelato Trio",
            description: "Three scoops of artisanal gelato: vanilla, chocolate, and strawberry",
            price: 6.99,
            cost: 2.80,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: ["dairy"],
            tags: ["cold", "sweet"],
            availability: {
              is_available: true,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '11:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: ''
            },
            display_order: 2,
            is_active: true,
            is_featured: false,
            preparation_time: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: `category-beverages-${Date.now() + 40}`,
        name: "Beverages",
        description: "Refreshing drinks to complement your meal",
        display_order: 5,
        is_active: true,
        items: [
          {
            id: `item-italian-soda-${Date.now() + 40}`,
            categoryId: `category-beverages-${Date.now() + 40}`,
            name: "Italian Soda",
            description: "Sparkling water with your choice of flavor syrup",
            price: 3.99,
            cost: 1.20,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: [],
            tags: ["refreshing", "carbonated"],
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
            preparation_time: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `item-wine-selection-${Date.now() + 41}`,
            categoryId: `category-beverages-${Date.now() + 40}`,
            name: "House Wine",
            description: "Red or white wine selection from our Italian vineyard partners",
            price: 8.99,
            cost: 3.50,
            images: [],
            options: [],
            nutritional_info: {},
            allergens: [],
            tags: ["alcoholic", "italian"],
            availability: {
              is_available: false,
              available_days: [1, 2, 3, 4, 5, 6, 7],
              available_times: [{ start_time: '17:00', end_time: '23:00' }],
              stock_quantity: null,
              out_of_stock_message: 'Available after 5 PM'
            },
            display_order: 2,
            is_active: true,
            is_featured: false,
            preparation_time: 2,
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
    return true; // Data was added
  }
  
  return false; // Data already exists
};