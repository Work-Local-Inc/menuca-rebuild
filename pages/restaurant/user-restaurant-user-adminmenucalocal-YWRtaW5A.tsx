import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Clock, MapPin, Phone, Globe, Plus, Minus, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TempNavigation } from '@/components/TempNavigation';

// Use the real admin restaurant UUID from Supabase
const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

// Default restaurant info (will be replaced with live data)
const defaultRestaurantData = {
  "id": "user-restaurant-user-adminmenucalocal-YWRtaW5A",
  "name": "admin@menuca.local's Restaurant",
  "originalName": "Xtreme Pizza Ottawa",
  "description": "Test restaurant for demonstrating MenuCA platform capabilities",
  "cuisine": "Pizza",
  "location": "Ottawa, ON",
  "phone": "+1-613-555-0123",
  "address": "123 Test Street, Ottawa, ON K1A 0A6",
  "operatingHours": {
    "monday": { "open": "11:00", "close": "22:00", "isOpen": true },
    "tuesday": { "open": "11:00", "close": "22:00", "isOpen": true },
    "wednesday": { "open": "11:00", "close": "22:00", "isOpen": true },
    "thursday": { "open": "11:00", "close": "22:00", "isOpen": true },
    "friday": { "open": "11:00", "close": "23:00", "isOpen": true },
    "saturday": { "open": "11:00", "close": "23:00", "isOpen": true },
    "sunday": { "open": "12:00", "close": "22:00", "isOpen": true }
  },
  "deliveryRadius": 10,
  "minOrderAmount": 15.00,
  "deliveryFee": 2.99,
  "taxRate": 0.13,
  "menu": {
    "categories": [
      {
        "id": "appetizers",
        "name": "Appetizers",
        "description": "Fresh appetizers selection",
        "items": [
          {
            "id": "fries",
            "name": "Fries",
            "description": "",
            "variants": [
              { "id": "friessmall", "size": "Small", "price": 699 },
              { "id": "frieslarge", "size": "Large", "price": 899 }
            ],
            "basePrice": 699,
            "preparationTime": 10
          },
          {
            "id": "onion-rings",
            "name": "Onion Rings", 
            "description": "",
            "variants": [
              { "id": "onion-ringssmall", "size": "Small", "price": 799 },
              { "id": "onion-ringslarge", "size": "Large", "price": 999 }
            ],
            "basePrice": 799,
            "preparationTime": 10
          }
        ]
      },
      {
        "id": "poutine",
        "name": "Poutine",
        "description": "Fresh poutine selection",
        "items": [
          {
            "id": "poutine",
            "name": "Poutine",
            "description": "With cheese curds and gravy.",
            "variants": [
              { "id": "poutinesmall", "size": "Small", "price": 899 },
              { "id": "poutinelarge", "size": "Large", "price": 1199 }
            ],
            "basePrice": 899,
            "preparationTime": 10
          },
          {
            "id": "italian-poutine",
            "name": "Italian Poutine",
            "description": "With mozzarella cheese and meat sauce.",
            "variants": [
              { "id": "italian-poutinesmall", "size": "Small", "price": 999 },
              { "id": "italian-poutinelarge", "size": "Large", "price": 1299 }
            ],
            "basePrice": 999,
            "preparationTime": 10
          }
        ]
      },
      {
        "id": "pizza",
        "name": "Pizza",
        "description": "Fresh pizza selection",
        "items": [
          {
            "id": "plain-pizza",
            "name": "Plain Pizza",
            "description": "",
            "variants": [
              { "id": "plain-pizzasmall", "size": "Small", "price": 1399 },
              { "id": "plain-pizzamedium", "size": "Medium", "price": 1999 },
              { "id": "plain-pizzalarge", "size": "Large", "price": 2599 },
              { "id": "plain-pizzaxlarge", "size": "X-Large", "price": 3199 }
            ],
            "basePrice": 1399,
            "preparationTime": 20
          },
          {
            "id": "hawaiian",
            "name": "Hawaiian",
            "description": "Ham, pineapple.",
            "variants": [
              { "id": "hawaiiansmall", "size": "Small", "price": 1599 },
              { "id": "hawaiianmedium", "size": "Medium", "price": 2299 },
              { "id": "hawaiianlarge", "size": "Large", "price": 2999 },
              { "id": "hawaiianxlarge", "size": "X-large", "price": 3699 }
            ],
            "basePrice": 1599,
            "preparationTime": 15
          },
          {
            "id": "meat-lovers",
            "name": "Meat Lovers",
            "description": "Pepperoni, ham, sausage, bacon strips.",
            "variants": [
              { "id": "meat-loverssmall", "size": "Small", "price": 1799 },
              { "id": "meat-loversmedium", "size": "Medium", "price": 2599 },
              { "id": "meat-loverslarge", "size": "Large", "price": 3399 },
              { "id": "meat-loversxlarge", "size": "X-large", "price": 4199 }
            ],
            "basePrice": 1799,
            "preparationTime": 25
          }
        ]
      }
    ]
  }
};

interface CartItem {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  preparationTime: number;
}

