/**
 * Pizza Builder Component - MenuCA Design System
 * Inspired by Domino's Pizza Builder and Papa John's customization flow
 * The most advanced food customization interface in the platform
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const MinusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Types
export type PizzaSize = 'small' | 'medium' | 'large' | 'xlarge';
export type CrustType = 'thin' | 'regular' | 'thick' | 'stuffed';
export type SauceType = 'tomato' | 'white' | 'bbq' | 'pesto' | 'none';
export type CheeseLevel = 'none' | 'light' | 'regular' | 'extra';
export type ToppingSide = 'left' | 'right' | 'whole';

export interface Topping {
  id: string;
  name: string;
  price: number; // in cents
  category: 'meat' | 'vegetable' | 'cheese' | 'sauce';
  image?: string;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  maxQuantity?: number;
}

export interface ToppingSelection {
  toppingId: string;
  side: ToppingSide;
  quantity: number;
}

export interface PizzaConfiguration {
  size: PizzaSize;
  crust: CrustType;
  sauce: SauceType;
  cheese: CheeseLevel;
  toppings: ToppingSelection[];
  specialInstructions?: string;
}

export interface PizzaBuilderProps {
  /**
   * Available pizza sizes with pricing
   */
  sizes: Array<{
    id: PizzaSize;
    name: string;
    price: number;
    diameter: string;
    description?: string;
  }>;
  
  /**
   * Available crust types
   */
  crusts: Array<{
    id: CrustType;
    name: string;
    price: number;
    description?: string;
  }>;
  
  /**
   * Available sauces
   */
  sauces: Array<{
    id: SauceType;
    name: string;
    price: number;
    description?: string;
  }>;
  
  /**
   * Available toppings
   */
  toppings: Topping[];
  
  /**
   * Initial configuration
   */
  initialConfig?: Partial<PizzaConfiguration>;
  
  /**
   * Callback when configuration changes
   */
  onChange?: (config: PizzaConfiguration, totalPrice: number) => void;
  
  /**
   * Callback when pizza is added to cart
   */
  onAddToCart?: (config: PizzaConfiguration, totalPrice: number) => void;
  
  /**
   * Loading states
   */
  isAddingToCart?: boolean;
  
  className?: string;
}

/**
 * Price formatting utility
 */
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(price / 100);
};

/**
 * Pizza Builder Component
 * 
 * Features:
 * - Visual pizza representation with toppings overlay
 * - Half-and-half topping support (left/right sides)
 * - Real-time price calculation
 * - Step-by-step customization flow
 * - Mobile-optimized interface
 * - Accessibility support
 */
