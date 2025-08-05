/**
 * Compact MenuCard Component - Mobile-First Design
 * Industry standard: Multiple items per screen like Uber Eats
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Clock, Leaf } from 'lucide-react';
import { SimpleMenuCardProps } from './SimpleMenuCard';
import { formatPrice, getAvailabilityStyle } from './menuCardUtils';

export const CompactMenuCard: React.FC<SimpleMenuCardProps> = ({
  id,
  name,
  description,
  price,
  originalPrice,
  image,
  preparationTime,
  rating = 4.5,
  reviewCount = 50,
  isPopular,
  isVegetarian,
  isSpicy,
  hasCustomizations,
  onAddToCart,
  onCustomize,
  className,
  // Enhanced props
  deliveryFee,
  deliveryTime,
  distance,
  restaurantName,
  minOrderAmount,
  isFeatured,
  rankingBadge,
  closingTime,
  isClosingSoon,
  availability = 'open',
  promoText
}) => {
  const availabilityStyle = getAvailabilityStyle(availability);

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 border border-gray-200 bg-white ${className}`}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Compact Image */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-l-lg overflow-hidden flex-shrink-0">
            {image && image !== '/placeholder-food.jpg' ? (
              <img 
                src={image} 
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-2xl">🍕</div>
              </div>
            )}
            
            {/* Compact badges */}
            {(isFeatured || rankingBadge || isPopular) && (
              <div className="absolute top-1 left-1">
                {isFeatured && (
                  <Badge className="bg-purple-600 text-white text-xs font-bold px-1 py-0.5 shadow-sm">
                    ⭐
                  </Badge>
                )}
                {rankingBadge && !isFeatured && (
                  <Badge className="bg-orange-600 text-white text-xs font-bold px-1 py-0.5 shadow-sm">
                    #1
                  </Badge>
                )}
                {isPopular && !isFeatured && !rankingBadge && (
                  <Badge className="bg-red-500 text-white text-xs font-medium px-1 py-0.5">
                    🔥
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            {/* Restaurant name */}
            {restaurantName && (
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {restaurantName}
                </span>
              </div>
            )}

            {/* Title and badges row */}
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1">
                {name}
              </h3>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                {isVegetarian && <Leaf className="w-3 h-3 text-green-500" />}
                {isSpicy && <span className="text-xs">🌶️</span>}
                {availabilityStyle && (
                  <Badge className={`${availabilityStyle.className.replace('px-2 py-1', 'px-1.5 py-0.5')}`}>
                    {availability === 'closing_soon' ? '⏰' : '🔒'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 line-clamp-1 mb-2">
              {description}
            </p>

            {/* Info row */}
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{rating}</span>
                  <span className="text-gray-400">({reviewCount})</span>
                </div>
                {preparationTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{preparationTime}m</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery info */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-2">
                {deliveryFee !== undefined && (
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                    {deliveryFee === 0 ? 'Free delivery' : `$${deliveryFee.toFixed(2)}`}
                  </span>
                )}
                {deliveryTime && (
                  <span>{deliveryTime}</span>
                )}
                {distance && (
                  <span>{distance}</span>
                )}
              </div>
            </div>

            {/* Price and action row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {formatPrice(price)}
                </span>
                {originalPrice && originalPrice > price && (
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              <Button
                onClick={hasCustomizations ? onCustomize : onAddToCart}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-3 py-1 rounded-md transition-colors disabled:bg-gray-400 text-xs"
                size="sm"
                disabled={availability === 'closed'}
              >
                {availability === 'closed' ? 'Closed' : hasCustomizations ? 'Customize' : 'Add'}
              </Button>
            </div>

            {/* Promo banner */}
            {promoText && availability === 'open' && (
              <div className="bg-green-50 border border-green-200 rounded-md px-2 py-1 mt-2">
                <span className="text-xs font-medium text-green-700">{promoText}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};