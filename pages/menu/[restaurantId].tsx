import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Clock, DollarSign } from 'lucide-react';
import { TempNavigation } from '@/components/TempNavigation';
import { MenuItemCustomization } from '@/components/customer/MenuItemCustomization';
import { MenuCard } from '@/components/food/MenuCard';

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
  customization?: any;
  finalPrice?: number;
}

export default function CustomerMenuPage() {
  const router = useRouter();
  const { restaurantId } = router.query;
  
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<RestaurantMenu | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (restaurantId) {
      loadMenus();
    }
  }, [restaurantId]);

  const loadMenus = async () => {
    try {
      console.log('Loading customer menus for restaurant:', restaurantId);
      
      // Fetch menus from public API (no authentication required)
      const response = await fetch(`/api/public/menu/${restaurantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);
        
        if (data.success && data.data) {
          setMenus(data.data);
          if (data.data.length > 0) {
            setSelectedMenu(data.data[0]);
          }
        } else {
          console.error('API returned no menu data:', data);
        }
      } else {
        console.error('Failed to fetch menus:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    // For simple items without customization options
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => 
        cartItem.menuItem.id === item.id && !cartItem.customization
      );
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.menuItem.id === item.id && !cartItem.customization
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { menuItem: item, quantity: 1 }];
      }
    });
  };

  const addCustomizedToCart = (item: MenuItem, customization: any, finalPrice: number) => {
    // For customized items, always add as new item (each customization is unique)
    setCart(prevCart => [
      ...prevCart, 
      { 
        menuItem: item, 
        quantity: 1, 
        customization, 
        finalPrice 
      }
    ]);
    setCustomizingItem(null);
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
      const itemPrice = cartItem.finalPrice || cartItem.menuItem.price;
      return total + (itemPrice * cartItem.quantity);
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const hasCustomizationOptions = (item: MenuItem): boolean => {
    return item.options && (
      (item.options.sizes && item.options.sizes.length > 0) ||
      (item.options.crusts && item.options.crusts.length > 0) ||
      (item.options.sauces && item.options.sauces.length > 0) ||
      (item.options.toppings && item.options.toppings.length > 0)
    );
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
                  if (cart.length === 0) return;
                  
                  // Store cart data in sessionStorage for checkout page
                  sessionStorage.setItem('checkout_cart', JSON.stringify(cart));
                  sessionStorage.setItem('checkout_restaurant', restaurantId as string);
                  
                  // Redirect to checkout
                  window.location.href = `/checkout?restaurantId=${restaurantId}`;
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
        <TempNavigation />
        
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

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {category.items
                  .filter(item => item.is_active && item.availability.is_available)
                  .map((item) => {
                    const quantityInCart = getItemQuantityInCart(item);
                    
                    return (
                      <MenuCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        description={item.description || ''}
                        price={item.price}
                        originalPrice={item.price * 1.2} // Show slight discount effect
                        image={item.images?.[0] || '/placeholder-food.jpg'}
                        category={category.name}
                        dietaryInfo={{
                          isVegetarian: item.tags.includes('vegetarian'),
                          isVegan: item.tags.includes('vegan'),
                          isGlutenFree: item.tags.includes('gluten-free'),
                          isSpicy: item.tags.includes('spicy'),
                          allergens: item.allergens
                        }}
                        preparationTime={item.preparation_time}
                        rating={4.5}
                        reviewCount={Math.floor(Math.random() * 100) + 20}
                        isPopular={item.is_featured}
                        isAvailable={item.availability.is_available}
                        badges={item.is_featured ? ['Featured'] : []}
                        hasCustomizations={hasCustomizationOptions(item)}
                        onAddToCart={() => {
                          if (hasCustomizationOptions(item)) {
                            setCustomizingItem(item);
                          } else {
                            addToCart(item);
                          }
                        }}
                        onCustomize={() => setCustomizingItem(item)}
                        className="transform hover:scale-[1.02] transition-all duration-200"
                      />
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

      {/* Customization Modal */}
      {customizingItem && (
        <MenuItemCustomization
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={addCustomizedToCart}
        />
      )}
    </div>
  );
}