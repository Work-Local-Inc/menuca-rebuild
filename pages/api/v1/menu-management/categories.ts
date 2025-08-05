import { NextApiRequest, NextApiResponse } from 'next';

interface MenuCategory {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  items: any[];
  created_at: Date;
  updated_at: Date;
}

// In-memory storage for demo purposes
let categories: MenuCategory[] = [];

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
      // Get all categories for a menu
      const { menuId } = req.query;
      
      if (!menuId) {
        return res.status(400).json({
          success: false,
          error: 'Menu ID is required'
        });
      }

      const menuCategories = categories.filter(category => 
        category.menuId === menuId
      );

      return res.status(200).json({
        success: true,
        data: menuCategories
      });

    case 'POST':
      // Create a new category
      const { menuId: newMenuId, name, description, display_order, is_active } = req.body;

      if (!newMenuId || !name) {
        return res.status(400).json({
          success: false,
          error: 'Menu ID and name are required'
        });
      }

      const newCategory: MenuCategory = {
        id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menuId: newMenuId,
        name: name,
        description: description || '',
        display_order: display_order || categories.length + 1,
        is_active: is_active !== false,
        items: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      categories.push(newCategory);

      return res.status(201).json({
        success: true,
        data: newCategory,
        message: 'Category created successfully'
      });

    case 'PUT':
      // Update an existing category
      const { id } = req.query;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
      }

      const categoryIndex = categories.findIndex(category => 
        category.id === id
      );

      if (categoryIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      categories[categoryIndex] = {
        ...categories[categoryIndex],
        ...updateData,
        updated_at: new Date()
      };

      return res.status(200).json({
        success: true,
        data: categories[categoryIndex],
        message: 'Category updated successfully'
      });

    case 'DELETE':
      // Delete a category
      const { id: deleteId } = req.query;

      if (!deleteId) {
        return res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
      }

      const deleteIndex = categories.findIndex(category => 
        category.id === deleteId
      );

      if (deleteIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      categories.splice(deleteIndex, 1);

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(200).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}