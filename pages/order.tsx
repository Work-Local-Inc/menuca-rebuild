import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Clock, Star } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  menuCount?: number;
  itemCount?: number;
}

export default function OrderPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableRestaurants();
  }, []);

  const loadAvailableRestaurants = () => {
    try {
      // Look for restaurants that have menus in localStorage
      const availableRestaurants: Restaurant[] = [];
      
      // Check localStorage for any menu data (this is a simple implementation)
      // In a real app, this would be an API call to get public restaurant listings
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('menus_user-restaurant-')) {
          const restaurantId = key.replace('menus_', '');
          const menus = JSON.parse(localStorage.getItem(key) || '[]');
          
          if (menus.length > 0) {
            const totalItems = menus.reduce((total: number, menu: any) => {
              return total + menu.categories.reduce((catTotal: number, category: any) => {
                return catTotal + category.items.length;
              }, 0);
            }, 0);

            // Extract email from restaurant ID for display name
            const userId = restaurantId.replace('user-restaurant-', '');
            const mockEmail = `user${userId}@demo.com`; // This would come from user data in real app
            
            availableRestaurants.push({
              id: restaurantId,
              name: `${mockEmail}'s Restaurant`,
              menuCount: menus.length,
              itemCount: totalItems
            });
          }
        }
      }

      setRestaurants(availableRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🍽️ MenuCA - Order Online
            </h1>
            <p className="text-xl text-gray-600">
              Discover and order from local restaurants
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {restaurants.length > 0 ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Available Restaurants ({restaurants.length})
              </h2>
              <p className="text-gray-600">
                Choose a restaurant to view their menu and place an order
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{restaurant.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ChefHat className="h-3 w-3" />
                            {restaurant.menuCount} menus
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            🍽️ {restaurant.itemCount} items
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                        <p className="text-xs text-gray-500">Demo rating</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>15-30 min delivery</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">Fast Delivery</Badge>
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      </div>
                      
                      <Button 
                        className="w-full mt-4"
                        onClick={() => {
                          window.location.href = `/menu/${restaurant.id}`;
                        }}
                      >
                        View Menu & Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Restaurants Available</h3>
              <p className="text-gray-600 mb-6">
                There are currently no restaurants with menus available for ordering. 
                Restaurant owners can create menus using the management dashboard.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  window.location.href = '/restaurant';
                }}
              >
                Go to Restaurant Management
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}