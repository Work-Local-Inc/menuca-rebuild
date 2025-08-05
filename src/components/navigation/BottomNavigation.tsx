/**
 * Bottom Navigation Component - MenuCA Design System
 * Mobile-first navigation inspired by DoorDash and Uber Eats
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Icons - using Lucide React or similar icon library
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ShoppingCartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
  </svg>
);

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    count?: number;
    variant?: 'default' | 'destructive' | 'secondary';
    showDot?: boolean;
  };
  isActive?: boolean;
}

export interface BottomNavigationProps {
  /**
   * Navigation items to display
   */
  items?: NavigationItem[];
  
  /**
   * Cart item count for cart badge
   */
  cartItemCount?: number;
  
  /**
   * Active order count for orders badge
   */
  activeOrderCount?: number;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Hide on specific routes
   */
  hideOnRoutes?: string[];
}

/**
 * Default navigation items for customer app
 */
const defaultCustomerNavigation: NavigationItem[] = [
  {
    id: 'browse',
    label: 'Browse',
    href: '/',
    icon: HomeIcon,
  },
  {
    id: 'search',
    label: 'Search',
    href: '/search',
    icon: SearchIcon,
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/orders',
    icon: ReceiptIcon,
  },
  {
    id: 'account',
    label: 'Account',
    href: '/account',
    icon: UserIcon,
  },
];

/**
 * Bottom Navigation Component
 * 
 * Features:
 * - Touch-friendly 44px+ touch targets
 * - Active state indication
 * - Badge support for notifications
 * - Responsive design
 * - Accessibility support
 * 
 * @example
 * <BottomNavigation 
 *   cartItemCount={3}
 *   activeOrderCount={1}
 * />
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items = defaultCustomerNavigation,
  cartItemCount = 0,
  activeOrderCount = 0,
  className,
  hideOnRoutes = [],
}) => {
  const router = useRouter();
  
  // Hide navigation on specified routes
  if (hideOnRoutes.includes(router.pathname)) {
    return null;
  }
  
  // Add cart item count badge to orders tab
  const navigationItems = items.map(item => {
    if (item.id === 'orders' && activeOrderCount > 0) {
      return {
        ...item,
        badge: {
          count: activeOrderCount,
          variant: 'destructive' as const,
        },
      };
    }
    return item;
  });

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 sm:hidden" />
      
      {/* Bottom Navigation */}
      <nav
        className={cn(
          // Base styles
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white border-t border-gray-200',
          'safe-area-pb', // Safe area padding for iOS
          
          // Hide on larger screens where we use sidebar
          'sm:hidden',
          
          className
        )}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  // Base styles
                  'flex flex-col items-center justify-center',
                  'min-h-[44px] min-w-[44px] px-3 py-2',
                  'rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                  
                  // Active/inactive states
                  isActive
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  
                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute -top-2 -right-2">
                      {item.badge.showDot ? (
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      ) : item.badge.count ? (
                        <Badge
                          variant={item.badge.variant || 'destructive'}
                          className="min-w-[18px] h-[18px] text-xs font-bold px-1 py-0 flex items-center justify-center"
                        >
                          {item.badge.count > 99 ? '99+' : item.badge.count}
                        </Badge>
                      ) : null}
                    </div>
                  )}
                </div>
                
                <span className={cn(
                  'text-xs font-medium mt-1',
                  isActive ? 'text-orange-600' : 'text-gray-600'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="pb-safe" />
      </nav>
    </>
  );
};

/**
 * Floating Cart Button Component
 * Separate from main navigation for better UX
 */
export interface FloatingCartButtonProps {
  /**
   * Number of items in cart
   */
  itemCount?: number;
  
  /**
   * Total cart value
   */
  totalValue?: number;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Show/hide the button
   */
  show?: boolean;
  
  className?: string;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  itemCount = 0,
  totalValue,
  onClick,
  show = true,
  className,
}) => {
  if (!show || itemCount === 0) {
    return null;
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(price / 100);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'fixed bottom-24 right-4 z-50',
        'flex items-center gap-2 px-4 py-3',
        'bg-orange-500 text-white rounded-full shadow-lg',
        'transition-all duration-300 ease-in-out',
        'hover:bg-orange-600 hover:shadow-xl',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
        
        // Show on mobile only
        'sm:hidden',
        
        className
      )}
    >
      <div className="relative">
        <ShoppingCartIcon className="w-5 h-5" />
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] text-xs font-bold px-1 py-0 bg-white text-orange-600"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      </div>
      
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium">Cart</span>
        {totalValue && (
          <span className="text-xs opacity-90">
            {formatPrice(totalValue)}
          </span>
        )}
      </div>
    </button>
  );
};

/**
 * Restaurant Bottom Navigation
 * Different navigation items for restaurant dashboard
 */
const restaurantNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/restaurant',
    icon: HomeIcon,
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/restaurant/orders',
    icon: ReceiptIcon,
  },
  {
    id: 'menu',
    label: 'Menu',
    href: '/restaurant/menu',
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/restaurant/analytics',
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m0 0v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export const RestaurantBottomNavigation: React.FC<Omit<BottomNavigationProps, 'items'>> = (props) => (
  <BottomNavigation {...props} items={restaurantNavigation} />
);