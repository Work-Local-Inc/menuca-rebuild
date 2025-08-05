/**
 * MenuCard Demo - Showcasing Uber Eats Inspired Improvements
 * Demonstrates enhanced features for local businesses without professional photos
 */

import React from 'react';
import { SimpleMenuCard } from './SimpleMenuCard';

const MenuCardDemo: React.FC = () => {
  const sampleMenuItems = [
    {
      id: '1',
      name: 'Margherita Pizza',
      description: 'Fresh tomatoes, mozzarella, basil, olive oil on hand-tossed dough',
      price: 18.99,
      rating: 4.7,
      reviewCount: 284,
      isPopular: true,
      preparationTime: 25,
      // Enhanced Uber Eats-style features
      restaurantName: 'Tony\'s Local Pizzeria',
      deliveryFee: 0,
      deliveryTime: '25-35 min',
      distance: '1.2 km',
      isFeatured: true,
      rankingBadge: '#1 Most Liked',
      availability: 'open' as const,
      promoText: 'Save $5 on orders $30+',
      minOrderAmount: 15
    },
    {
      id: '2', 
      name: 'Chicken Tikka Masala',
      description: 'Tender chicken in creamy tomato curry sauce, served with basmati rice',
      price: 16.50,
      originalPrice: 19.99,
      rating: 4.5,
      reviewCount: 142,
      isVegetarian: false,
      isSpicy: true,
      preparationTime: 20,
      // Enhanced features
      restaurantName: 'Spice Garden',
      deliveryFee: 2.99,
      deliveryTime: '15-25 min', 
      distance: '0.8 km',
      rankingBadge: 'Best Seller',
      availability: 'open' as const,
      minOrderAmount: 20
    },
    {
      id: '3',
      name: 'Quinoa Buddha Bowl',
      description: 'Organic quinoa, roasted vegetables, avocado, tahini dressing',
      price: 14.99,
      rating: 4.3,
      reviewCount: 89,
      isVegetarian: true,
      preparationTime: 15,
      // Local business closing soon scenario
      restaurantName: 'Green Earth Cafe',
      deliveryFee: 1.50,
      deliveryTime: '10-20 min',
      distance: '0.5 km',
      availability: 'closing_soon' as const,
      isClosingSoon: true,
      closingTime: '9:00 PM',
      promoText: 'Order quickly - closing soon!'
    },
    {
      id: '4',
      name: 'Classic Cheeseburger',
      description: 'Angus beef patty, aged cheddar, lettuce, tomato, house sauce',
      price: 13.75,
      rating: 4.6,
      reviewCount: 203,
      preparationTime: 18,
      hasCustomizations: true,
      // Closed restaurant scenario
      restaurantName: 'Main Street Diner',
      deliveryFee: 0,
      deliveryTime: 'Closed',
      distance: '2.1 km',
      availability: 'closed' as const,
      minOrderAmount: 12
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced MenuCards - Uber Eats Inspired 🚀
        </h1>
        <p className="text-gray-600">
          Optimized for local businesses without professional food photography
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sampleMenuItems.map((item) => (
          <SimpleMenuCard
            key={item.id}
            {...item}
            onAddToCart={() => console.log(`Adding ${item.name} to cart`)}
            onCustomize={() => console.log(`Customizing ${item.name}`)}
          />
        ))}
      </div>

      <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">✨ New Features Based on 26 Uber Eats Flows</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🏪 Local Business Support</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Restaurant name display</li>
              <li>• Delivery fee + time upfront</li>
              <li>• Distance indicators</li>
              <li>• Minimum order amounts</li>
              <li>• Closing time warnings</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🎯 Trust Building Without Photos</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "#1 Most Liked" ranking badges</li>
              <li>• "Featured" and "Best Seller" highlights</li>
              <li>• Enhanced review count visibility</li>
              <li>• Promotional offer displays</li>
              <li>• Availability status indicators</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCardDemo;