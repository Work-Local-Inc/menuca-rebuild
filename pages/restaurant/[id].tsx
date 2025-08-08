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
      
      // Special handling for admin restaurant
      if (restaurantId === 'user-restaurant-user-adminmenucalocal-YWRtaW5A') {
        // Use the embedded data for admin testing
        const adminMenuData = {
          restaurant: {
            id: 'user-restaurant-user-adminmenucalocal-YWRtaW5A',
            name: 'admin@menuca.local\'s Restaurant (Demo)',
            description: 'Test restaurant featuring Xtreme Pizza menu for platform demonstration',
            address: {
              street: '123 Test Street',
              city: 'Ottawa',
              state: 'ON',
              postal_code: 'K1A 0A6'
            },
            contact: {
              phone: '+1-613-555-0123',
              website: 'https://menuca-rebuild.vercel.app'
            },
            cuisine_type: ['Pizza', 'Canadian']
          },
          menus: [{
            id: 'main-menu',
            name: 'Main Menu',
            categories: [
              {
                id: 'appetizers',
                name: 'Appetizers',
                description: 'Start your meal with our delicious appetizers',
                items: [
                  {
                    id: 'fries',
                    name: 'Fries',
                    description: 'Crispy golden fries',
                    price: 699,
                    variants: [
                      { id: 'friessmall', size: 'Small', price: 699, available: true },
                      { id: 'frieslarge', size: 'Large', price: 899, available: true }
                    ],
                    tags: [],
                    dietary: [],
                    preparationTime: 10
                  },
                  {
                    id: 'onion-rings',
                    name: 'Onion Rings',
                    description: 'Crispy battered onion rings',
                    price: 799,
                    variants: [
                      { id: 'onion-ringssmall', size: 'Small', price: 799, available: true },
                      { id: 'onion-ringslarge', size: 'Large', price: 999, available: true }
                    ],
                    tags: [],
                    dietary: [],
                    preparationTime: 10
                  }
                ]
              },
              {
                id: 'poutine',
                name: 'Poutine',
                description: 'Authentic Canadian poutine varieties',
                items: [
                  {
                    id: 'poutine',
                    name: 'Classic Poutine',
                    description: 'Cheese curds and gravy on crispy fries',
                    price: 899,
                    variants: [
                      { id: 'poutinesmall', size: 'Small', price: 899, available: true },
                      { id: 'poutinelarge', size: 'Large', price: 1199, available: true }
                    ],
                    tags: ['poutine'],
                    dietary: [],
                    preparationTime: 10
                  },
                  {
                    id: 'italian-poutine',
                    name: 'Italian Poutine',
                    description: 'Mozzarella cheese and meat sauce',
                    price: 999,
                    variants: [
                      { id: 'italian-poutinesmall', size: 'Small', price: 999, available: true },
                      { id: 'italian-poutinelarge', size: 'Large', price: 1299, available: true }
                    ],
                    tags: ['poutine'],
                    dietary: [],
                    preparationTime: 12
                  }
                ]
              },
              {
                id: 'pizza',
                name: 'Pizza',
                description: 'Freshly made pizzas with premium toppings',
                items: [
                  {
                    id: 'plain-pizza',
                    name: 'Plain Pizza',
                    description: 'Classic cheese pizza',
                    price: 1399,
                    variants: [
                      { id: 'plain-pizzasmall', size: 'Small', price: 1399, available: true },
                      { id: 'plain-pizzamedium', size: 'Medium', price: 1999, available: true },
                      { id: 'plain-pizzalarge', size: 'Large', price: 2599, available: true },
                      { id: 'plain-pizzaxlarge', size: 'X-Large', price: 3199, available: true }
                    ],
                    tags: ['pizza'],
                    dietary: [],
                    preparationTime: 20
                  },
                  {
                    id: 'hawaiian',
                    name: 'Hawaiian Pizza',
                    description: 'Ham and pineapple',
                    price: 1599,
                    variants: [
                      { id: 'hawaiiansmall', size: 'Small', price: 1599, available: true },
                      { id: 'hawaiianmedium', size: 'Medium', price: 2299, available: true },
                      { id: 'hawaiianlarge', size: 'Large', price: 2999, available: true },
                      { id: 'hawaiianxlarge', size: 'X-Large', price: 3699, available: true }
                    ],
                    tags: ['pizza'],
                    dietary: [],
                    preparationTime: 22
                  },
                  {
                    id: 'meat-lovers',
                    name: 'Meat Lovers',
                    description: 'Pepperoni, ham, sausage, bacon strips',
                    price: 1799,
                    variants: [
                      { id: 'meat-loverssmall', size: 'Small', price: 1799, available: true },
                      { id: 'meat-loversmedium', size: 'Medium', price: 2599, available: true },
                      { id: 'meat-loverslarge', size: 'Large', price: 3399, available: true },
                      { id: 'meat-loversxlarge', size: 'X-Large', price: 4199, available: true }
                    ],
                    tags: ['pizza'],
                    dietary: [],
                    preparationTime: 25
                  }
                ]
              }
            ]
          }]
        };
        
        setMenuData(adminMenuData);
        return;
      }
      
      // For other restaurants, try to fetch from API
      const response = await fetch(`/api/restaurants/${restaurantId}/menu`);
      
      if (!response.ok) {
        throw new Error(`Restaurant not found or menu unavailable`);
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
                          onClick={() => {
                            // Add first variant to cart and redirect to checkout
                            if (item.variants.length > 0) {
                              const variant = item.variants[0];
                              const cartItem = {
                                menuItem: {
                                  id: item.id,
                                  name: item.name,
                                  price: variant.price / 100
                                },
                                variant: {
                                  id: variant.id,
                                  size: variant.size,
                                  price: variant.price / 100
                                },
                                quantity: 1,
                                finalPrice: variant.price / 100
                              };
                              
                              // Store in checkout format for compatibility
                              const existingCart = JSON.parse(localStorage.getItem('checkout_cart') || '[]');
                              existingCart.push(cartItem);
                              localStorage.setItem('checkout_cart', JSON.stringify(existingCart));
                              
                              // Redirect to checkout
                              router.push('/checkout');
                            }
                          }}
                          className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                          Order Now
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
          <button 
            onClick={() => router.push('/checkout')}
            className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Start Your Order
          </button>
        </div>
      </div>
    </div>
  );
}