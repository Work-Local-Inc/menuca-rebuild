/**
 * App Layout Component - MenuCA Design System
 * Master layout system supporting all user types and responsive breakpoints
 */

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BottomNavigation, RestaurantBottomNavigation, FloatingCartButton } from '@/components/navigation/BottomNavigation';
import { cn } from '@/lib/utils';

// Icons
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.07 2.82l3.93 3.93M9 18h6a3 3 0 003-3v-4a3 3 0 00-3-3H9a3 3 0 00-3 3v4a3 3 0 003 3z" />
  </svg>
);

export type LayoutType = 'customer' | 'restaurant' | 'admin' | 'minimal';

export interface AppLayoutProps {
  children: React.ReactNode;
  
  /**
   * Layout type determines navigation and structure
   */
  layoutType?: LayoutType;
  
  /**
   * Page title for SEO
   */
  title?: string;
  
  /**
   * Page description for SEO
   */
  description?: string;
  
  /**
   * Show/hide header
   */
  showHeader?: boolean;
  
  /**
   * Show/hide navigation
   */
  showNavigation?: boolean;
  
  /**
   * Header content override
   */
  headerContent?: React.ReactNode;
  
  /**
   * Cart data for floating cart button
   */
  cart?: {
    itemCount: number;
    totalValue?: number;
    onCartClick?: () => void;
  };
  
  /**
   * Notification data
   */
  notifications?: {
    activeOrderCount?: number;
    unreadCount?: number;
  };
  
