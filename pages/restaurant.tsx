import React, { useState, useEffect } from 'react';
import { MenuManagement } from '@/components/restaurant/MenuManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Restaurant {
  id: string;
  name: string;
}

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        
        // Mock restaurants for demo - in production this would fetch from API
        const mockRestaurants: Restaurant[] = [
          { id: 'restaurant-0', name: "Mario's Italian Kitchen" },
          { id: 'restaurant-1', name: 'Taco Loco' },
          { id: 'restaurant-2', name: 'Dragon Palace' },
          { id: 'restaurant-3', name: 'The Burger Joint' },
          { id: 'restaurant-4', name: 'Cafe Mediterranean' }
        ];
        
        setRestaurants(mockRestaurants);
        
        // Auto-select first restaurant
        if (mockRestaurants.length > 0) {
          setSelectedRestaurant(mockRestaurants[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Restaurant Selection */}
      <div className="p-6 bg-white border-b">
        <div className="max-w-sm">
          <label className="block text-sm font-medium mb-2">Select Restaurant:</label>
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

      {/* Menu Management Component */}
      {selectedRestaurant && (
        <MenuManagement restaurantId={selectedRestaurant} />
      )}
    </div>
  );
}