export const PizzaBuilder: React.FC<PizzaBuilderProps> = ({
  sizes,
  crusts,
  sauces,
  toppings,
  initialConfig = {},
  onChange,
  onAddToCart,
  isAddingToCart = false,
  className,
}) => {
  // State management
  const [config, setConfig] = useState<PizzaConfiguration>({
    size: 'medium',
    crust: 'regular', 
    sauce: 'tomato',
    cheese: 'regular',
    toppings: [],
    specialInstructions: '',
    ...initialConfig,
  });
  
  const [activeStep, setActiveStep] = useState<'size' | 'crust' | 'sauce' | 'toppings'>('size');
  const [activeToppingSide, setActiveToppingSide] = useState<ToppingSide>('whole');
  
  // Price calculation
  const totalPrice = useMemo(() => {
    let price = 0;
    
    // Base pizza price (size)
    const sizeOption = sizes.find(s => s.id === config.size);
    price += sizeOption?.price || 0;
    
    // Crust price
    const crustOption = crusts.find(c => c.id === config.crust);
    price += crustOption?.price || 0;
    
    // Sauce price
    const sauceOption = sauces.find(s => s.id === config.sauce);
    price += sauceOption?.price || 0;
    
    // Toppings price
    config.toppings.forEach(selection => {
      const topping = toppings.find(t => t.id === selection.toppingId);
      if (topping) {
        price += topping.price * selection.quantity;
      }
    });
    
    return price;
  }, [config, sizes, crusts, sauces, toppings]);
  
  // Update configuration and notify parent
  const updateConfig = useCallback((updates: Partial<PizzaConfiguration>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange?.(newConfig, totalPrice);
  }, [config, onChange, totalPrice]);
  
  // Topping management
  const getToppingQuantity = (toppingId: string, side: ToppingSide) => {
    const selection = config.toppings.find(
      t => t.toppingId === toppingId && t.side === side
    );
    return selection?.quantity || 0;
  };
  
  const updateTopping = (toppingId: string, side: ToppingSide, quantity: number) => {
    const newToppings = config.toppings.filter(
      t => !(t.toppingId === toppingId && t.side === side)
    );
    
    if (quantity > 0) {
      newToppings.push({ toppingId, side, quantity });
    }
    
    updateConfig({ toppings: newToppings });
  };
  
  // Group toppings by category
  const toppingsByCategory = useMemo(() => {
    return toppings.reduce((acc, topping) => {
      if (!acc[topping.category]) {
        acc[topping.category] = [];
      }
      acc[topping.category].push(topping);
      return acc;
    }, {} as Record<string, Topping[]>);
  }, [toppings]);
  
  const steps = [
    { id: 'size', name: 'Size' },
    { id: 'crust', name: 'Crust' },
    { id: 'sauce', name: 'Sauce' },
    { id: 'toppings', name: 'Toppings' },
  ] as const;

  return (
    <div className={cn('max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden', className)}>
      {/* Progress Steps */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeStep === step.id
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                activeStep === step.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              )}>
                {index + 1}
              </span>
              <span>{step.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Pizza Visual (Left Column) */}
        <div className="space-y-4">
          {/* Pizza Preview */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="relative w-64 h-64 mx-auto">
              {/* Pizza Base */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-300 border-4 border-yellow-400" />
              
              {/* Sauce Layer */}
              {config.sauce !== 'none' && (
                <div className={cn(
                  'absolute inset-2 rounded-full opacity-80',
                  config.sauce === 'tomato' && 'bg-red-400',
                  config.sauce === 'white' && 'bg-gray-100',
                  config.sauce === 'bbq' && 'bg-amber-600',
                  config.sauce === 'pesto' && 'bg-green-400'
                )} />
              )}
              
              {/* Cheese Layer */}
              {config.cheese !== 'none' && (
                <div className={cn(
                  'absolute inset-3 rounded-full',
                  config.cheese === 'light' && 'bg-yellow-200 opacity-60',
                  config.cheese === 'regular' && 'bg-yellow-200 opacity-80',
                  config.cheese === 'extra' && 'bg-yellow-100 opacity-90'
                )} />
              )}
              
              {/* Toppings Visualization */}
              {config.toppings.map((selection, index) => {
                const topping = toppings.find(t => t.id === selection.toppingId);
                if (!topping) return null;
                
                return (
                  <div
                    key={`${selection.toppingId}-${selection.side}-${index}`}
                    className={cn(
                      'absolute rounded-full opacity-75',
                      // Position based on side
                      selection.side === 'left' && 'left-4 right-1/2 top-4 bottom-4',
                      selection.side === 'right' && 'left-1/2 right-4 top-4 bottom-4', 
                      selection.side === 'whole' && 'inset-4',
                      // Color based on topping category
                      topping.category === 'meat' && 'bg-red-600',
                      topping.category === 'vegetable' && 'bg-green-500',
                      topping.category === 'cheese' && 'bg-yellow-300'
                    )}
                    style={{
                      opacity: Math.min(0.8, selection.quantity * 0.3 + 0.2),
                    }}
                  />
                );
              })}
              
              {/* Half-and-half divider */}
              {config.toppings.some(t => t.side === 'left') && 
               config.toppings.some(t => t.side === 'right') && (
                <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gray-400 transform -translate-x-px" />
              )}
            </div>
            
            {/* Size indicator */}
            <div className="mt-4">
              <span className="text-sm text-gray-600">
                {sizes.find(s => s.id === config.size)?.diameter} • {config.crust} crust
              </span>
            </div>
          </div>
          
          {/* Price Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Current Total:</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <Button
              variant="default"
              size="lg"
              fullWidth
              onClick={() => onAddToCart?.(config, totalPrice)}
              loading={isAddingToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Adding to Cart...' : `Add to Cart • ${formatPrice(totalPrice)}`}
            </Button>
          </div>
        </div>

        {/* Configuration Options (Right Column) */}
        <div className="space-y-6">
          {/* Size Selection */}
          {activeStep === 'size' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Size</h3>
              <div className="grid grid-cols-1 gap-3">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => updateConfig({ size: size.id })}
                    className={cn(
                      'flex justify-between items-center p-4 border rounded-lg text-left transition-colors',
                      config.size === size.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div>
                      <div className="font-medium">{size.name}</div>
                      <div className="text-sm text-gray-600">{size.diameter}</div>
                      {size.description && (
                        <div className="text-sm text-gray-500">{size.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(size.price)}</div>
                      {config.size === size.id && (
                        <CheckIcon />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Crust Selection */}
          {activeStep === 'crust' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Crust</h3>
              <div className="grid grid-cols-1 gap-3">
                {crusts.map((crust) => (
                  <button
                    key={crust.id}
                    onClick={() => updateConfig({ crust: crust.id })}
                    className={cn(
                      'flex justify-between items-center p-4 border rounded-lg text-left transition-colors',
                      config.crust === crust.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div>
                      <div className="font-medium">{crust.name}</div>
                      {crust.description && (
                        <div className="text-sm text-gray-500">{crust.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {crust.price > 0 ? `+${formatPrice(crust.price)}` : 'Included'}
                      </div>
                      {config.crust === crust.id && (
                        <CheckIcon />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sauce Selection */}
          {activeStep === 'sauce' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Sauce</h3>
              <div className="grid grid-cols-1 gap-3">
                {sauces.map((sauce) => (
                  <button
                    key={sauce.id}
                    onClick={() => updateConfig({ sauce: sauce.id })}
                    className={cn(
                      'flex justify-between items-center p-4 border rounded-lg text-left transition-colors',
                      config.sauce === sauce.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div>
                      <div className="font-medium">{sauce.name}</div>
                      {sauce.description && (
                        <div className="text-sm text-gray-500">{sauce.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {sauce.price > 0 ? `+${formatPrice(sauce.price)}` : 'Included'}
                      </div>
                      {config.sauce === sauce.id && (
                        <CheckIcon />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toppings Selection */}
          {activeStep === 'toppings' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Toppings</h3>
                
                {/* Side selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { id: 'whole', name: 'Whole' },
                    { id: 'left', name: 'Left' }, 
                    { id: 'right', name: 'Right' },
                  ].map((side) => (
                    <button
                      key={side.id}
                      onClick={() => setActiveToppingSide(side.id as ToppingSide)}
                      className={cn(
                        'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                        activeToppingSide === side.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {side.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings by category */}
              {Object.entries(toppingsByCategory).map(([category, categoryToppings]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {categoryToppings.map((topping) => {
                      const quantity = getToppingQuantity(topping.id, activeToppingSide);
                      const maxQuantity = topping.maxQuantity || 3;
                      
                      return (
                        <div
                          key={topping.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{topping.name}</span>
                              {topping.isSpicy && (
                                <Badge variant="destructive" className="text-xs">🌶️ Spicy</Badge>
                              )}
                              {topping.isVegetarian && (
                                <Badge variant="secondary" className="text-xs">🌱 Veg</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              +{formatPrice(topping.price)} each
                            </div>
                          </div>
                          
                          {/* Quantity controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTopping(topping.id, activeToppingSide, Math.max(0, quantity - 1))}
                              disabled={quantity === 0}
                            >
                              <MinusIcon />
                            </Button>
                            
                            <span className="w-8 text-center font-medium">
                              {quantity}
                            </span>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTopping(topping.id, activeToppingSide, Math.min(maxQuantity, quantity + 1))}
                              disabled={quantity >= maxQuantity}
                            >
                              <PlusIcon />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              const currentIndex = steps.findIndex(s => s.id === activeStep);
              if (currentIndex > 0) {
                setActiveStep(steps[currentIndex - 1].id);
              }
            }}
            disabled={activeStep === 'size'}
          >
            Previous
          </Button>
          
          <Button
            onClick={() => {
              const currentIndex = steps.findIndex(s => s.id === activeStep);
              if (currentIndex < steps.length - 1) {
                setActiveStep(steps[currentIndex + 1].id);
              }
            }}
            disabled={activeStep === 'toppings'}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};