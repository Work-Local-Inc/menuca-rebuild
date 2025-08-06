/**
 * Restaurant page showing real menu data from backend
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SimpleMenuCard } from '@/components/food/SimpleMenuCard';
import { CompactMenuCard } from '@/components/food/CompactMenuCard';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  variants: Array<{
    id: string;
    size: string;
    price: number;
    available: boolean;
  }>;
  tags: string[];
  dietary: string[];
  preparationTime: number;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
  };
  contact: {
    phone: string;
    website: string;
  };
  cuisine_type: string[];
}

interface MenuData {
  restaurant: Restaurant;
  menus: Array<{
    id: string;
    name: string;
    categories: MenuCategory[];
  }>;
}

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');

  useEffect(() => {
    if (id) {
      fetchMenuData(id as string);
    }
  }, [id]);

  const fetchMenuData = async (restaurantId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/restaurants/${restaurantId}/menu`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch menu: ${response.status}`);
      }
      
      const data = await response.json();
      setMenuData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delicious menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.reload()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-600">No menu data found</p>
        </div>
      </div>
    );
  }

  const { restaurant, menus } = menuData;
  const totalItems = menus.reduce((acc, menu) => 
    acc + menu.categories.reduce((catAcc, cat) => catAcc + cat.items.length, 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              <p className="text-gray-600 mt-1">{restaurant.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>📍 {restaurant.address.city}, {restaurant.address.state}</span>
                <span>📞 {restaurant.contact.phone}</span>
                <span>🍕 {restaurant.cuisine_type.join(', ')}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                <div>{menus.length} menu{menus.length > 1 ? 's' : ''}</div>
                <div>{menus.reduce((acc, menu) => acc + menu.categories.length, 0)} categories</div>
                <div className="font-semibold text-orange-600">{totalItems} items</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('full')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'full'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Full View
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'compact'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Compact View
            </button>
          </div>
        </div>

        {/* Menu Categories */}
        {menus.map((menu) => (
          <div key={menu.id} className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{menu.name}</h3>
            
            {menu.categories.map((category) => (
              <div key={category.id} className="mb-8">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{category.name}</h4>
                  {category.description && (
                    <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                  )}
                </div>

                {/* Clean, simple menu items */}
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-gray-900">{item.name}</h5>
                            {item.dietary.includes('vegetarian') && (
                              <span className="text-green-600 text-sm">🌱</span>
                            )}
                            {item.tags.includes('spicy') && (
                              <span className="text-red-500 text-sm">🌶️</span>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                          )}
                          
                          {/* Show size/price options */}
                          <div className="flex flex-wrap gap-2">
                            {item.variants.map((variant, index) => (
                              <span 
                                key={variant.id} 
                                className="inline-flex items-center gap-1 text-sm"
                              >
                                <span className="text-gray-600">{variant.size}:</span>
                                <span className="font-semibold text-gray-900">
                                  ${(variant.price / 100).toFixed(2)}
                                </span>
                                {index < item.variants.length - 1 && (
                                  <span className="text-gray-400 ml-1">•</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => console.log('Add to cart:', item.name)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="bg-orange-500 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to Order? 🛒</h3>
          <p className="text-orange-100 mb-4">
            {totalItems} delicious items waiting for you!
          </p>
          <button className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
            Start Your Order
          </button>
        </div>
      </div>
    </div>
  );
}