export default function AdminRestaurantPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuData, setMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real menu data from Supabase
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching live menu data for restaurant:', RESTAURANT_ID);
        
        const response = await fetch(`/api/menu-management/restaurant/${RESTAURANT_ID}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 Raw API response:', result);
        
        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error('No menu data found');
        }
        
        const menu = result.data[0];
        console.log('✅ Live menu data loaded:', menu.categories.length, 'categories');
        
        // Set the menu data
        setMenuData(menu);
        
      } catch (error) {
        console.error('❌ Error fetching menu data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenuData();
  }, []);

  // Load cart from localStorage (unless this is a fresh start)
  useEffect(() => {
    const isFreshStart = router.query.fresh === 'true';
    
    if (isFreshStart) {
      // Clear everything for fresh start
      localStorage.removeItem('checkout_cart');
      sessionStorage.removeItem('checkout_cart');
      sessionStorage.removeItem('checkout_restaurant');
      sessionStorage.removeItem('delivery_instructions');
      setCart([]);
      console.log('🆕 Fresh order started - cart cleared');
    } else {
      // Load saved cart
      const savedCart = localStorage.getItem('checkout_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
          console.log('📦 Loaded existing cart:', savedCart);
        } catch (error) {
          console.error('Error loading cart:', error);
        }
      }
    }
  }, [router.query]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('checkout_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: any, variant: any) => {
    const cartItem: CartItem = {
      id: variant.id || `${item.id}-${variant.size.toLowerCase()}`,
      name: `${item.name} (${variant.size})`,
      size: variant.size,
      price: variant.price / 100, // Convert from cents to dollars
      quantity: 1,
      preparationTime: item.preparationTime || 15
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === cartItem.id);
      if (existingItem) {
        return prevCart.map(i => 
          i.id === cartItem.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        return [...prevCart, cartItem];
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    } else {
      setCart(prevCart => 
        prevCart.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const goToCheckout = () => {
    if (cart.length === 0) return;
    
    // Convert cart data to the format expected by checkout page
    const checkoutCart = cart.map(item => ({
      menuItem: {
        id: item.id,
        name: item.name,
        price: item.price, // Already in dollars
        description: `${item.name} (${item.size})`
      },
      quantity: item.quantity,
      finalPrice: item.price, // Already in dollars
    }));
    
    // Store cart and restaurant data for checkout page
    sessionStorage.setItem('checkout_cart', JSON.stringify(checkoutCart));
    sessionStorage.setItem('checkout_restaurant', JSON.stringify({
      id: RESTAURANT_ID,
      name: 'Xtreme Pizza Ottawa'
    }));
    
    console.log('Redirecting to checkout with cart:', checkoutCart);
    
    // Navigate to checkout
    router.push('/checkout');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading live menu data from Supabase...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !menuData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading menu: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Xtreme Pizza Ottawa - MenuCA</title>
        <meta name="description" content="Real Xtreme Pizza menu with live Supabase data" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <TempNavigation />
        
        {/* Restaurant Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Xtreme Pizza Ottawa
                </h1>
                <p className="text-lg text-gray-600 mb-4">Live menu data from Supabase - {menuData.categories.length} categories, {menuData.categories.reduce((sum: number, cat: any) => sum + cat.items.length, 0)} items</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Ottawa, ON</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>+1-613-xxx-xxxx</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Open 11:00 AM - 10:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Cart Summary - Professional Style */}
              <div className="mt-6 md:mt-0 md:ml-8">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full md:w-80">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                      Your Order ({getTotalItems()} items)
                    </h3>
                  </div>
                  <div className="p-4">
                    {cart.length > 0 ? (
                      <>
                        <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                          {cart.map((item) => (
                            <div key={item.id} className="border-b border-gray-100 pb-3 last:border-0">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900 flex-1 pr-2">{item.name}</span>
                                <span className="font-semibold text-green-700">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold text-gray-900">Total:</span>
                            <span className="text-xl font-bold text-green-700">${getTotalPrice().toFixed(2)}</span>
                          </div>
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold" 
                            onClick={goToCheckout}
                            disabled={getTotalPrice() < 15.00}
                          >
                            {getTotalPrice() < 15.00
                              ? `Minimum Order $15.00`
                              : 'Proceed to Checkout'
                            }
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Your cart is empty</p>
                        <p className="text-sm">Add items from the menu</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation - Sticky Jump Links */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex space-x-1 overflow-x-auto">
              {menuData.categories.map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => {
                    const element = document.getElementById(`category-${category.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
                >
                  {category.name} ({category.items.length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Content - All Categories Visible */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {menuData.categories.map((category: any) => (
            <div key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h2>
                <p className="text-gray-600">{category.description || `Fresh ${category.name.toLowerCase()} from our kitchen`}</p>
              </div>

              <div className="space-y-4">
                {category.items.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Real Size Options from Supabase Data */}
                    {item.options && Array.isArray(item.options) && item.options.length > 0 ? (
                      <div className="space-y-2">
                        {item.options.map((option: any, index: number) => (
                          <div key={`${item.id}-${option.size}-${index}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{option.size}</span>
                              <span className="text-lg font-bold text-green-700">
                                ${(option.price / 100).toFixed(2)}
                              </span>
                            </div>
                            <Button
                              onClick={() => addToCart(item, { id: `${item.id}-${option.size.toLowerCase()}`, size: option.size, price: option.price })}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Order
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-green-700">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={() => addToCart(item, { id: 'regular', size: 'Regular', price: Math.round(item.price * 100) })}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Order
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Professional Footer */}
        <div className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              <p className="flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-green-600" />
                Powered by MenuCA - Professional Restaurant Ordering Platform
              </p>
              <p className="mt-1">Real menu data • Live ordering system • Secure checkout</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}