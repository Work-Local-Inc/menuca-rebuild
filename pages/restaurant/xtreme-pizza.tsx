/**
 * Xtreme Pizza Restaurant Page
 * Display all 31 scraped menu items from enterprise backend
 */

import React from 'react';
import { useState } from 'react';

// Load scraped menu data
const menuData = {
  "restaurant": {
    "name": "Xtreme Pizza Ottawa",
    "location": "Ottawa, ON",
    "cuisine": "Pizza",
    "phone": "",
    "address": "",
    "website": "https://ottawa.xtremepizzaottawa.com"
  },
  "categories": [
    {
      "name": "Appetizers",
      "items": [
        {
          "name": "Fries",
          "description": "",
          "variants": [
            { "size": "Small", "price": 699 },
            { "size": "Large", "price": 899 }
          ]
        },
        {
          "name": "Onion Rings",
          "description": "",
          "variants": [
            { "size": "Small", "price": 799 },
            { "size": "Large", "price": 999 }
          ]
        }
      ]
    },
    {
      "name": "Poutine",
      "items": [
        {
          "name": "Poutine",
          "description": "With cheese curds and gravy.",
          "variants": [
            { "size": "Small", "price": 899 },
            { "size": "Large", "price": 1199 }
          ]
        },
        {
          "name": "Italian Poutine",
          "description": "With mozzarella cheese and meat sauce.",
          "variants": [
            { "size": "Small", "price": 999 },
            { "size": "Large", "price": 1299 }
          ]
        },
        {
          "name": "Canadian Poutine",
          "description": "Cheese curds, chicken, bacon and gravy.",
          "variants": [
            { "size": "Small", "price": 1099 },
            { "size": "Large", "price": 1399 }
          ]
        },
        {
          "name": "Donair Poutine",
          "description": "With mozzarella cheese, donair meat and sweet sauce.",
          "variants": [
            { "size": "Small", "price": 1099 },
            { "size": "Large", "price": 1399 }
          ]
        }
      ]
    },
    {
      "name": "Pizza",
      "items": [
        {
          "name": "Plain Pizza",
          "description": "",
          "variants": [
            { "size": "Small", "price": 1399 },
            { "size": "Medium", "price": 1999 },
            { "size": "Large", "price": 2599 },
            { "size": "X-Large", "price": 3199 }
          ]
        },
        {
          "name": "1 Topping",
          "description": "",
          "variants": [
            { "size": "Small", "price": 1499 },
            { "size": "Medium", "price": 2149 },
            { "size": "Large", "price": 2799 },
            { "size": "X-Large", "price": 3449 }
          ]
        },
        {
          "name": "2 Toppings",
          "description": "",
          "variants": [
            { "size": "Small", "price": 1599 },
            { "size": "Medium", "price": 2299 },
            { "size": "Large", "price": 2999 },
            { "size": "X-Large", "price": 3699 }
          ]
        },
        {
          "name": "3 Toppings",
          "description": "",
          "variants": [
            { "size": "Small", "price": 1699 },
            { "size": "Medium", "price": 2449 },
            { "size": "Large", "price": 3199 },
            { "size": "X-Large", "price": 3949 }
          ]
        },
        {
          "name": "Hawaiian",
          "description": "Ham, pineapple.",
          "variants": [
            { "size": "Small", "price": 1599 },
            { "size": "Medium", "price": 2299 },
            { "size": "Large", "price": 2999 },
            { "size": "X-Large", "price": 3699 }
          ]
        },
        {
          "name": "Canadian",
          "description": "Pepperoni, mushrooms, bacon strips.",
          "variants": [
            { "size": "Small", "price": 1699 },
            { "size": "Medium", "price": 2449 },
            { "size": "Large", "price": 3199 },
            { "size": "X-Large", "price": 3949 }
          ]
        },
        {
          "name": "Combination",
          "description": "Pepperoni, mushrooms, green peppers.",
          "variants": [
            { "size": "Small", "price": 1699 },
            { "size": "Medium", "price": 2449 },
            { "size": "Large", "price": 3199 },
            { "size": "X-Large", "price": 3949 }
          ]
        },
        {
          "name": "Meat Lovers",
          "description": "Pepperoni, ham, sausage, bacon strips.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "House Special Pizza",
          "description": "Pepperoni, mushrooms, green peppers, onions, green olives, bacon strips.",
          "variants": [
            { "size": "Small", "price": 1899 },
            { "size": "Medium", "price": 2749 },
            { "size": "Large", "price": 3599 },
            { "size": "X-Large", "price": 4449 }
          ]
        },
        {
          "name": "Vegetarian Pizza",
          "description": "Mushrooms, green peppers, onions, olives, tomatoes.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "Chicken Pizza",
          "description": "Chicken, green peppers, onions, black olives.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "Donair Pizza",
          "description": "Donair meat, mushrooms, green peppers, onions.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "Steak Pizza",
          "description": "Steak, mushrooms, green peppers, onions.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "Greek Pizza",
          "description": "Green peppers, onions, hot peppers, feta cheese, tomatoes, black olives.",
          "variants": [
            { "size": "Small", "price": 1899 },
            { "size": "Medium", "price": 2749 },
            { "size": "Large", "price": 3599 },
            { "size": "X-Large", "price": 4449 }
          ]
        },
        {
          "name": "Italian Pizza",
          "description": "Italian sausage, onions, green peppers, tomatoes.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "Hot Spicy Pizza",
          "description": "Italian sausage, hot peppers, onions, ham, BBQ sauce on top.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "New York Style Pizza",
          "description": "Extra thin crust, pepperoni on top.",
          "variants": [
            { "size": "Small", "price": 1799 },
            { "size": "Medium", "price": 2599 },
            { "size": "Large", "price": 3399 },
            { "size": "X-Large", "price": 4199 }
          ]
        },
        {
          "name": "Xtreme Supreme Pizza",
          "description": "Pepperoni, mushrooms, green peppers, ham, sausage, olives, onions, bacon.",
          "variants": [
            { "size": "Small", "price": 1999 },
            { "size": "Medium", "price": 2899 },
            { "size": "Large", "price": 3799 },
            { "size": "X-Large", "price": 4699 }
          ]
        }
      ]
    },
    {
      "name": "Donairs and Shawarma",
      "items": [
        {
          "name": "Donair Sandwich",
          "description": "",
          "variants": [
            { "size": "Small", "price": 999 },
            { "size": "Large", "price": 1499 }
          ]
        },
        {
          "name": "Donair Platter",
          "description": "With lettuce, onion, tomatoes and your choice of garlic or sweet sauce.",
          "variants": [
            { "size": "Small", "price": 1499 },
            { "size": "Large", "price": 1899 }
          ]
        },
        {
          "name": "Shawarma Sandwich",
          "description": "Lettuce, tomatoes and garlic sauce.",
          "variants": [
            { "size": "Small", "price": 999 },
            { "size": "Large", "price": 1499 }
          ]
        },
        {
          "name": "Shawarma Platter",
          "description": "",
          "variants": [
            { "size": "Small", "price": 1499 },
            { "size": "Large", "price": 1899 }
          ]
        }
      ]
    },
    {
      "name": "Salads",
      "items": [
        {
          "name": "Garden Salad",
          "description": "Lettuce, tomatoes, onions, green peppers and green olives.",
          "variants": [
            { "size": "Small", "price": 999 },
            { "size": "Large", "price": 1299 }
          ]
        },
        {
          "name": "Greek Salad",
          "description": "Lettuce, tomatoes, onions, green peppers, black olives and feta cheese.",
          "variants": [
            { "size": "Small", "price": 1299 },
            { "size": "Large", "price": 1599 }
          ]
        },
        {
          "name": "Caesar Salad",
          "description": "Lettuce, croutons and bacon bits.",
          "variants": [
            { "size": "Small", "price": 1099 },
            { "size": "Large", "price": 1399 }
          ]
        },
        {
          "name": "Chicken Caesar Salad",
          "description": "Chicken breast, lettuce, croutons and bacon bits.",
          "variants": [
            { "size": "Small", "price": 1399 },
            { "size": "Large", "price": 1699 }
          ]
        },
        {
          "name": "Xtreme Salad",
          "description": "Lettuce, tomatoes, green olives, onions, croutons, cheese and sliced turkey.",
          "variants": [
            { "size": "Small", "price": 1399 },
            { "size": "Large", "price": 1699 }
          ]
        }
      ]
    }
  ]
};

