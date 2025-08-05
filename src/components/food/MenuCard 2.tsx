/**
 * MenuCard Component - MenuCA Design System
 * Inspired by DoorDash, Uber Eats, and Grubhub menu item patterns
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Icons (using Lucide React or similar)
const StarIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For discounted items
  image: string;
  imageAlt?: string;
  
  // Social proof & ratings (DoorDash pattern)
  rating?: number;
  reviewCount?: number;
  
  // Badges (Uber Eats pattern)
  badges?: Array<{
    text: string;
    variant: 'popular' | 'spicy' | 'vegetarian' | 'vegan' | 'gluten-free' | 'new';
  }>;
  
  // Availability states
  availability: 'available' | 'low_stock' | 'sold_out';
  prepTime?: string; // "15-20 min"
  
  // Customization options
  hasCustomizations?: boolean;
  customizationCount?: number;
  
  // Actions
  onAddToCart?: (itemId: string) => void;
  onViewDetails?: (itemId: string) => void;
  
  // Styling
  className?: string;
  layout?: 'horizontal' | 'vertical'; // Different layouts for different contexts
  showImage?: boolean;
  
  // Loading state
  isAddingToCart?: boolean;
}

/**
 * Badge color mapping based on type
 */
const badgeVariants = {
  popular: 'bg-orange-100 text-orange-800 border-orange-200',
  spicy: 'bg-red-100 text-red-800 border-red-200',
  vegetarian: 'bg-green-100 text-green-800 border-green-200', 
  vegan: 'bg-green-100 text-green-800 border-green-200',
  'gluten-free': 'bg-blue-100 text-blue-800 border-blue-200',
  new: 'bg-purple-100 text-purple-800 border-purple-200',
};

/**
 * Price formatting utility
 */
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(price / 100); // Assuming price is in cents
};

/**
 * MenuCard Component
 * 
 * @example
 * // Horizontal layout (like DoorDash)
 * <MenuCard
 *   id="margherita-pizza"
 *   name="Margherita Pizza"
 *   description="Fresh tomatoes, mozzarella, basil, olive oil"
 *   price={1299}
 *   image="/images/margherita.jpg"
 *   rating={4.5}
 *   reviewCount={142}
 *   badges={[{ text: 'Popular', variant: 'popular' }]}
 *   availability="available"
 *   hasCustomizations={true}
 *   onAddToCart={handleAddToCart}
 *   layout="horizontal"
 * />
 */
export const MenuCard: React.FC<MenuItemProps> = ({
  id,
  name,
  description,
  price,
  originalPrice,
  image,
  imageAlt,
  rating,
  reviewCount,
  badges = [],
  availability,
  prepTime,
  hasCustomizations = false,
  customizationCount,
  onAddToCart,
  onViewDetails,
  className,
  layout = 'horizontal',
  showImage = true,
  isAddingToCart = false,
}) => {
  const isAvailable = availability === 'available';
  const isLowStock = availability === 'low_stock';
  const isSoldOut = availability === 'sold_out';
  
  const handleAddToCart = () => {
    if (hasCustomizations || customizationCount) {
      // If item has customizations, show details first
      onViewDetails?.(id);
    } else {
      // Simple item, add directly to cart
      onAddToCart?.(id);
    }
  };

  const cardClasses = cn(
    // Base card styles
    'group relative bg-white rounded-lg border border-gray-200 overflow-hidden',
    'transition-all duration-200 ease-in-out',
    'hover:shadow-md hover:border-gray-300',
    
    // Layout specific styles
    layout === 'horizontal' ? 'flex' : 'flex-col',
    
    // Availability states
    isSoldOut && 'opacity-60',
    
    className
  );

  return (
    <div className={cardClasses}>
      {/* Product Image */}
      {showImage && (
        <div className={cn(
          'relative overflow-hidden bg-gray-100',
          layout === 'horizontal' ? 'w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0' : 'w-full h-48'
        )}>
          <img
            src={image}
            alt={imageAlt || name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Sold out overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-sm font-medium px-2 py-1 bg-black bg-opacity-60 rounded">
                Sold Out
              </span>
            </div>
          )}
          
          {/* Badges overlay */}
          {badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {badges.slice(0, 2).map((badge, index) => (
                <span
                  key={index}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full border',
                    badgeVariants[badge.variant]
                  )}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'flex-1 p-4',
        layout === 'horizontal' ? 'min-w-0' : ''
      )}>
        {/* Header with name and rating */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {name}
            </h3>
            
            {/* Rating and reviews */}
            {rating && (
              <div className="flex items-center gap-1 mt-1">
                <StarIcon />
                <span className="text-sm text-gray-600">
                  {rating}
                </span>
                {reviewCount && (
                  <span className="text-sm text-gray-500">
                    ({reviewCount})
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Price */}
          <div className="text-right ml-4">
            <div className="flex items-center gap-2">
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(price)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {description}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {/* Prep time */}
            {prepTime && (
              <div className="flex items-center gap-1">
                <ClockIcon />
                <span>{prepTime}</span>
              </div>
            )}
            
            {/* Low stock indicator */}
            {isLowStock && (
              <span className="text-orange-600 font-medium">
                Low stock
              </span>
            )}
            
            {/* Customization indicator */}
            {hasCustomizations && (
              <span className="text-blue-600">
                Customizable
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          {isAvailable && (
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isSoldOut || isAddingToCart}
              loading={isAddingToCart}
              leftIcon={!isAddingToCart && !hasCustomizations ? <PlusIcon /> : undefined}
              className="ml-4 flex-shrink-0"
            >
              {hasCustomizations 
                ? `Customize` 
                : isAddingToCart 
                  ? 'Adding...' 
                  : 'Add'
              }
            </Button>
          )}
        </div>

        {/* Additional badges (if not shown on image) */}
        {!showImage && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full border',
                  badgeVariants[badge.variant]
                )}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Vertical Menu Card variant for grid layouts
 */
export const MenuCardVertical: React.FC<MenuItemProps> = (props) => (
  <MenuCard {...props} layout="vertical" />
);

/**
 * Compact Menu Card variant for lists
 */
export const MenuCardCompact: React.FC<MenuItemProps> = (props) => (
  <MenuCard {...props} layout="horizontal" showImage={false} />
);