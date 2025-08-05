import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  options?: any;
  allergens: string[];
  tags: string[];
}

interface CustomizationSelection {
  size?: any;
  crust?: any;
  sauce?: any;
  toppings: any[];
  half_and_half?: {
    enabled: boolean;
    left_toppings: any[];
    right_toppings: any[];
  };
}

interface MenuItemCustomizationProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, customization: CustomizationSelection, finalPrice: number) => void;
}

export const MenuItemCustomization: React.FC<MenuItemCustomizationProps> = ({
  item,
  onClose,
  onAddToCart
}) => {
  const [selection, setSelection] = useState<CustomizationSelection>({
    toppings: [],
    half_and_half: {
      enabled: false,
      left_toppings: [],
      right_toppings: []
    }
  });

  // Get options from item, with fallbacks for demo
  const options = item.options || {
    sizes: [
      { id: 'small', name: 'Small', diameter: '10"', price_modifier: 1.0 },
      { id: 'medium', name: 'Medium', diameter: '12"', price_modifier: 1.3 },
      { id: 'large', name: 'Large', diameter: '14"', price_modifier: 1.6 },
      { id: 'xlarge', name: 'X-Large', diameter: '16"', price_modifier: 2.0 }
    ],
    crusts: [
      { id: 'classic', name: 'Classic Hand-Tossed', price_modifier: 0 },
      { id: 'thin', name: 'Thin & Crispy', price_modifier: 0 },
      { id: 'thick', name: 'Thick Pan', price_modifier: 1.5 },
      { id: 'gluten_free', name: 'Gluten-Free', price_modifier: 3.0 }
    ],
    sauces: [
      { id: 'tomato', name: 'Classic Tomato', price_modifier: 0 },
      { id: 'white', name: 'Garlic White Sauce', price_modifier: 0.5 },
      { id: 'bbq', name: 'BBQ Sauce', price_modifier: 0.5 },
      { id: 'pesto', name: 'Basil Pesto', price_modifier: 1.0 }
    ],
    toppings: [
      { id: 'pepperoni', name: 'Pepperoni', category: 'meat', price_modifier: 1.5 },
      { id: 'sausage', name: 'Italian Sausage', category: 'meat', price_modifier: 1.5 },
      { id: 'bacon', name: 'Crispy Bacon', category: 'meat', price_modifier: 2.0 },
      { id: 'mushrooms', name: 'Mushrooms', category: 'vegetable', price_modifier: 1.0 },
      { id: 'peppers', name: 'Bell Peppers', category: 'vegetable', price_modifier: 1.0 },
      { id: 'onions', name: 'Red Onions', category: 'vegetable', price_modifier: 0.5 },
      { id: 'extra_mozzarella', name: 'Extra Mozzarella', category: 'cheese', price_modifier: 1.5 }
    ]
  };

  // Set default selections
  React.useEffect(() => {
    setSelection(prev => ({
      ...prev,
      size: options.sizes?.[0] || null,
      crust: options.crusts?.[0] || null,
      sauce: options.sauces?.[0] || null
    }));
  }, []);

  const calculatePrice = () => {
    let basePrice = item.price;
    
    // Apply size modifier
    if (selection.size) {
      basePrice = basePrice * selection.size.price_modifier;
    }

    // Apply crust modifier
    if (selection.crust) {
      basePrice += selection.crust.price_modifier;
    }

    // Apply sauce modifier
    if (selection.sauce) {
      basePrice += selection.sauce.price_modifier;
    }

    // Apply topping modifiers
    selection.toppings.forEach(topping => {
      basePrice += topping.price_modifier;
    });

    return basePrice;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const toggleTopping = (topping: any) => {
    setSelection(prev => ({
      ...prev,
      toppings: prev.toppings.find(t => t.id === topping.id)
        ? prev.toppings.filter(t => t.id !== topping.id)
        : [...prev.toppings, topping]
    }));
  };

  const isValidSelection = () => {
    return selection.size && selection.crust && selection.sauce;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900">Customize Your {item.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose Size</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {options.sizes?.map((size: any) => (
                <button
                  key={size.id}
                  onClick={() => setSelection(prev => ({ ...prev, size }))}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    selection.size?.id === size.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{size.name}</div>
                  <div className="text-sm text-gray-500">{size.diameter}</div>
                  <div className="text-sm text-blue-600">
                    {formatCurrency(item.price * size.price_modifier)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Crust Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose Crust</h3>
            <div className="space-y-2">
              {options.crusts?.map((crust: any) => (
                <button
                  key={crust.id}
                  onClick={() => setSelection(prev => ({ ...prev, crust }))}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    selection.crust?.id === crust.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{crust.name}</div>
                      <div className="text-sm text-gray-500">{crust.description}</div>
                    </div>
                    {crust.price_modifier > 0 && (
                      <div className="text-sm text-blue-600">
                        +{formatCurrency(crust.price_modifier)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sauce Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose Sauce</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options.sauces?.map((sauce: any) => (
                <button
                  key={sauce.id}
                  onClick={() => setSelection(prev => ({ ...prev, sauce }))}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selection.sauce?.id === sauce.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{sauce.name}</div>
                      <div className="text-sm text-gray-500">{sauce.description}</div>
                    </div>
                    {sauce.price_modifier > 0 && (
                      <div className="text-sm text-blue-600">
                        +{formatCurrency(sauce.price_modifier)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Toppings Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose Toppings</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {options.toppings?.map((topping: any) => {
                const isSelected = selection.toppings.find(t => t.id === topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() => toggleTopping(topping)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{topping.name}</div>
                        <Badge className="text-xs mt-1" variant="outline">
                          {topping.category}
                        </Badge>
                      </div>
                      <div>
                        {topping.price_modifier > 0 && (
                          <div className="text-sm text-blue-600">
                            +{formatCurrency(topping.price_modifier)}
                          </div>
                        )}
                        {isSelected && (
                          <div className="text-blue-600 mt-1">✓</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculatePrice())}
                </div>
                <div className="text-sm text-gray-500">
                  {selection.toppings.length} topping{selection.toppings.length !== 1 ? 's' : ''} selected
                </div>
              </div>
              
              <Button
                onClick={() => onAddToCart(item, selection, calculatePrice())}
                disabled={!isValidSelection()}
                className="px-8 py-3 text-lg"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};