import { NextApiRequest, NextApiResponse } from 'next';

interface RestaurantMenu {
  id: string;
  restaurantId: string;
  tenantId: string;
  name: string;
  description?: string;
  categories: any[];
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

// Demo data - in real app this would come from database
const getDemoMenus = (restaurantId: string): RestaurantMenu[] => [
  {
    id: 'menu-demo-1',
    restaurantId: restaurantId,
    tenantId: 'any-tenant', // Public endpoint doesn't care about tenant
    name: 'Main Menu',
    description: 'Our signature dishes and specialties',
    categories: [
      {
        id: 'category-pizza',
        name: 'Pizzas',
        description: 'Hand-crafted artisan pizzas',
        display_order: 1,
        is_active: true,
        items: [
          {
            id: 'item-margherita',
            categoryId: 'category-pizza',
            name: 'Margherita Pizza',
            description: 'Fresh mozzarella, tomato sauce, and basil',
            price: 18.99,
            cost: 7.50,
            images: [],
            options: {},
            nutritional_info: {},
            allergens: ['dairy', 'gluten'],
            tags: ['vegetarian', 'classic'],
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
            preparation_time: 20,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'item-pepperoni',
            categoryId: 'category-pizza',
            name: 'Pepperoni Pizza',
            description: 'Classic pepperoni with mozzarella cheese',
            price: 21.99,
            cost: 8.50,
            images: [],
            options: {},
            nutritional_info: {},
            allergens: ['dairy', 'gluten'],
            tags: ['classic', 'popular'],
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
            preparation_time: 20,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'category-appetizers',
        name: 'Appetizers',
        description: 'Start your meal right',
        display_order: 2,
        is_active: true,
        items: [
          {
            id: 'item-garlic-bread',
            categoryId: 'category-appetizers',
            name: 'Garlic Bread',
            description: 'Fresh baked bread with garlic butter',
            price: 8.99,
            cost: 2.50,
            images: [],
            options: {},
            nutritional_info: {},
            allergens: ['gluten', 'dairy'],
            tags: ['vegetarian', 'starter'],
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
            preparation_time: 10,
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
    created_by: 'demo-user'
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { restaurantId } = req.query;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      error: 'Restaurant ID is required'
    });
  }

  switch (method) {
    case 'GET':
      // Get public menu for a specific restaurant (no tenant auth required)
      const restaurantMenus = getDemoMenus(restaurantId as string);

      return res.status(200).json({
        success: true,
        data: restaurantMenus,
        message: `Found ${restaurantMenus.length} public menu(s) for restaurant ${restaurantId}`
      });

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}