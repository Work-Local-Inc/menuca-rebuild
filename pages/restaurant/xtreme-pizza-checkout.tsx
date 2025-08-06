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

// Complete real scraped menu data (ALL 33 items) - JavaScript import for reliable build
import { xtremeMenuData } from '../../data/xtreme-pizza-complete';

const menuData = xtremeMenuData;

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
  
  const categories = ['All', ...menuData.categories.map(cat => cat.name)];
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
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
    
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount / 100, // Convert back to dollars for API
          currency: 'cad',
          orderData: {
            restaurantId: 'xtreme-pizza-ottawa',
            items: cart,
            deliveryAddress: 'Ottawa, ON',
            specialInstructions: 'Please ring doorbell'
          }
        }),
      });

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
      setShowCheckout(true);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initialize checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    alert(`🎉 Payment successful! Order total: $${(totalAmount / 100).toFixed(2)}`);
    setCart([]);
    setShowCheckout(false);
    setClientSecret('');
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

      {/* Stripe Checkout Modal */}
      {showCheckout && clientSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Order Total:</p>
              <p className="text-lg font-bold text-red-600">
                ${(totalAmount / 100).toFixed(2)} CAD
              </p>
            </div>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <StripePaymentForm
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                totalAmount={totalAmount / 100}
              />
            </Elements>
          </div>
        </div>
      )}

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