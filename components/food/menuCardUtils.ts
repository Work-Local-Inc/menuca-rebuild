/**
 * Shared utilities for MenuCard components
 * Prevents code duplication and ensures consistency
 */

/**
 * Formats price for display in Canadian dollars
 * @param amount - Price amount in dollars (not cents)
 * @returns Formatted price string (e.g., "$18.99")
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
};

/**
 * Enhanced menu card props for local business support
 * Extracted for better type safety and reusability
 */
export interface LocalBusinessProps {
  // Enhanced local business features (inspired by Uber Eats)
  deliveryFee?: number;
  deliveryTime?: string; // "15-25 min"
  distance?: string; // "0.8 km"
  restaurantName?: string;
  minOrderAmount?: number;
  isFeatured?: boolean;
  rankingBadge?: string; // "#1 most liked", "Best seller", etc.
  closingTime?: string; // "Closes at 9:00 PM"
  isClosingSoon?: boolean;
  availability?: 'open' | 'closing_soon' | 'closed';
  promoText?: string; // "Save $5 on orders $25+"
}

/**
 * Badge configuration for consistent styling
 */
export const badgeStyles = {
  featured: 'bg-purple-600 text-white text-xs font-bold px-2 py-1 shadow-lg',
  ranking: 'bg-orange-600 text-white text-xs font-bold px-2 py-1 shadow-lg',
  popular: 'bg-red-500 text-white text-xs font-medium px-2 py-1',
  vegetarian: 'bg-green-500 text-white text-xs font-medium px-2 py-1 flex items-center gap-1',
  spicy: 'bg-orange-500 text-white text-xs font-medium px-2 py-1',
  closingSoon: 'bg-yellow-500 text-white text-xs font-bold px-2 py-1 shadow-lg',
  closed: 'bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg'
} as const;

/**
 * Gets the appropriate availability badge style and text
 * @param availability - Current availability status
 * @returns Object with className and text for the badge
 */
export const getAvailabilityStyle = (availability: 'open' | 'closing_soon' | 'closed') => {
  switch (availability) {
    case 'closing_soon':
      return {
        className: badgeStyles.closingSoon,
        text: 'Closing Soon'
      };
    case 'closed':
      return {
        className: badgeStyles.closed,
        text: 'Closed'
      };
    default:
      return null;
  }
};