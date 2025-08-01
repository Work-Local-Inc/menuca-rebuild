import { NextApiRequest, NextApiResponse } from 'next';

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  images: any[];
  options: any;
  nutritional_info?: any;
  allergens: string[];
  tags: string[];
  availability: {
    is_available: boolean;
    available_days: number[];
    available_times: Array<{ start_time: string; end_time: string; }>;
    stock_quantity?: number;
    out_of_stock_message?: string;
  };
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  preparation_time: number;
  type?: string;
  created_at: string;
  updated_at: string;
}

// In-memory storage for demo purposes
let menuItems: MenuItem[] = [];

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
      // Get all menu items for a category
      const { categoryId } = req.query;
      
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
      }

      const categoryItems = menuItems.filter(item => 
        item.categoryId === categoryId
      );

      return res.status(200).json({
        success: true,
        data: categoryItems
      });

    case 'POST':
      // Create a new menu item
      const itemData = req.body;

      if (!itemData.categoryId || !itemData.name) {
        return res.status(400).json({
          success: false,
          error: 'Category ID and name are required'
        });
      }

      const newItem: MenuItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        categoryId: itemData.categoryId,
        name: itemData.name,
        description: itemData.description || '',
        price: itemData.price || 0,
        cost: itemData.cost || 0,
        images: itemData.images || [],
        options: itemData.options || {},
        nutritional_info: itemData.nutritional_info || {},
        allergens: itemData.allergens || [],
        tags: itemData.tags || [],
        availability: itemData.availability || {
          is_available: true,
          available_days: [1, 2, 3, 4, 5, 6, 7],
          available_times: [{ start_time: '09:00', end_time: '22:00' }],
          stock_quantity: null,
          out_of_stock_message: ''
        },
        display_order: itemData.display_order || menuItems.length + 1,
        is_active: itemData.is_active !== false,
        is_featured: itemData.is_featured || false,
        preparation_time: itemData.preparation_time || 15,
        type: itemData.type || 'simple',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      menuItems.push(newItem);

      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Menu item created successfully'
      });

    case 'PUT':
      // Update an existing menu item
      const { id } = req.query;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Menu item ID is required'
        });
      }

      const itemIndex = menuItems.findIndex(item => 
        item.id === id
      );

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }

      menuItems[itemIndex] = {
        ...menuItems[itemIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        data: menuItems[itemIndex],
        message: 'Menu item updated successfully'
      });

    case 'DELETE':
      // Delete a menu item
      const { id: deleteId } = req.query;

      if (!deleteId) {
        return res.status(400).json({
          success: false,
          error: 'Menu item ID is required'
        });
      }

      const deleteIndex = menuItems.findIndex(item => 
        item.id === deleteId
      );

      if (deleteIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }

      menuItems.splice(deleteIndex, 1);

      return res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully'
      });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}