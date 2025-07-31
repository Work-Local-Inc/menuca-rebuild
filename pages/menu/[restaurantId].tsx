import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Clock, DollarSign } from 'lucide-react';

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  images: any[];
  options: any[];
  nutritional_info?: any;
  allergens: string[];
  tags: string[];
  availability: {
    is_available: boolean;
    available_days: number[];
    available_times: Array<{ start_time: string; end_time: string; }>;
    stock_quantity?: number;
    out_of_stock_message?: string;
  };
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  preparation_time: number;
  created_at: string;
  updated_at: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  items: MenuItem[];
}

interface RestaurantMenu {
  id: string;
  restaurantId: string;
  tenantId: string;
  name: string;
  description?: string;
  categories: MenuCategory[];
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function CustomerMenuPage() {
  const router = useRouter();
  const { restaurantId } = router.query;
  
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<RestaurantMenu | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      loadMenus();
    }
  }, [restaurantId]);

  const loadMenus = () => {
    try {
      // Load menus from localStorage (same as restaurant management)
      const localMenus = JSON.parse(localStorage.getItem(`menus_${restaurantId}`) || '[]');
      console.log('Loading customer menus:', localMenus);
      
      setMenus(localMenus);
      if (localMenus.length > 0) {
        setSelectedMenu(localMenus[0]);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.menuItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { menuItem: item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === item.id);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.menuItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prevCart.filter(cartItem => cartItem.menuItem.id !== item.id);
      }
    });
  };

  const getItemQuantityInCart = (item: MenuItem): number => {
    const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
    return cartItem ? cartItem.quantity : 0;
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, cartItem) => {
      return total + (cartItem.menuItem.price * cartItem.quantity);
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedMenu) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">No menu available for this restaurant.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedMenu.name}</h1>
              <p className="text-gray-600">{selectedMenu.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  // TODO: Implement checkout flow
                  alert(`Cart total: ${formatCurrency(getCartTotal())}\nItems: ${cart.length}\n\nCheckout coming soon!`);
                }}
                disabled={cart.length === 0}
              >
                <ShoppingCart className="h-4 w-4" />
                Cart ({cart.length}) - {formatCurrency(getCartTotal())}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Menu Categories */}
        <div className="space-y-8">
          {selectedMenu.categories.map((category) => (
            <div key={category.id}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                {category.description && (
                  <p className="text-gray-600 mt-1">{category.description}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.items
                  .filter(item => item.is_active && item.availability.is_available)
                  .map((item) => {
                    const quantityInCart = getItemQuantityInCart(item);
                    
                    return (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                {item.is_featured && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(item.price)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.preparation_time} min
                                </span>
                              </div>

                              {item.allergens.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-orange-600">
                                    ⚠️ Contains: {item.allergens.join(', ')}
                                  </p>
                                </div>
                              )}

                              {item.tags.length > 0 && (
                                <div className="flex gap-1 mb-3">
                                  {item.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Add to Cart Controls */}
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-900">
                              {formatCurrency(item.price)}
                            </span>
                            
                            {quantityInCart === 0 ? (
                              <Button
                                onClick={() => addToCart(item)}
                                className="flex items-center gap-2"
                                size="sm"
                              >
                                <Plus className="h-4 w-4" />
                                Add to Cart
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFromCart(item)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="mx-2 font-medium">{quantityInCart}</span>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {category.items.filter(item => item.is_active && item.availability.is_available).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items available in this category</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedMenu.categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No menu categories available</p>
          </div>
        )}
      </div>
    </div>
  );
}