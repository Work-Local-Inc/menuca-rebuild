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
    case 'PATCH':
      // Update menu item availability
      const { is_available } = req.body;

      if (typeof is_available !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'is_available must be a boolean'
        });
      }

      // In a real app, this would update the database
      // For demo purposes, we'll just return success
      return res.status(200).json({
        success: true,
        data: {
          id: id,
          is_available: is_available,
          updated_at: new Date().toISOString()
        },
        message: `Menu item availability updated to ${is_available ? 'available' : 'unavailable'}`
      });

    default:
      res.setHeader('Allow', ['PATCH']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}