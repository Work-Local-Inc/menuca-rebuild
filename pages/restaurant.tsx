import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { MenuManagement } from '@/components/restaurant/MenuManagement';
import { OrderManagement } from '@/components/restaurant/OrderManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { seedPizzaRestaurantData } from '@/utils/seedData';
import { TempNavigation } from '@/components/TempNavigation';
import { Package, ChefHat, BarChart } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
}

type TabType = 'orders' | 'menu' | 'analytics';

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchRestaurants = async () => {
      try {
        if (!user) {
          console.error('No user data found - redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Current user:', user);

        // For admin user, use the pre-seeded restaurant with Xtreme Pizza data
        // For other users, create a single restaurant per user (proper onboarding needed)
        const userRestaurant = user.id === '11111111-1111-1111-1111-111111111111' ? {
          id: '11111111-1111-1111-1111-111111111111', // Fixed UUID for admin restaurant
          name: 'Xtreme Pizza Ottawa (Admin Demo)'
        } : {
          id: `user-restaurant-${user.id}`,
          name: `${user.email}'s Restaurant`
        };
        
        // Admin user will automatically see the pre-seeded Xtreme Pizza data
        if (user.id === '11111111-1111-1111-1111-111111111111') {
          console.log('✅ Admin user detected - restaurant connected to live Xtreme Pizza data');
        }
        
        setRestaurants([userRestaurant]);
        
        // Auto-select the user's restaurant
        setSelectedRestaurant(userRestaurant.id);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && user) {
      fetchRestaurants();
    }
  }, [user, isAuthenticated, authLoading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">No restaurants found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    {
      id: 'orders' as TabType,
      label: 'Orders',
      icon: Package,
      description: 'Manage incoming orders and track delivery status'
    },
    {
      id: 'menu' as TabType,
      label: 'Menu Management',
      icon: ChefHat,
      description: 'Update menu items, categories, and pricing'
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: BarChart,
      description: 'View sales data and performance metrics'
    }
  ];

  const renderTabContent = () => {
    if (!selectedRestaurant) return null;

    switch (activeTab) {
      case 'orders':
        return <OrderManagement restaurantId={selectedRestaurant} />;
      case 'menu':
        return <MenuManagement restaurantId={selectedRestaurant} />;
      case 'analytics':
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <BarChart className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Analytics dashboard coming soon!</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TempNavigation />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Dashboard</h1>
              <p className="text-gray-600">Manage your restaurant operations</p>
            </div>
            
            {/* Restaurant Selection */}
            <div className="flex items-center gap-4">
              <div className="max-w-sm">
                <label className="block text-sm font-medium mb-2">Restaurant:</label>
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedRestaurant && (
        <>
          {/* Tab Navigation */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                      {tab.id === 'orders' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">New</Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>


          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {renderTabContent()}
          </div>
        </>
      )}
    </div>
  );
}