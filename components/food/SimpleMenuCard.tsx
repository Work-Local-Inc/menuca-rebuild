/**
 * Simple MenuCard Component - Beautiful and Reliable
 * Inspired by modern food delivery apps
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Clock, Leaf } from 'lucide-react';
import { formatPrice, LocalBusinessProps, badgeStyles, getAvailabilityStyle } from './menuCardUtils';

export interface SimpleMenuCardProps extends LocalBusinessProps {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  preparationTime?: number;
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  hasCustomizations?: boolean;
  onAddToCart?: () => void;
  onCustomize?: () => void;
  className?: string;
}

export const SimpleMenuCard: React.FC<SimpleMenuCardProps> = ({
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
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white ${className}`}>
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-lg overflow-hidden">
          {image && image !== '/placeholder-food.jpg' ? (
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-4xl sm:text-5xl">🍕</div>
            </div>
          )}
          
          {/* Enhanced badges on image */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {isFeatured && (
              <Badge className={badgeStyles.featured}>
                ⭐ Featured
              </Badge>
            )}
            {rankingBadge && (
              <Badge className={badgeStyles.ranking}>
                {rankingBadge}
              </Badge>
            )}
            {isPopular && (
              <Badge className={badgeStyles.popular}>
                Popular
              </Badge>
            )}
            {isVegetarian && (
              <Badge className={badgeStyles.vegetarian}>
                <Leaf className="w-3 h-3" />
                Veg
              </Badge>
            )}
            {isSpicy && (
              <Badge className={badgeStyles.spicy}>
                🌶️ Spicy
              </Badge>
            )}
          </div>
          
          {/* Availability status */}
          {availabilityStyle && (
            <div className="absolute top-3 right-3">
              <Badge className={availabilityStyle.className}>
                {availabilityStyle.text}
              </Badge>
            </div>
          )}

          {/* Rating overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-900">{rating}</span>
            <span className="text-xs text-gray-600">({reviewCount})</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Restaurant name (if provided) */}
          {restaurantName && (
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {restaurantName}
              </span>
            </div>
          )}
          
          {/* Title and description */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
              {name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {description}
            </p>
          </div>
          
          {/* Delivery info row (Uber Eats style) */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-3">
              {deliveryFee !== undefined && (
                <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  {deliveryFee === 0 ? 'Free delivery' : `$${deliveryFee.toFixed(2)} delivery`}
                </span>
              )}
              {deliveryTime && (
                <span>{deliveryTime}</span>
              )}
              {distance && (
                <span>{distance}</span>
              )}
            </div>
            {isClosingSoon && closingTime && (
              <span className="text-orange-600 font-medium">
                Closes {closingTime}
              </span>
            )}
          </div>
          
          {/* Promotion banner */}
          {promoText && availability === 'open' && (
            <div className="bg-green-50 border border-green-200 rounded-md px-2 py-1 mb-3">
              <span className="text-xs font-medium text-green-700">{promoText}</span>
            </div>
          )}
          
          {/* Minimum order notice */}
          {minOrderAmount && (
            <div className="text-xs text-gray-500 mb-3">
              Minimum order: ${minOrderAmount}
            </div>
          )}

          {/* Prep time */}
          {preparationTime && (
            <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
              <Clock className="w-4 h-4" />
              <span>{preparationTime} min</span>
            </div>
          )}

          {/* Price and action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            <Button
              onClick={hasCustomizations ? onCustomize : onAddToCart}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
              size="sm"
              disabled={availability === 'closed'}
            >
              {availability === 'closed' ? 'Closed' : hasCustomizations ? 'Customize' : 'Add'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};