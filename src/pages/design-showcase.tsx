/**
 * Design System Showcase Page
 * Demonstrates all MenuCA UI components and patterns
 */

import React, { useState } from 'react';
import { CustomerLayout, PageContainer, Section } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MenuCard, MenuCardVertical } from '@/components/food/MenuCard';
import { PizzaBuilder } from '@/components/food/PizzaBuilder';

// Sample data
const sampleMenuItems = [
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    description: 'Fresh tomatoes, mozzarella cheese, basil leaves, olive oil on our signature thin crust',
    price: 1299, // $12.99 in cents
    originalPrice: 1499,
    image: '/images/margherita.jpg',
    imageAlt: 'Delicious Margherita Pizza',
    rating: 4.5,
    reviewCount: 142,
    badges: [
      { text: 'Popular', variant: 'popular' as const },
      { text: 'Vegetarian', variant: 'vegetarian' as const }
    ],
    availability: 'available' as const,
    prepTime: '15-20 min',
    hasCustomizations: true,
    customizationCount: 8,
  },
  {
    id: 'pepperoni-pizza',
    name: 'Pepperoni Pizza',
    description: 'Classic pepperoni with mozzarella cheese and tomato sauce',
    price: 1499,
    image: '/images/pepperoni.jpg',
    rating: 4.7,
    reviewCount: 89,
    badges: [
      { text: 'Spicy', variant: 'spicy' as const }
    ],
    availability: 'low_stock' as const,
    prepTime: '12-18 min',
    hasCustomizations: true,
  },
  {
    id: 'veggie-supreme',
    name: 'Veggie Supreme',
    description: 'Bell peppers, mushrooms, onions, olives, tomatoes',
    price: 1399,
    image: '/images/veggie.jpg',
    rating: 4.3,
    reviewCount: 67,
    badges: [
      { text: 'Vegetarian', variant: 'vegetarian' as const },
      { text: 'Healthy', variant: 'new' as const }
    ],
    availability: 'available' as const,
    prepTime: '18-25 min',
    hasCustomizations: true,
  },
];

const pizzaBuilderData = {
  sizes: [
    { id: 'small' as const, name: 'Small (10")', price: 999, diameter: '10 inches', description: 'Perfect for 1 person' },
    { id: 'medium' as const, name: 'Medium (12")', price: 1299, diameter: '12 inches', description: 'Great for 2-3 people' },
    { id: 'large' as const, name: 'Large (14")', price: 1599, diameter: '14 inches', description: 'Ideal for 3-4 people' },
    { id: 'xlarge' as const, name: 'X-Large (16")', price: 1899, diameter: '16 inches', description: 'Perfect for sharing' },
  ],
  crusts: [
    { id: 'thin' as const, name: 'Thin Crust', price: 0, description: 'Crispy and light' },
    { id: 'regular' as const, name: 'Regular Crust', price: 0, description: 'Our classic crust' },
    { id: 'thick' as const, name: 'Thick Crust', price: 200, description: 'Fluffy and filling' },
    { id: 'stuffed' as const, name: 'Cheese Stuffed', price: 400, description: 'Cheese-filled crust' },
  ],
  sauces: [
    { id: 'tomato' as const, name: 'Tomato Sauce', price: 0, description: 'Classic tomato base' },
    { id: 'white' as const, name: 'White Sauce', price: 100, description: 'Creamy garlic base' },
    { id: 'bbq' as const, name: 'BBQ Sauce', price: 100, description: 'Sweet and tangy' },
    { id: 'pesto' as const, name: 'Pesto Sauce', price: 150, description: 'Basil and herb blend' },
    { id: 'none' as const, name: 'No Sauce', price: -100, description: 'Just cheese and toppings' },
  ],
  toppings: [
    // Meats
    { id: 'pepperoni', name: 'Pepperoni', price: 200, category: 'meat' as const, isSpicy: true },
    { id: 'sausage', name: 'Italian Sausage', price: 250, category: 'meat' as const },
    { id: 'ham', name: 'Ham', price: 200, category: 'meat' as const },
    { id: 'bacon', name: 'Bacon', price: 300, category: 'meat' as const },
    
    // Vegetables
    { id: 'mushrooms', name: 'Mushrooms', price: 150, category: 'vegetable' as const, isVegetarian: true },
    { id: 'peppers', name: 'Bell Peppers', price: 150, category: 'vegetable' as const, isVegetarian: true },
    { id: 'onions', name: 'Red Onions', price: 100, category: 'vegetable' as const, isVegetarian: true },
    { id: 'olives', name: 'Black Olives', price: 150, category: 'vegetable' as const, isVegetarian: true },
    { id: 'tomatoes', name: 'Fresh Tomatoes', price: 150, category: 'vegetable' as const, isVegetarian: true },
    { id: 'jalapenos', name: 'Jalapeños', price: 150, category: 'vegetable' as const, isVegetarian: true, isSpicy: true },
    
    // Cheeses
    { id: 'extra-cheese', name: 'Extra Mozzarella', price: 200, category: 'cheese' as const, isVegetarian: true },
    { id: 'cheddar', name: 'Cheddar Cheese', price: 200, category: 'cheese' as const, isVegetarian: true },
    { id: 'parmesan', name: 'Parmesan', price: 250, category: 'cheese' as const, isVegetarian: true },
  ],
};

