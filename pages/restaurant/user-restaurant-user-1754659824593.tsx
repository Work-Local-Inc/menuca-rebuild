import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Clock, MapPin, Phone, Globe, Plus, Minus, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TempNavigation } from '@/components/TempNavigation';

// Load the admin restaurant data
const RESTAURANT_ID = 'user-restaurant-user-1754659824593';

// Admin restaurant data (loaded from setup script)
const restaurantData = {
  "id": "user-restaurant-user-1754659824593",
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
  const [selectedCategory, setSelectedCategory] = useState('appetizers');

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('checkout_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('checkout_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: any, variant: any) => {
    const cartItem: CartItem = {
      id: `${item.id}-${variant.id}`,
      name: `${item.name} (${variant.size})`,
      size: variant.size,
      price: variant.price / 100, // Convert from cents
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
    router.push('/checkout');
  };

  return (
    <>
      <Head>
        <title>{restaurantData.name} - MenuCA</title>
        <meta name="description" content={restaurantData.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <TempNavigation />
        
        {/* Restaurant Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {restaurantData.originalName}
                </h1>
                <p className="text-lg text-gray-600 mb-4">{restaurantData.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurantData.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{restaurantData.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Open 11:00 AM - 10:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="mt-6 md:mt-0 md:ml-8">
                <Card className="w-full md:w-80">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Cart ({getTotalItems()} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length > 0 ? (
                      <>
                        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                          {cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span className="flex-1">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-right">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>${getTotalPrice().toFixed(2)}</span>
                          </div>
                          <Button 
                            className="w-full mt-3" 
                            onClick={goToCheckout}
                            disabled={getTotalPrice() < restaurantData.minOrderAmount}
                          >
                            {getTotalPrice() < restaurantData.minOrderAmount
                              ? `Minimum $${restaurantData.minOrderAmount.toFixed(2)}`
                              : 'Checkout'
                            }
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Your cart is empty</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:flex lg:gap-8">
            {/* Category Navigation */}
            <div className="lg:w-64 mb-8 lg:mb-0">
              <Card>
                <CardHeader>
                  <CardTitle>Menu Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    {restaurantData.menu.categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-100 text-blue-900 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Menu Items */}
            <div className="flex-1">
              {restaurantData.menu.categories
                .filter(category => category.id === selectedCategory)
                .map((category) => (
                  <div key={category.id}>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {category.name}
                      </h2>
                      <p className="text-gray-600">{category.description}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {category.items.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                {item.preparationTime}min
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              {item.variants?.map((variant) => (
                                <div
                                  key={variant.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{variant.size}</span>
                                    <span className="text-lg font-semibold text-green-700">
                                      ${(variant.price / 100).toFixed(2)}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item, variant)}
                                    className="flex items-center gap-1"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="fixed bottom-4 right-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Star className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Demo Restaurant - Full testing experience
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}