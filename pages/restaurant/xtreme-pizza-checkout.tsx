/**
 * Xtreme Pizza with Stripe Checkout Integration
 * Full restaurant experience with real menu data + payments
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/StripePaymentForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Restaurant ID for the admin's Xtreme Pizza data
const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

interface CartItem {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  category: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  variants: Array<{
    size: string;
    price: number;
  }>;
}

const MenuCard: React.FC<{ 
  item: MenuItem; 
  category: string;
  onAddToCart: (item: CartItem) => void;
}> = ({ item, category, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState(0);
  
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const handleAddToCart = () => {
    const variant = item.variants[selectedSize];
    const cartItem: CartItem = {
      id: `${item.id}-${variant.size}`,
      name: item.name,
      size: variant.size,
      price: variant.price,
      quantity: 1,
      category
    };
    onAddToCart(cartItem);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {item.name}
      </h3>
      
      {item.description && (
        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
          {item.description}
        </p>
      )}
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {item.variants.map((variant, index) => (
            <button
              key={index}
              onClick={() => setSelectedSize(index)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSize === index
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {variant.size} {formatPrice(variant.price)}
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleAddToCart}
        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
      >
        Add to Cart - {formatPrice(item.variants[selectedSize].price)}
      </button>
    </div>
  );
};

const ShoppingCart: React.FC<{
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}> = ({ cart, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Cart</h3>
        <p className="text-gray-600">Cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Cart</h3>
      
      <div className="space-y-4 mb-6">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <p className="text-sm text-gray-600">{item.size} • {item.category}</p>
              <p className="text-sm font-medium text-gray-900">{formatPrice(item.price)}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                +
              </button>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="text-red-600 hover:text-red-700 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-red-600">{formatPrice(totalAmount)}</span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Proceed to Checkout - {formatPrice(totalAmount)}
        </button>
      </div>
    </div>
  );
};

const XtremePizzaCheckout: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [menuData, setMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch menu data from the live database
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/menu-management/restaurant/${RESTAURANT_ID}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error('No menu data found');
        }
        
        // Transform the data to match the expected format
        const menu = result.data[0]; // Get the first menu
        const transformedData = {
          restaurant: {
            name: 'Xtreme Pizza Ottawa',
            location: 'Ottawa, ON',
            cuisine: 'Pizza'
          },
          categories: menu.categories.map((category: any) => ({
            name: category.name,
            items: category.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              variants: item.options || [{ size: 'Regular', price: Math.round(item.price * 100) }] // Convert to cents
            }))
          }))
        };
        
        setMenuData(transformedData);
        console.log('✅ Live menu data loaded:', transformedData);
        
      } catch (error) {
        console.error('❌ Error fetching menu data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenuData();
  }, []);
  
  const categories = menuData ? ['All', ...menuData.categories.map((cat: any) => cat.name)] : [];
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading live menu data...</p>
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
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const addToCart = (newItem: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === newItem.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, newItem];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(id);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Convert cart items to the format expected by main checkout page
    const checkoutCart = cart.map(item => ({
      menuItem: {
        name: item.name,
        price: item.price / 100, // Convert to dollars
      },
      quantity: item.quantity,
      finalPrice: item.price / 100, // Convert to dollars
    }));
    
    // Store cart data for the main checkout page
    sessionStorage.setItem('checkout_cart', JSON.stringify(checkoutCart));
    sessionStorage.setItem('checkout_restaurant', JSON.stringify({
      id: 'xtreme-pizza-ottawa',
      name: 'Xtreme Pizza Ottawa'
    }));
    
    console.log('Redirecting to main checkout with cart:', checkoutCart);
    
    // Redirect to the main checkout page
    window.location.href = '/checkout';
  };

  const handlePaymentSuccess = () => {
    // Store order details for confirmation page
    const completedOrder = {
      items: cart.map(item => ({
        menuItem: {
          name: item.name,
          price: item.price
        },
        quantity: item.quantity,
        finalPrice: item.price
      })),
      total: totalAmount / 100,
      subtotal: (totalAmount / 100) * 0.885, // Approximate before tax
      tax: (totalAmount / 100) * 0.115, // Approximate tax
      delivery: 2.99,
      tip: 0,
      timestamp: new Date().toISOString(),
    };
    
    sessionStorage.setItem('completed_order', JSON.stringify(completedOrder));
    
    // Redirect to dedicated order success page
    window.location.href = '/order-success?payment_intent=pi_success_' + Date.now();
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
    setShowCheckout(false);
  };

  const filteredItems = selectedCategory === 'All' 
    ? menuData.categories.flatMap(category => 
        category.items.map(item => ({ ...item, category: category.name }))
      )
    : menuData.categories
        .find(cat => cat.name === selectedCategory)
        ?.items.map(item => ({ ...item, category: selectedCategory })) || [];

  const appearance = {
    theme: 'stripe' as const,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {menuData.restaurant.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {menuData.restaurant.location} • {menuData.restaurant.cuisine}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600 font-medium">
                🔥 Now with Stripe Checkout!
              </p>
              <p className="text-sm text-gray-500">
                Cart: {cart.length} items • ${(totalAmount / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex space-x-1 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((item, index) => (
                <MenuCard
                  key={`${item.category}-${index}`}
                  item={item}
                  category={item.category}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </div>

          {/* Shopping Cart */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <ShoppingCart
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>


      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>🍕 Real menu data + 💳 Stripe payments + 🖨️ Ready for chit printer integration</p>
            <p className="mt-1">Enterprise-grade restaurant ordering system</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XtremePizzaCheckout;