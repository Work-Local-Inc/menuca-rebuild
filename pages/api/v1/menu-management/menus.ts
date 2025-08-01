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

// In-memory storage for demo purposes
let menus: RestaurantMenu[] = [
  {
    id: 'menu-demo-1',
    restaurantId: 'restaurant-demo',
    tenantId: 'tenant-demo',
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

  // Get tenant ID from header
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Tenant ID is required'
    });
  }

  switch (method) {
    case 'GET':
      // Get all menus for a restaurant
      const { restaurantId } = req.query;
      
      if (!restaurantId) {
        return res.status(400).json({
          success: false,
          error: 'Restaurant ID is required'
        });
      }

      const restaurantMenus = menus.filter(menu => 
        menu.restaurantId === restaurantId && menu.tenantId === tenantId
      );

      return res.status(200).json({
        success: true,
        data: restaurantMenus
      });

    case 'POST':
      // Create a new menu
      const { restaurantId: newRestaurantId, name, description, is_active, display_order } = req.body;

      if (!newRestaurantId || !name) {
        return res.status(400).json({
          success: false,
          error: 'Restaurant ID and name are required'
        });
      }

      const newMenu: RestaurantMenu = {
        id: `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        restaurantId: newRestaurantId,
        tenantId: tenantId,
        name: name,
        description: description || '',
        categories: [],
        is_active: is_active !== false,
        display_order: display_order || menus.length + 1,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'demo-user' // In real app, get from JWT token
      };

      menus.push(newMenu);

      return res.status(201).json({
        success: true,
        data: newMenu,
        message: 'Menu created successfully'
      });

    case 'PUT':
      // Update an existing menu
      const { id } = req.query;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Menu ID is required'
        });
      }

      const menuIndex = menus.findIndex(menu => 
        menu.id === id && menu.tenantId === tenantId
      );

      if (menuIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Menu not found'
        });
      }

      menus[menuIndex] = {
        ...menus[menuIndex],
        ...updateData,
        updated_at: new Date()
      };

      return res.status(200).json({
        success: true,
        data: menus[menuIndex],
        message: 'Menu updated successfully'
      });

    case 'DELETE':
      // Delete a menu
      const { id: deleteId } = req.query;

      if (!deleteId) {
        return res.status(400).json({
          success: false,
          error: 'Menu ID is required'
        });
      }

      const deleteIndex = menus.findIndex(menu => 
        menu.id === deleteId && menu.tenantId === tenantId
      );

      if (deleteIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Menu not found'
        });
      }

      menus.splice(deleteIndex, 1);

      return res.status(200).json({
        success: true,
        message: 'Menu deleted successfully'
      });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}