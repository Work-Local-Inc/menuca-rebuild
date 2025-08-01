import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  // Get tenant ID from header
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Tenant ID is required'
    });
  }

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Menu item ID is required'
    });
  }

  switch (method) {
    case 'GET':
      // Get a specific menu item
      return res.status(200).json({
        success: true,
        data: {
          id: id,
          // In real app, fetch full item data from database
          message: 'Item retrieved successfully'
        }
      });

    case 'PUT':
      // Update a specific menu item
      const updateData = req.body;

      return res.status(200).json({
        success: true,
        data: {
          id: id,
          ...updateData,
          updated_at: new Date().toISOString()
        },
        message: 'Menu item updated successfully'
      });

    case 'DELETE':
      // Delete a specific menu item
      return res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully'
      });

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}