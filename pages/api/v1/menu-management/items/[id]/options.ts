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
    case 'PUT':
      // Update menu item customization options
      const options = req.body;

      // Validate the options structure
      if (!options || typeof options !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Valid options object is required'
        });
      }

      // In a real app, this would update the database with the customization options
      // For demo purposes, we'll validate the structure and return success
      const validatedOptions = {
        sizes: options.sizes || [],
        crusts: options.crusts || [],
        sauces: options.sauces || [],
        toppings: options.toppings || [],
        customizations: options.customizations || [],
        allows_half_and_half: options.allows_half_and_half || false,
        max_toppings: options.max_toppings || null,
        free_toppings_count: options.free_toppings_count || 0,
        base_price_by_size: options.base_price_by_size || {},
        topping_pricing: options.topping_pricing || {
          regular: 1.50,
          premium: 3.00,
          extra_cheese: 2.00
        }
      };

      return res.status(200).json({
        success: true,
        data: {
          id: id,
          options: validatedOptions,
          updated_at: new Date().toISOString()
        },
        message: 'Menu item customization options updated successfully'
      });

    case 'GET':
      // Get menu item customization options
      return res.status(200).json({
        success: true,
        data: {
          id: id,
          options: null // In real app, fetch from database
        }
      });

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}