  /**
   * Background color override
   */
  backgroundColor?: 'white' | 'gray' | 'orange';
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Header Component
 */
const Header: React.FC<{
  layoutType: LayoutType;
  title?: string;
  customContent?: React.ReactNode;
  notifications?: AppLayoutProps['notifications'];
}> = ({ layoutType, title, customContent, notifications }) => {
  const router = useRouter();
  
  if (customContent) {
    return (
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        {customContent}
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            {/* Mobile menu button - only show on larger screens where we have sidebar */}
            <button className="hidden sm:block lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <MenuIcon />
            </button>
            
            {/* Logo */}
            <div className="flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="MenuCA"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">
                MenuCA
              </span>
            </div>
          </div>

          {/* Center - Page title or search */}
          <div className="hidden sm:flex flex-1 justify-center px-8">
            {title && (
              <h1 className="text-lg font-semibold text-gray-900">
                {title}
              </h1>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {(notifications?.unreadCount || 0) > 0 && (
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <BellIcon />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {(notifications?.unreadCount || 0) > 9 ? '9+' : notifications?.unreadCount}
                </span>
              </button>
            )}

            {/* User avatar/menu */}
            <div className="relative">
              <button className="flex items-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  U
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * Sidebar Component for Desktop
 */
const Sidebar: React.FC<{
  layoutType: LayoutType;
}> = ({ layoutType }) => {
  const router = useRouter();
  
  const customerNavItems = [
    { href: '/', label: 'Browse Restaurants', icon: '🏪' },
    { href: '/search', label: 'Search', icon: '🔍' },
    { href: '/orders', label: 'Your Orders', icon: '📋' },
    { href: '/favorites', label: 'Favorites', icon: '❤️' },
    { href: '/account', label: 'Account', icon: '👤' },
  ];
  
  const restaurantNavItems = [
    { href: '/restaurant', label: 'Dashboard', icon: '📊' },
    { href: '/restaurant/orders', label: 'Orders', icon: '📋' },
    { href: '/restaurant/menu', label: 'Menu Management', icon: '📖' },
    { href: '/restaurant/analytics', label: 'Analytics', icon: '📈' },
    { href: '/restaurant/settings', label: 'Settings', icon: '⚙️' },
  ];
  
  const navItems = layoutType === 'restaurant' ? restaurantNavItems : customerNavItems;

  return (
    <aside className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-orange-100 text-orange-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};

/**
 * Main App Layout Component
 * 
 * @example
 * // Customer layout with cart
 * <AppLayout 
 *   layoutType="customer"
 *   title="Browse Restaurants"
 *   cart={{ itemCount: 3, totalValue: 2999 }}
 * >
 *   <RestaurantList />
 * </AppLayout>
 * 
 * @example
 * // Restaurant dashboard layout
 * <AppLayout 
 *   layoutType="restaurant"
 *   title="Dashboard"
 *   notifications={{ unreadCount: 5 }}
 * >
 *   <DashboardContent />
 * </AppLayout>
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  layoutType = 'customer',
  title,
  description,
  showHeader = true,
  showNavigation = true,
  headerContent,
  cart,
  notifications,
  backgroundColor = 'gray',
  className,
}) => {
  const router = useRouter();
  
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    orange: 'bg-orange-50',
  };

  return (
    <>
      <Head>
        <title>{title ? `${title} | MenuCA` : 'MenuCA - Food Delivery & Restaurant Management'}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={cn('min-h-screen flex', backgroundClasses[backgroundColor])}>
        {/* Desktop Sidebar */}
        {showNavigation && layoutType !== 'minimal' && (
          <Sidebar layoutType={layoutType} />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          {showHeader && layoutType !== 'minimal' && (
            <Header
              layoutType={layoutType}
              title={title}
              customContent={headerContent}
              notifications={notifications}
            />
          )}

          {/* Main Content */}
          <main className={cn(
            'flex-1',
            // Add bottom padding on mobile to account for bottom navigation
            showNavigation && layoutType !== 'minimal' && 'pb-20 sm:pb-0',
            className
          )}>
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {showNavigation && layoutType !== 'minimal' && (
          <>
            {layoutType === 'restaurant' ? (
              <RestaurantBottomNavigation
                activeOrderCount={notifications?.activeOrderCount}
              />
            ) : (
              <BottomNavigation
                cartItemCount={cart?.itemCount}
                activeOrderCount={notifications?.activeOrderCount}
              />
            )}
          </>
        )}

        {/* Floating Cart Button */}
        {layoutType === 'customer' && cart && (
          <FloatingCartButton
            itemCount={cart.itemCount}
            totalValue={cart.totalValue}
            onClick={cart.onCartClick}
            show={cart.itemCount > 0}
          />
        )}
      </div>
    </>
  );
};

/**
 * Specialized Layout Components
 */

/**
 * Customer App Layout
 */
export const CustomerLayout: React.FC<Omit<AppLayoutProps, 'layoutType'>> = (props) => (
  <AppLayout {...props} layoutType="customer" />
);

/**
 * Restaurant Dashboard Layout
 */
export const RestaurantLayout: React.FC<Omit<AppLayoutProps, 'layoutType'>> = (props) => (
  <AppLayout {...props} layoutType="restaurant" />
);

/**
 * Admin Dashboard Layout
 */
export const AdminLayout: React.FC<Omit<AppLayoutProps, 'layoutType'>> = (props) => (
  <AppLayout {...props} layoutType="admin" />
);

/**
 * Minimal Layout (for auth pages, onboarding, etc.)
 */
export const MinimalLayout: React.FC<Omit<AppLayoutProps, 'layoutType'>> = (props) => (
  <AppLayout {...props} layoutType="minimal" showHeader={false} showNavigation={false} />
);

/**
 * Page Container Component
 * Provides consistent spacing and max-width for page content
 */
export const PageContainer: React.FC<{
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: boolean;
  className?: string;
}> = ({
  children,
  maxWidth = '7xl',
  padding = true,
  className,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      padding && 'px-4 sm:px-6 lg:px-8 py-6',
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Section Component
 * Provides consistent spacing between page sections
 */
export const Section: React.FC<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}> = ({ children, title, subtitle, className }) => (
  <section className={cn('mb-8', className)}>
    {(title || subtitle) && (
      <div className="mb-6">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-gray-600">
            {subtitle}
          </p>
        )}
      </div>
    )}
    {children}
  </section>
);