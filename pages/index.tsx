import React, { useState, useEffect } from 'react';
import Head from 'next/head';

// Simple components for MVP
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary" }: { 
  children: React.ReactNode, 
  onClick?: () => void,
  variant?: "primary" | "secondary" 
}) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium ${
      variant === "primary" 
        ? "bg-blue-600 text-white hover:bg-blue-700" 
        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
    }`}
  >
    {children}
  </button>
);

const Badge = ({ children, color = "blue" }: { children: React.ReactNode, color?: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
    {children}
  </span>
);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch demo data
    fetch('/api/demo-data')
      .then(res => res.json())
      .then(result => {
        setData(result.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load demo data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MenuCA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>MenuCA - Restaurant Management Platform</title>
        <meta name="description" content="Multi-tenant SaaS platform for restaurant management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">MenuCA</h1>
                <span className="ml-2 text-sm text-gray-500">Restaurant Management</span>
              </div>
              <div className="flex items-center space-x-4">
                <Badge color="green">Live Demo</Badge>
                <Badge color="blue">MVP</Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Restaurant Info */}
          <div className="mb-8">
            <Card>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {data?.restaurant?.name}
                  </h2>
                  <p className="text-gray-600">{data?.restaurant?.address}</p>
                  <p className="text-gray-600">{data?.restaurant?.phone}</p>
                </div>
                <Badge color="green">Active</Badge>
              </div>
            </Card>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{data?.analytics?.totalOrders}</p>
                <p className="text-gray-600">Total Orders</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${data?.analytics?.totalRevenue?.toLocaleString()}
                </p>
                <p className="text-gray-600">Total Revenue</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  +{data?.analytics?.monthlyGrowth}%
                </p>
                <p className="text-gray-600">Monthly Growth</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  ${data?.analytics?.averageOrderValue}
                </p>
                <p className="text-gray-600">Avg Order Value</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <Button variant="secondary">View All</Button>
              </div>
              <div className="space-y-4">
                {data?.recentOrders?.map((order: any) => (
                  <div key={order.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {order.items.join(', ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.orderTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total}</p>
                        <Badge 
                          color={
                            order.status === 'delivered' ? 'green' :
                            order.status === 'preparing' ? 'yellow' : 'blue'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Menu Management */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Menu Categories</h3>
                <Button>Add Category</Button>
              </div>
              <div className="space-y-3">
                {data?.menuCategories?.map((category: any) => (
                  <div key={category.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-gray-600">{category.itemCount} items</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge color={category.isActive ? 'green' : 'gray'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="secondary">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 text-center">
            <div className="space-x-4">
              <Button>View Full Restaurant Management</Button>
              <Button variant="secondary">Order Management</Button>
              <Button variant="secondary">Customer Management</Button>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              This is a live MVP demo of the MenuCA platform. Full backend integration coming soon.
            </p>
          </div>
        </main>
      </div>
    </>
  );
} 