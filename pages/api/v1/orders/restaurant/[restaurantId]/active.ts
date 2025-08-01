import { NextApiRequest, NextApiResponse } from 'next';

interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: any[];
  total: number;
  created_at: string;
  updated_at: string;
}

// Demo data - in real app this would come from database
const getDemoActiveOrders = (restaurantId: string): Order[] => [
  {
    id: 'order-demo-1',
    restaurantId: restaurantId,
    customerId: 'customer-demo-1',
    status: 'pending',
    items: [
      {
        id: 'item-margherita',
        name: 'Margherita Pizza',
        quantity: 1,
        price: 18.99,
        customizations: {}
      }
    ],
    total: 18.99,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    updated_at: new Date().toISOString()
  },
  {
    id: 'order-demo-2',
    restaurantId: restaurantId,
    customerId: 'customer-demo-2',
    status: 'preparing',
    items: [
      {
        id: 'item-pepperoni',
        name: 'Pepperoni Pizza',
        quantity: 2,
        price: 21.99,
        customizations: {}
      }
    ],
    total: 43.98,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    updated_at: new Date().toISOString()
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { restaurantId } = req.query;

  // Get tenant ID from header
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Tenant ID is required'
    });
  }

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      error: 'Restaurant ID is required'
    });
  }

  switch (method) {
    case 'GET':
      // Get active orders for a restaurant
      const activeOrders = getDemoActiveOrders(restaurantId as string);

      return res.status(200).json({
        success: true,
        data: activeOrders,
        message: `Found ${activeOrders.length} active order(s) for restaurant ${restaurantId}`
      });

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}