const DesignShowcase: React.FC = () => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);

  const handleAddToCart = (itemId: string) => {
    setIsAddingToCart(true);
    // Simulate API call
    setTimeout(() => {
      setIsAddingToCart(false);
      console.log('Added to cart:', itemId);
    }, 1500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(price / 100);
  };

  return (
    <CustomerLayout
      title="Design System Showcase"
      description="Explore all MenuCA UI components and design patterns"
      cart={{
        itemCount: 3,
        totalValue: 4299,
        onCartClick: () => console.log('Cart clicked'),
      }}
      notifications={{
        activeOrderCount: 1,
        unreadCount: 2,
      }}
    >
      <PageContainer>
        {/* Hero Section */}
        <Section
          title="MenuCA Design System"
          subtitle="A comprehensive showcase of our food delivery UI components"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-4">
              🍕 Beautiful Food Ordering Experience
            </h1>
            <p className="text-lg opacity-90 mb-6">
              Inspired by DoorDash, Uber Eats, and the best food delivery platforms
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="secondary" size="lg">
                Browse Menu
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowPizzaBuilder(!showPizzaBuilder)}
              >
                Build Your Pizza
              </Button>
            </div>
          </div>
        </Section>

        {/* Button Showcase */}
        <Section title="Buttons" subtitle="All button variants and sizes">
          <div className="space-y-6">
            {/* Variants */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h3 className="text-lg font-semibold mb-3">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button leftIcon={<span>🛒</span>}>With Left Icon</Button>
                <Button rightIcon={<span>→</span>}>With Right Icon</Button>
                <Button fullWidth>Full Width</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Badge Showcase */}
        <Section title="Badges" subtitle="Status indicators and labels">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-orange-100 text-orange-800">Popular</Badge>
            <Badge className="bg-red-100 text-red-800">🌶️ Spicy</Badge>
            <Badge className="bg-green-100 text-green-800">🌱 Vegetarian</Badge>
          </div>
        </Section>

        {/* Menu Cards */}
        <Section title="Menu Cards" subtitle="Product display components">
          <div className="space-y-8">
            {/* Horizontal Layout */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Horizontal Layout (Mobile-First)</h3>
              <div className="space-y-4">
                {sampleMenuItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    {...item}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(id) => console.log('View details:', id)}
                    isAddingToCart={isAddingToCart}
                    layout="horizontal"
                  />
                ))}
              </div>
            </div>

            {/* Vertical Layout */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Vertical Layout (Grid)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleMenuItems.map((item) => (
                  <MenuCardVertical
                    key={`vertical-${item.id}`}
                    {...item}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(id) => console.log('View details:', id)}
                    isAddingToCart={isAddingToCart}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Pizza Builder */}
        {showPizzaBuilder && (
          <Section title="Pizza Builder" subtitle="Advanced customization interface">
            <PizzaBuilder
              {...pizzaBuilderData}
              onChange={(config, price) => {
                console.log('Pizza config changed:', config, formatPrice(price));
              }}
              onAddToCart={(config, price) => {
                console.log('Add pizza to cart:', config, formatPrice(price));
                setIsAddingToCart(true);
                setTimeout(() => setIsAddingToCart(false), 2000);
              }}
              isAddingToCart={isAddingToCart}
            />
          </Section>
        )}

        {/* Color Palette */}
        <Section title="Color System" subtitle="MenuCA brand colors and semantics">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Primary Colors */}
            <div className="text-center">
              <div className="h-16 bg-orange-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-gray-600">#f97316</p>
            </div>
            
            {/* Success */}
            <div className="text-center">
              <div className="h-16 bg-green-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-gray-600">#22c55e</p>
            </div>
            
            {/* Error */}
            <div className="text-center">
              <div className="h-16 bg-red-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs text-gray-600">#ef4444</p>
            </div>
            
            {/* Warning */}
            <div className="text-center">
              <div className="h-16 bg-yellow-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-gray-600">#eab308</p>
            </div>
            
            {/* Info */}
            <div className="text-center">
              <div className="h-16 bg-blue-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs text-gray-600">#3b82f6</p>
            </div>
            
            {/* Neutral */}
            <div className="text-center">
              <div className="h-16 bg-gray-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Neutral</p>
              <p className="text-xs text-gray-600">#6b7280</p>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography" subtitle="Text styles and hierarchy">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Heading 1 - Restaurant Names</h1>
              <p className="text-sm text-gray-500">text-4xl font-bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">Heading 2 - Section Titles</h2>
              <p className="text-sm text-gray-500">text-3xl font-semibold</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">Heading 3 - Menu Categories</h3>
              <p className="text-sm text-gray-500">text-2xl font-semibold</p>
            </div>
            <div>
              <h4 className="text-xl font-medium text-gray-900">Heading 4 - Menu Items</h4>
              <p className="text-sm text-gray-500">text-xl font-medium</p>
            </div>
            <div>
              <p className="text-base text-gray-700">Body Text - Menu descriptions and general content</p>
              <p className="text-sm text-gray-500">text-base</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Small Text - Meta information, timestamps</p>
              <p className="text-sm text-gray-500">text-sm</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Caption - Labels, fine print</p>
              <p className="text-sm text-gray-500">text-xs</p>
            </div>
          </div>
        </Section>

        {/* Spacing System */}
        <Section title="Spacing System" subtitle="Consistent spacing using 8pt grid">
          <div className="space-y-4">
            {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map((spacing) => (
              <div key={spacing} className="flex items-center gap-4">
                <div className={`bg-orange-500 h-4`} style={{ width: `${spacing * 4}px` }}></div>
                <span className="text-sm font-mono">{spacing * 4}px ({spacing * 0.25}rem)</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Mobile Preview */}
        <Section title="Mobile Experience" subtitle="Touch-friendly design">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="max-w-sm mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4">
                <h3 className="font-semibold mb-4">Mobile Menu View</h3>
                <div className="space-y-3">
                  {sampleMenuItems.slice(0, 2).map((item) => (
                    <MenuCard
                      key={`mobile-${item.id}`}
                      {...item}
                      onAddToCart={handleAddToCart}
                      layout="horizontal"
                      className="shadow-sm"
                    />
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" fullWidth>
                    View Menu
                  </Button>
                  <Button size="sm" fullWidth>
                    Order Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Implementation Notes */}
        <Section title="Implementation Notes" subtitle="Technical details for developers">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Key Features</h3>
            <ul className="space-y-2 text-sm">
              <li>✅ <strong>Mobile-First Design:</strong> Optimized for touch interactions</li>
              <li>✅ <strong>Accessibility:</strong> WCAG 2.1 AA compliant</li>
              <li>✅ <strong>Performance:</strong> Optimized images, lazy loading</li>
              <li>✅ <strong>Responsive:</strong> Works on all screen sizes</li>
              <li>✅ <strong>Design Tokens:</strong> Consistent theming system</li>
              <li>✅ <strong>Component Library:</strong> Reusable, composable components</li>
              <li>✅ <strong>TypeScript:</strong> Full type safety</li>
              <li>✅ <strong>Industry Patterns:</strong> Based on DoorDash, Uber Eats best practices</li>
            </ul>
          </div>
        </Section>
      </PageContainer>
    </CustomerLayout>
  );
};

export default DesignShowcase;