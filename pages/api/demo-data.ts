import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mock restaurant data for MVP demo
  const mockData = {
    restaurant: {
      id: 'rest_001',
      name: 'Demo Restaurant',
      status: 'active',
      address: '123 Main St, Demo City',
      phone: '(555) 123-4567'
    },
    analytics: {
      totalOrders: 1247,
      totalRevenue: 45678.90,
      monthlyGrowth: 12.5,
      averageOrderValue: 36.65
    },
    recentOrders: [
      {
        id: 'ord_001',
        customerName: 'John Doe',
        items: ['Burger Deluxe', 'Fries', 'Coke'],
        total: 24.99,
        status: 'delivered',
        orderTime: '2025-01-30T18:30:00Z'
      },
      {
        id: 'ord_002', 
        customerName: 'Jane Smith',
        items: ['Caesar Salad', 'Garlic Bread'],
        total: 18.50,
        status: 'preparing',
        orderTime: '2025-01-30T18:45:00Z'
      },
      {
        id: 'ord_003',
        customerName: 'Mike Johnson', 
        items: ['Pizza Margherita', 'Wings'],
        total: 32.75,
        status: 'confirmed',
        orderTime: '2025-01-30T19:00:00Z'
      }
    ],
    menuCategories: [
      {
        id: 'cat_001',
        name: 'Burgers',
        itemCount: 8,
        isActive: true
      },
      {
        id: 'cat_002',
        name: 'Salads',
        itemCount: 5,
        isActive: true
      },
      {
        id: 'cat_003',
        name: 'Beverages',
        itemCount: 12,
        isActive: true
      }
    ]
  };

  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      data: mockData
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 