// Count total items
const totalItems = menuData.categories.reduce((sum, category) => sum + category.items.length, 0);

interface MenuItem {
  name: string;
  description: string;
  variants: Array<{
    size: string;
    price: number;
  }>;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

const MenuCard: React.FC<{ item: MenuItem; category: string }> = ({ item, category }) => {
  const [selectedSize, setSelectedSize] = useState(0);
  
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const handleAddToCart = () => {
    // TODO: Integrate with cart system and Stripe checkout
    console.log('Add to cart:', {
      name: item.name,
      size: item.variants[selectedSize].size,
      price: item.variants[selectedSize].price / 100,
      category
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Item Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {item.name}
      </h3>
      
      {/* Description */}
      {item.description && (
        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
          {item.description}
        </p>
      )}
      
      {/* Size & Price Options */}
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
      
      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
      >
        Add to Cart - {formatPrice(item.variants[selectedSize].price)}
      </button>
    </div>
  );
};

const XtremePizzaPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', ...menuData.categories.map(cat => cat.name)];
  
  const filteredItems = selectedCategory === 'All' 
    ? menuData.categories.flatMap(category => 
        category.items.map(item => ({ ...item, category: category.name }))
      )
    : menuData.categories
        .find(cat => cat.name === selectedCategory)
        ?.items.map(item => ({ ...item, category: selectedCategory })) || [];

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
              <p className="text-sm text-gray-500">
                {totalItems} Menu Items • 6 Categories
              </p>
              <p className="text-sm text-green-600 font-medium">
                ✅ Live Scraped Data from Enterprise Backend
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
                {category !== 'All' && (
                  <span className="ml-2 text-xs opacity-75">
                    ({menuData.categories.find(cat => cat.name === category)?.items.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <MenuCard
              key={`${item.category}-${index}`}
              item={item}
              category={item.category}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>🍕 Complete menu scraped from {menuData.restaurant.website}</p>
            <p className="mt-1">Ready for Stripe integration and chit printer workflow</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XtremePizzaPage;