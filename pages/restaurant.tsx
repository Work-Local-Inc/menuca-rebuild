import React, { useState, useEffect } from 'react';
import { MenuManagement } from '@/components/restaurant/MenuManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { seedPizzaRestaurantData } from '@/utils/seedData';
import { TempNavigation } from '@/components/TempNavigation';

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
        
        // Get current user info 
        const userData = localStorage.getItem('menuca_user');
        if (!userData) {
          console.error('No user data found - redirecting to login');
          window.location.href = '/login';
          return;
        }

        const user = JSON.parse(userData);
        console.log('Current user:', user);

        // For now, create a single restaurant per user (proper onboarding needed)
        // This prevents the security flaw of accessing other restaurants
        const userRestaurant = {
          id: `user-restaurant-${user.id}`,
          name: `${user.email}'s Restaurant`
        };
        
        setRestaurants([userRestaurant]);
        
        // Auto-select the user's restaurant
        setSelectedRestaurant(userRestaurant.id);
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
    <div className="p-6 space-y-6">
      <TempNavigation />
      {/* Restaurant Selection */}
      <div className="p-6 bg-white border-b">
        <div className="flex justify-between items-center">
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
          
          {selectedRestaurant && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  if (confirm('This will delete all existing menu data for this restaurant. Continue?')) {
                    localStorage.removeItem(`menus_${selectedRestaurant}`);
                    alert('Menu data cleared! Reload the page to see the change.');
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700"
                size="sm"
              >
                🗑️ Clear Data
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const wasAdded = seedPizzaRestaurantData(selectedRestaurant);
                  if (wasAdded) {
                    alert('Pizza demo data loaded! The page will refresh to show the new menu.');
                    // Force a hard refresh to ensure the MenuManagement component reloads
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } else {
                    alert('Demo data already exists for this restaurant. Clear data first if you want to reload.');
                  }
                }}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700"
              >
                🍕 Load Pizza Demo Data
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  window.open(`/menu/${selectedRestaurant}`, '_blank');
                }}
                className="flex items-center gap-2"
              >
                👁️ Preview Customer Menu
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Menu Management Component */}
      {selectedRestaurant && (
        <MenuManagement restaurantId={selectedRestaurant} />
      )}
    </div>
  );
}